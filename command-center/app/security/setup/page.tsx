import Image from "next/image";
import { redirect } from "next/navigation";
import { requireIdentityPageProfile } from "@/lib/access-control";
import { ensureEnrollmentSecret } from "@/lib/mfa";
import { MfaSetupForm } from "@/components/mfa-setup-form";
export const dynamic="force-dynamic";
export default async function Setup(){const profile=await requireIdentityPageProfile("/security/setup");if(profile.mfa_enabled)redirect("/security/verify?next=/overview");const secret=await ensureEnrollmentSecret(profile);return <main className="secure-gate"><section className="secure-gate__brand"><Image src="/grub-monkeys-logo.png" width={232} height={84} alt="Grub Monkeys" priority/><span>COMMAND CENTER / SECOND FACTOR</span><h1>Identity is not enough.</h1><p>Bind an independent standards-based authenticator before management information is displayed.</p></section><MfaSetupForm secret={secret} email={profile.email}/></main>;}
