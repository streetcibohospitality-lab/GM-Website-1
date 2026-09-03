import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardAccessDeniedError, getCurrentProfile } from "@/lib/authz";
import { recordSessionEvent } from "@/lib/audit";
import { DeviceAccessError, enforceApprovedDevice } from "@/lib/device-security";
import { enforceSingleActiveSession, SingleSessionError } from "@/lib/single-session";
import type { Profile } from "@/lib/types";

async function identityProfile(path: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
  await recordSessionEvent("login", { path });
  try {
    return await getCurrentProfile();
  } catch (error) {
    if (error instanceof DashboardAccessDeniedError) {
      await recordSessionEvent("access_denied", { path, reason: error.reason });
      redirect(`/access-denied?reason=${encodeURIComponent(error.reason)}`);
    }
    throw error;
  }
}

/** Identity + exact three-owner allowlist. Used only by MFA/device enrollment gates. */
export async function requireIdentityPageProfile(path: string): Promise<Profile> {
  return identityProfile(path);
}

/** Full command-center gate: identity + owner registry + approved device + one active session. */
export async function requirePageProfile(path: string): Promise<Profile> {
  const profile = await identityProfile(path);
  try {
    const device = await enforceApprovedDevice(profile, path);
    await enforceSingleActiveSession(profile, path, device.deviceId);
    return profile;
  } catch (error) {
    if (error instanceof DeviceAccessError) {
      if (error.reason === "device_registration_required") redirect(`/device/register?next=${encodeURIComponent(path)}`);
      if (error.reason === "device_approval_pending") redirect("/device/pending");
      redirect("/access-denied?reason=device_not_approved");
    }
    if (error instanceof SingleSessionError) {
      if (error.reason === "session_expired") redirect("/sign-in?reason=session_expired");
      redirect("/access-denied?reason=concurrent_session_rejected");
    }
    throw error;
  }
}

export async function requireIdentityApiProfile(path: string): Promise<{ profile: Profile } | { response: Response }> {
  const { userId } = await auth();
  if (!userId) return { response: Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
  await recordSessionEvent("login", { path });
  try {
    return { profile: await getCurrentProfile() };
  } catch (error) {
    if (error instanceof DashboardAccessDeniedError) {
      await recordSessionEvent("access_denied", { path, reason: error.reason });
      return { response: Response.json({ error: "This identity is not an authorized Command Center Owner", code: error.reason.toUpperCase() }, { status: 403, headers: { "Cache-Control": "no-store" } }) };
    }
    throw error;
  }
}

export async function requireApiProfile(path: string): Promise<{ profile: Profile } | { response: Response }> {
  const access = await requireIdentityApiProfile(path);
  if ("response" in access) return access;
  try {
    const device = await enforceApprovedDevice(access.profile, path);
    await enforceSingleActiveSession(access.profile, path, device.deviceId);
    return access;
  } catch (error) {
    if (error instanceof DeviceAccessError) {
      return { response: Response.json({ error: "Approved Owner device required", code: error.reason.toUpperCase() }, { status: error.reason === "device_approval_pending" ? 423 : 403, headers: { "Cache-Control": "no-store" } }) };
    }
    if (error instanceof SingleSessionError) {
      const expired = error.reason === "session_expired";
      return { response: Response.json({ error: expired ? "Secure session expired" : "Another session is active", code: expired ? "SESSION_EXPIRED" : "CONCURRENT_SESSION_REJECTED" }, { status: expired ? 401 : 409, headers: { "Cache-Control": "no-store" } }) };
    }
    throw error;
  }
}
