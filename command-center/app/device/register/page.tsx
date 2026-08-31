import Image from "next/image";
import { redirect } from "next/navigation";
import { DeviceRegistration } from "@/components/device-registration";
import { requireIdentityPageProfile } from "@/lib/access-control";
import { hasRecentMfaVerification, mfaMaxAges } from "@/lib/mfa";
export const dynamic = "force-dynamic";
function safeNext(value: string | string[] | undefined) { const raw = Array.isArray(value) ? value[0] : value; if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/overview"; return raw; }
export default async function DeviceRegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = safeNext((await searchParams).next);
  const profile = await requireIdentityPageProfile("/device/register");
  if (!profile.mfa_enabled) redirect("/security/setup");
  if (!(await hasRecentMfaVerification(mfaMaxAges.appSeconds))) redirect(`/security/verify?next=${encodeURIComponent(`/device/register?next=${encodeURIComponent(nextPath)}`)}`);
  return <main className="secure-gate"><section className="secure-gate__brand"><Image src="/grub-monkeys-logo.png" width={232} height={84} alt="Grub Monkeys" priority/><span>COMMAND CENTER / TRUST GATE</span><h1>Known Owners.<br/>Known devices.</h1><p>Every Owner verifies an independent authenticator before a browser can become trusted. The first verified browser bootstraps once; later devices require Owner approval.</p></section><DeviceRegistration nextPath={nextPath}/><div className="gate-user">SIGNED IN / {profile.display_name.toUpperCase()}</div></main>;
}
