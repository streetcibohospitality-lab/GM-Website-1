import { auth } from "@clerk/nextjs/server";
import { requireApiProfile } from "@/lib/access-control";
import { db } from "@/lib/db";

export async function GET() {
  const access = await requireApiProfile("/api/security/session/status");
  if ("response" in access) return access.response;
  const { sessionId } = await auth();
  if (!sessionId) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const rows = await db()`SELECT expires_at FROM active_sessions WHERE session_id=${sessionId} AND user_id=${access.profile.id} AND revoked_at IS NULL LIMIT 1`;
  if (!rows.length) return Response.json({ error: "Secure session unavailable", code: "SESSION_UNAVAILABLE" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ok: true, expiresAt: rows[0].expires_at }, { headers: { "Cache-Control": "no-store" } });
}
