import { requireIdentityApiProfile } from "@/lib/access-control";
import { currentDeviceStatus } from "@/lib/device-security";
export async function GET() {
  const access = await requireIdentityApiProfile("/api/security/device/status");
  if ("response" in access) return access.response;
  return Response.json(await currentDeviceStatus(access.profile), { headers: { "Cache-Control": "no-store" } });
}
