import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { recordSecurityEvent, recordSessionEvent } from "@/lib/audit";
import { sendOwnerSecurityAlert } from "@/lib/owner-alerts";
import type { Profile } from "@/lib/types";

const DEVICE_COOKIE = "__Host-gmcc_device";
const MAX_AGE = 180 * 24 * 60 * 60;
export type DeviceReason = "device_registration_required" | "device_approval_pending" | "device_not_approved";
export class DeviceAccessError extends Error { constructor(public reason: DeviceReason) { super(reason); this.name = "DeviceAccessError"; } }
function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
async function token() { return (await cookies()).get(DEVICE_COOKIE)?.value || ""; }

async function revokeCurrentSession(profile: Profile, path: string, reason: string) {
  const { sessionId } = await auth();
  if (!sessionId) return;
  await Promise.allSettled([
    recordSessionEvent("access_denied", { path, reason }),
    recordSecurityEvent("device_access_blocked", { severity: "high", metadata: { path, reason } }),
    sendOwnerSecurityAlert({ title: "Blocked device attempted Command Center access", type: "device_access_blocked", profile, sessionId, path, metadata: { reason } }),
  ]);
  await db()`DELETE FROM mfa_session_verifications WHERE session_id=${sessionId}`.catch(() => undefined);
  try { const clerk = await clerkClient(); await clerk.sessions.revokeSession(sessionId); } catch (error) {
    console.error("Clerk session revocation failed", error);
    await recordSecurityEvent("clerk_session_revoke_failed", { severity: "high", metadata: { sessionId, path, reason } }).catch(() => undefined);
  }
}

export async function enforceApprovedDevice(profile: Profile, path: string) {
  const raw = await token();
  if (!raw) throw new DeviceAccessError("device_registration_required");
  const rows = await db()`SELECT id,status FROM approved_devices WHERE user_id=${profile.id} AND device_token_hash=${hashToken(raw)} LIMIT 1`;
  if (!rows.length) throw new DeviceAccessError("device_registration_required");
  const device = rows[0] as { id: string; status: string };
  if (device.status === "pending") throw new DeviceAccessError("device_approval_pending");
  if (device.status !== "approved") {
    await revokeCurrentSession(profile, path, `device_${device.status}`);
    throw new DeviceAccessError("device_not_approved");
  }
  await db()`UPDATE approved_devices SET last_seen_at=NOW() WHERE id=${device.id} AND user_id=${profile.id} AND status='approved'`;
  return { deviceId: device.id };
}

/**
 * First-ever device for each Owner may bootstrap only after independent MFA is already verified.
 * Every later browser/device is pending until another already-trusted Owner session approves it.
 */
export async function registerCurrentDevice(profile: Profile, path: string, allowFirstDeviceBootstrap: boolean) {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE)?.value || "";
  if (existing) {
    const rows = await db()`SELECT id,status FROM approved_devices WHERE user_id=${profile.id} AND device_token_hash=${hashToken(existing)} LIMIT 1`;
    if (rows.length) return { status: String(rows[0].status) as "pending" | "approved" | "denied" | "revoked", deviceId: String(rows[0].id) };
  }

  const prior = await db()`SELECT COUNT(*)::int AS count FROM approved_devices WHERE user_id=${profile.id}`;
  const firstEver = Number(prior[0]?.count || 0) === 0;
  const bootstrap = firstEver && allowFirstDeviceBootstrap;
  const raw = randomBytes(32).toString("base64url");
  const rows = await db()`
    INSERT INTO approved_devices(user_id,device_token_hash,status,first_seen_at,last_seen_at,approved_by,approved_at)
    VALUES(${profile.id},${hashToken(raw)},${bootstrap ? "approved" : "pending"},NOW(),NOW(),${bootstrap ? profile.id : null},${bootstrap ? new Date().toISOString() : null})
    RETURNING id,status
  `;
  const deviceId = String(rows[0].id);
  store.set(DEVICE_COOKIE, raw, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: MAX_AGE });

  if (bootstrap) {
    await recordSecurityEvent("owner_first_device_bootstrapped", { severity: "watch", metadata: { deviceId, path } });
    return { status: "approved" as const, deviceId };
  }

  await Promise.allSettled([
    recordSecurityEvent("device_registration_pending", { severity: "watch", metadata: { deviceId, path } }),
    sendOwnerSecurityAlert({ title: "New Owner device needs approval", type: "device_approval_requested", profile, path, metadata: { deviceId } }),
  ]);
  return { status: "pending" as const, deviceId };
}

export async function currentDeviceStatus(profile: Profile) {
  const raw = await token();
  if (!raw) return { status: "unregistered" as const };
  const rows = await db()`SELECT id,status,approved_at,revoked_at FROM approved_devices WHERE user_id=${profile.id} AND device_token_hash=${hashToken(raw)} LIMIT 1`;
  if (!rows.length) return { status: "unregistered" as const };
  return { status: String(rows[0].status) as "pending" | "approved" | "denied" | "revoked", deviceId: String(rows[0].id) };
}
