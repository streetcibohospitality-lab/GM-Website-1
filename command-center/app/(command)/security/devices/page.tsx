import { redirect } from "next/navigation";
import { DeviceAdmin } from "@/components/device-admin";
import { PageLead, Panel, SectionHead } from "@/components/ui";
import { requirePageProfile } from "@/lib/access-control";
import { canManageSecurity } from "@/lib/authz";
import { db } from "@/lib/db";
import { hasFreshFinancialMfa } from "@/lib/mfa";
export const dynamic="force-dynamic";
export default async function DevicesPage(){const profile=await requirePageProfile("/security/devices");if(!canManageSecurity(profile.role))redirect("/access-denied");if(!(await hasFreshFinancialMfa()))redirect("/security/verify?next=/security/devices");const rows=await db()`SELECT d.id,d.status,d.label,d.first_seen_at,d.last_seen_at,d.approved_at,d.revoked_at,u.display_name,u.email,u.role FROM approved_devices d JOIN app_users u ON u.id=d.user_id ORDER BY CASE d.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,d.last_seen_at DESC LIMIT 100`;return <><PageLead code="19.1" eyebrow="SECURITY / DEVICE TRUST" title="Only approved management devices enter." copy="Approve, deny and revoke browsers without exposing device tokens. Pending devices receive no business data."/><Panel><SectionHead no="01" kicker="DEVICE REGISTER" title="Trust decisions"/><DeviceAdmin initial={rows as unknown as Parameters<typeof DeviceAdmin>[0]["initial"]}/></Panel></>;}
