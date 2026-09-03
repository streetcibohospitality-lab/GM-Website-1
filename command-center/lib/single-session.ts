import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { recordSecurityEvent } from "@/lib/audit";
import { sendOwnerSecurityAlert } from "@/lib/owner-alerts";
import type { Profile } from "@/lib/types";

const ABSOLUTE_SESSION_SECONDS = 2 * 60 * 60;

export class SingleSessionError extends Error { constructor(public reason = "concurrent_session_rejected") { super(reason); this.name = "SingleSessionError"; } }
async function revokeClerk(sessionId: string) {
  await db()`DELETE FROM mfa_session_verifications WHERE session_id=${sessionId}`.catch(() => undefined);
  try { const clerk = await clerkClient(); await clerk.sessions.revokeSession(sessionId); } catch (error) {
    console.error("Clerk session revocation failed", error);
    await recordSecurityEvent("clerk_session_revoke_failed", { severity: "high", metadata: { sessionId } }).catch(() => undefined);
  }
}

export async function enforceSingleActiveSession(profile: Profile, path: string, deviceId: string | null) {
  const { sessionId } = await auth();
  if (!sessionId) throw new SingleSessionError();
  const now = Date.now();
  const expires = new Date(now + ABSOLUTE_SESSION_SECONDS * 1000).toISOString();

  const thisSession = await db()`SELECT session_id,expires_at,revoked_at,revoke_reason FROM active_sessions WHERE session_id=${sessionId} AND user_id=${profile.id} LIMIT 1`;
  if (thisSession.length) {
    const row = thisSession[0] as { expires_at: string; revoked_at: string | null; revoke_reason: string | null };
    if (row.revoked_at || new Date(row.expires_at).getTime() <= now) {
      await revokeClerk(sessionId);
      throw new SingleSessionError("session_expired");
    }
  }

  // Retire stale rows belonging to older sessions before evaluating uniqueness.
  await db()`UPDATE active_sessions SET revoked_at=NOW(),revoke_reason=COALESCE(revoke_reason,'expired') WHERE user_id=${profile.id} AND session_id<>${sessionId} AND revoked_at IS NULL AND expires_at<=NOW()`;

  const current = await db()`SELECT session_id,started_at,expires_at FROM active_sessions WHERE user_id=${profile.id} AND revoked_at IS NULL ORDER BY started_at DESC LIMIT 1`;
  if (!current.length) {
    try {
      await db()`INSERT INTO active_sessions(session_id,user_id,device_id,started_at,last_seen_at,expires_at) VALUES(${sessionId},${profile.id},${deviceId},NOW(),NOW(),${expires})`;
      return;
    } catch {
      throw new SingleSessionError();
    }
  }

  const activeId = String(current[0].session_id);
  if (activeId === sessionId) {
    await db()`UPDATE active_sessions SET last_seen_at=NOW(),device_id=${deviceId} WHERE session_id=${sessionId}`;
    return;
  }

  // A new authenticated session takes over and revokes the older Clerk session.
  await db()`UPDATE active_sessions SET revoked_at=NOW(),revoke_reason='replaced_by_new_session' WHERE user_id=${profile.id} AND session_id=${activeId} AND revoked_at IS NULL`;
  try {
    await db()`INSERT INTO active_sessions(session_id,user_id,device_id,started_at,last_seen_at,expires_at) VALUES(${sessionId},${profile.id},${deviceId},NOW(),NOW(),${expires})`;
  } catch {
    throw new SingleSessionError();
  }
  await Promise.allSettled([
    revokeClerk(activeId),
    recordSecurityEvent("concurrent_session_replaced", { severity: "high", metadata: { path, revokedSessionId: activeId } }),
    sendOwnerSecurityAlert({ title: "Owner account opened a new session", type: "concurrent_session_replaced", profile, sessionId, path, metadata: { revokedSessionId: activeId } }),
  ]);
}

export async function clearActiveSession(profile: Profile, sessionId: string, reason = "logout") {
  await db()`UPDATE active_sessions SET revoked_at=COALESCE(revoked_at,NOW()),revoke_reason=COALESCE(revoke_reason,${reason}) WHERE user_id=${profile.id} AND session_id=${sessionId}`.catch(() => undefined);
}
