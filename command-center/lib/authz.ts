import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ownerByEmail, normalizeEmail } from "@/lib/owner-directory";
import type { OutletPermission, Profile, Role } from "@/lib/types";

export type AccessDeniedReason =
  | "not_an_authorized_owner"
  | "owner_registry_disabled"
  | "owner_identity_mismatch"
  | "owner_identity_not_bound"
  | "verified_owner_email_required";

export class DashboardAccessDeniedError extends Error {
  constructor(public reason: AccessDeniedReason) {
    super(reason);
    this.name = "DashboardAccessDeniedError";
  }
}

function verifiedEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return [] as string[];
  return user.emailAddresses
    .filter((entry) => entry.verification?.status === "verified")
    .map((entry) => normalizeEmail(entry.emailAddress));
}

async function resolveCurrentProfile(): Promise<Profile> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated");

  const verified = verifiedEmails(user);
  const alreadyBound = await db()`
    SELECT email, display_name, active
    FROM owner_access_registry
    WHERE clerk_user_id=${user.id}
    LIMIT 1
  `;

  let canonicalEmail = "";
  let canonicalName = "";

  if (alreadyBound.length) {
    const row = alreadyBound[0] as { email: string; display_name: string; active: boolean };
    canonicalEmail = normalizeEmail(row.email);
    canonicalName = row.display_name;
    if (!row.active) throw new DashboardAccessDeniedError("owner_registry_disabled");
    if (!verified.includes(canonicalEmail)) throw new DashboardAccessDeniedError("verified_owner_email_required");
    if (!ownerByEmail(canonicalEmail)) throw new DashboardAccessDeniedError("not_an_authorized_owner");
  } else {
    const configured = verified.map(ownerByEmail).find(Boolean);
    if (!configured) throw new DashboardAccessDeniedError("not_an_authorized_owner");
    canonicalEmail = configured.email;
    canonicalName = configured.displayName;

    const registryRows = await db()`
      SELECT email, display_name, clerk_user_id, active
      FROM owner_access_registry
      WHERE email=${canonicalEmail}
      LIMIT 1
    `;
    if (!registryRows.length) throw new DashboardAccessDeniedError("not_an_authorized_owner");
    const registry = registryRows[0] as { email: string; display_name: string; clerk_user_id: string | null; active: boolean };
    if (!registry.active) throw new DashboardAccessDeniedError("owner_registry_disabled");
    if (registry.clerk_user_id && registry.clerk_user_id !== user.id) {
      throw new DashboardAccessDeniedError("owner_identity_mismatch");
    }
    if (!registry.clerk_user_id && process.env.GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP !== "1") {
      throw new DashboardAccessDeniedError("owner_identity_not_bound");
    }

    const bound = await db()`
      UPDATE owner_access_registry
      SET clerk_user_id=${user.id}, bound_at=COALESCE(bound_at,NOW()), updated_at=NOW()
      WHERE email=${canonicalEmail}
        AND active=TRUE
        AND (clerk_user_id IS NULL OR clerk_user_id=${user.id})
      RETURNING email, display_name
    `;
    if (!bound.length) throw new DashboardAccessDeniedError("owner_identity_mismatch");
    canonicalName = String(bound[0].display_name || canonicalName);
  }

  const rows = await db()`
    INSERT INTO app_users (clerk_user_id, email, display_name, role, active)
    VALUES (${user.id}, ${canonicalEmail}, ${canonicalName}, 'owner', TRUE)
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email=EXCLUDED.email,
      display_name=EXCLUDED.display_name,
      role='owner',
      active=TRUE,
      updated_at=NOW()
    RETURNING id, clerk_user_id, email, display_name, role, active, mfa_enrolled_at
  `;
  const row = rows[0] as {
    id: string;
    clerk_user_id: string;
    email: string;
    display_name: string;
    role: Role;
    active: boolean;
    mfa_enrolled_at?: string | null;
  };
  return { ...row, mfa_enabled: Boolean(row.mfa_enrolled_at) };
}

export async function getCurrentProfileForAudit() {
  return resolveCurrentProfile();
}

export async function getCurrentProfile() {
  const profile = await resolveCurrentProfile();
  if (!profile.active || profile.role !== "owner") throw new DashboardAccessDeniedError("owner_registry_disabled");
  return profile;
}

// Command Center is intentionally Owner-only. Authorization helpers are explicit so sensitive routes
// remain readable, while the Role type and database constraint make every authorized profile an Owner.
export function canViewAllOutlets(_role: Role) { return true; }
export function canViewFinancials(_role: Role) { return true; }
export function canEditFinancials(_role: Role) { return true; }
export function canCloseMonth(_role: Role) { return true; }
export function canManageUsers(_role: Role) { return true; }
export function canManageSecurity(_role: Role) { return true; }

export async function outletPermissions(profile: Profile): Promise<OutletPermission[]> {
  if (profile.role !== "owner") return [];
  const rows = await db()`
    SELECT id AS outlet_id, TRUE AS can_view_financials, TRUE AS can_edit_operations
    FROM outlets
    WHERE status <> 'closed'
    ORDER BY name
  `;
  return rows as unknown as OutletPermission[];
}

export async function assertOutletAccess(profile: Profile, _outletId: string, _options: { financial?: boolean; edit?: boolean } = {}) {
  if (profile.role !== "owner" || !profile.active) throw new Error("Forbidden");
}
