import { auth } from "@clerk/nextjs/server";
import { requireIdentityApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { enforceSameOrigin } from "@/lib/http-security";

export async function POST(req: Request) {
  const same = enforceSameOrigin(req);
  if (same) return same;
  const access = await requireIdentityApiProfile("/api/security/session/lock");
  if ("response" in access) return access.response;
  const { sessionId } = await auth();
  if (!sessionId) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  await db()`DELETE FROM mfa_session_verifications WHERE user_id=${access.profile.id} AND session_id=${sessionId}`;
  await recordSecurityEvent("session_locked_for_inactivity", { severity: "info" });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
