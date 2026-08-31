import Image from "next/image";
import { SignOutButton } from "@clerk/nextjs";
export const dynamic = "force-dynamic";
export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const reason = String((await searchParams).reason || "unauthorized");
  const ownerReason = ["not_an_authorized_owner","owner_registry_disabled","owner_identity_mismatch","owner_identity_not_bound","verified_owner_email_required"].includes(reason);
  return <main className="secure-gate"><section className="secure-gate__brand"><Image src="/grub-monkeys-logo.png" width={232} height={84} alt="Grub Monkeys" priority/><span>COMMAND CENTER / ACCESS CONTROL</span><h1>Access held.</h1><p>{ownerReason ? "This Clerk identity is not one of the three authorized Grub Monkeys Owner identities, or its verified identity binding does not match the locked Owner registry." : "This device or session is not currently authorized for Command Center data."}</p></section><section className="auth-control-card"><span className="auth-kicker">DENIED / AUDITED</span><h2>No business data was released.</h2><p>The access decision has been recorded. Authorized Owners can review trusted devices and session events from Security.</p><SignOutButton redirectUrl="/sign-in"><button className="command-button full">SIGN OUT <span>→</span></button></SignOutButton></section></main>;
}
