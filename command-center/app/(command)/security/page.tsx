import Link from "next/link";
import { PageLead, Panel, SectionHead, StatePill } from "@/components/ui";
import { OWNER_DIRECTORY } from "@/lib/owner-directory";
import { db } from "@/lib/db";
import { requirePageProfile } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requirePageProfile("/security");
  const registry = await db()`SELECT email,display_name,active,bound_at FROM owner_access_registry ORDER BY display_name`;
  const deviceCount = await db()`SELECT COUNT(*)::int AS count FROM approved_devices WHERE status='approved'`;
  const activeSessions = await db()`SELECT COUNT(*)::int AS count FROM active_sessions WHERE revoked_at IS NULL AND expires_at>NOW()`;
  const openAlerts = await db()`SELECT COUNT(*)::int AS count FROM security_events WHERE severity IN ('high','critical') AND created_at>NOW()-INTERVAL '30 days'`;
  const ownerRows = new Map(registry.map((row) => [String(row.email), row]));

  return <>
    <PageLead code="19" eyebrow="SECURITY / OWNER CONTROL / AUDIT" title="Three identities. No fallback access." copy="The Command Center accepts exactly three verified Owner identities. Each Owner adds an independent authenticator, uses trusted devices, is limited to one live session, and leaves an append-only audit trail." action={<Link href="/security/devices" className="command-button">DEVICE CONTROL <span>→</span></Link>}/>
    <div className="security-kpis">
      <div><span>AUTHORIZED OWNERS</span><strong>03</strong><small>FIXED REGISTRY</small></div>
      <div><span>APPROVED DEVICES</span><strong>{String(deviceCount[0]?.count || 0).padStart(2,"0")}</strong><small>OWNER TRUST</small></div>
      <div><span>ACTIVE SESSIONS</span><strong>{String(activeSessions[0]?.count || 0).padStart(2,"0")}</strong><small>ONE PER OWNER</small></div>
      <div><span>HIGH-RISK EVENTS / 30D</span><strong>{String(openAlerts[0]?.count || 0).padStart(2,"0")}</strong><small>SECURITY AUDIT</small></div>
    </div>
    <div className="security-grid command-gap">
      <Panel><SectionHead no="01" kicker="OWNER REGISTRY" title="The only permitted identities"/><div className="role-matrix">
        {OWNER_DIRECTORY.map((owner) => {
          const row = ownerRows.get(owner.email) as {active?:boolean;bound_at?:string|null}|undefined;
          return <div key={owner.email}><b>{owner.displayName.toUpperCase()}</b><span>{owner.email}</span><StatePill state={row?.active ? "steady" : "critical"}>{row?.bound_at ? "BOUND" : "READY"}</StatePill></div>;
        })}
      </div></Panel>
      <Panel><SectionHead no="02" kicker="SESSION POLICY" title="Trust expires by design"/><div className="role-matrix">
        <div><b>10 MIN</b><span>No activity → management screen locks and GM Authenticator is required again.</span><StatePill state="steady">LOCK</StatePill></div>
        <div><b>30 MIN</b><span>Continued inactivity → complete Clerk sign-out.</span><StatePill state="watch">SIGN OUT</StatePill></div>
        <div><b>2 HOURS</b><span>Absolute Owner application-session ceiling even while active.</span><StatePill state="watch">MAX</StatePill></div>
        <div><b>10 MIN</b><span>Fresh MFA window for sensitive financial/security operations.</span><StatePill state="steady">REVERIFY</StatePill></div>
      </div></Panel>
      <Panel className="security-architecture"><SectionHead no="03" kicker="DEFENSE IN DEPTH" title="Production security layers"/><div className="security-layers">
        {["Exact three-owner registry","Verified Clerk identity + immutable ID binding","Independent GM TOTP authenticator","One-time hashed recovery codes","Trusted Owner-device tokens","One active session per Owner","10-minute inactivity lock / 30-minute idle sign-out","2-hour absolute application session","Fresh MFA for finance/security changes","Strict same-origin + request rate limits","No-store / noindex / CSP / anti-framing","Append-only audit & security logs","Restricted Neon runtime privileges","Database-enforced closed-month protection"].map((x,i)=><div key={x}><b>{String(i+1).padStart(2,"0")}</b><span>{x}</span><i>ACTIVE</i></div>)}
      </div></Panel>
    </div>
  </>;
}
