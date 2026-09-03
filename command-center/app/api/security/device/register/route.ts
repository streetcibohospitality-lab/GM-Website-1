import { requireIdentityApiProfile } from "@/lib/access-control";
import { registerCurrentDevice } from "@/lib/device-security";
import { consumeRateLimit, enforceSameOrigin, rateLimitResponse } from "@/lib/http-security";
import { hasRecentMfaVerification, mfaMaxAges } from "@/lib/mfa";

export async function POST(req: Request) {
  const same = enforceSameOrigin(req);
  if (same) return same;
  const access = await requireIdentityApiProfile("/api/security/device/register");
  if ("response" in access) return access.response;
  const rate = await consumeRateLimit("dash-device-register", 3, 86400, "user");
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);
  if (!(await hasRecentMfaVerification(mfaMaxAges.appSeconds))) {
    return Response.json({ error: "Authenticator verification is required before registering a device", code: "MFA_REQUIRED" }, { status: 428, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(await registerCurrentDevice(access.profile, "/api/security/device/register", true), { headers: { "Cache-Control": "no-store" } });
}
