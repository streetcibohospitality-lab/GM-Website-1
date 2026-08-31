# Claude Code instructions — GM Command Center complete V1

This is an existing custom Grub Monkeys Command Center, not a starter template. Preserve the information architecture and visual language already implemented. Read `PRODUCT_MAP.md` before changing routes.

## Design system — do not genericize

Preserve the Grub Monkeys brand system: Big Shoulders/Lexend typography (display font switched from Jaro, which only ships weight 400 and had no bold — Big Shoulders is a Google Font modeled on Chicago's condensed scoreboard/signage lettering, used at weight 700-800 for real authority), Monkey Red / Sorta Grey / Sorta White / Monkey Teal palette, custom command rail, ticket-strip motion, editorial control lines, cream analytical surfaces, data matrices and restrained status animation.

Do NOT redesign this into generic glassmorphism, purple/blue SaaS cards, gaming neon, gradient-heavy dashboards, Bootstrap/admin-template composition, or a stock icon-card grid.

## Approved Command Center UI direction

The Owner Overview uses the approved dense command-center composition: compact six-KPI strip, outlet performance matrix, revenue trend, channel mix, alerts, profitability, outlet ranking, live activity, group health, quick actions and target progress. Use only the supplied Grub Monkeys palette for semantic accents: Monkey Red `#EB0000`, Monkey Teal `#00DDC2`, Sorta Grey `#3A3A3A`, Sorta White `#F0EFE9`, plus neutral black surfaces. Do not introduce purple, blue, orange, yellow, multi-hue chart palettes or generic admin-template accent colors.

## Non-negotiable identity policy

Only these three Owner identities may ever enter:

1. Mueen Ahmed — mueen.ahmed1922@gmail.com
2. Mohammed Afridi — reachafridi@gmail.com
3. Mohammed Hisham — md.hisham29@gmail.com

Do not add staff, finance, manager, auditor, viewer, public signup, invite-by-role, or self-service account creation. Staff in the People module are business records only.

Do not replace the exact Owner registry with an email-domain rule. Production must pre-bind all three immutable Clerk user IDs using the administrator connection, keep `GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP=0`, and then run `db/lock-owner-registry.sql` after verification.

## Security controls that must not be weakened

- Clerk server authentication on protected routes.
- Exact verified three-Owner registry and immutable Clerk ID binding.
- Independent GM TOTP MFA for all three Owners.
- AES-256-GCM TOTP secret encryption, hashed recovery codes and replay protection.
- Trusted Owner devices; first-ever device only may bootstrap after MFA, later devices require approval.
- One live session per Owner.
- 10-minute inactivity lock, 30-minute idle sign-out, 2-hour absolute session ceiling.
- Fresh MFA for sensitive financial/security changes.
- Strict same-origin validation, bounded request bodies and rate limits.
- `Cache-Control: private, no-store`, CSP, anti-framing and noindex protections.
- Restricted Neon runtime credentials; never deploy database owner/admin credentials to Vercel runtime.
- Runtime cannot update/delete/truncate audit/security logs.
- Runtime cannot expand or rewrite the Owner registry.
- Database-enforced closed-month protection.

## Explicitly excluded

Do not add watermarking, screenshot detection, PrintScreen hooks, copy interception, context-menu blocking, developer-tools detection, keyboard surveillance or similar browser tricks.

## Data policy

Development-only placeholder data may be used only when GM_ALLOW_DEMO_DATA=1. Production must use GM_ALLOW_DEMO_DATA=0 and must never promote placeholder values to production truth. Real data arrives through audited write APIs and validated imports covering outlet master, daily sales, channel sales, expenses, staff/salary, monthly financials, inventory, vendors, purchases, menu performance and cash reconciliation.

## Finalization sequence

1. Run `npm install` in a networked environment and commit the generated package-lock.json.
2. Update Next.js from the current development pin to the approved security-patched production release required by `scripts/framework-gate.mjs`.
3. Run `npm run security:audit`.
4. Run `npm run verify:source`.
5. Run `npm run typecheck`.
6. Run `npm run production:build`.
7. Fix errors without weakening security/design constraints.
8. Configure Clerk production, restricted Neon runtime URL, exact allowed origin and MFA key.
9. Create only the three Owner accounts, collect their immutable Clerk IDs, pre-bind them with `db/bind-owner-identities.sql.template`, verify, then run `db/lock-owner-registry.sql`.
10. Keep GM_ALLOW_DEMO_DATA=0 in production and import/reconcile the real Grub Monkeys outlet and business data before launch.
11. Test all three Owners independently and test one unlisted identity for fail-closed denial.


## People payroll control
Employee records include current monthly salary, effective date, salary history and audited increment/adjustment records. Salary changes are Owner-only and require fresh MFA.

## v5 restaurant-chain controls
The scope is intentionally narrow. Do not add ERP-style modules unless explicitly requested.

New routes:
- `/customer-experience`
- `/maintenance`
- `/outlet-audits`

New database migration for an existing database:
- `db/restaurant-chain-controls.sql`

For a fresh database, `db/schema.sql` already contains these tables/triggers/views.

The Import Station now supports ten types. Preserve validation, same-origin enforcement, fresh MFA and audit behavior when changing import code.

Before production deployment:
1. install dependencies and create/commit a real lockfile;
2. upgrade Next.js to the official patched production version accepted by `scripts/framework-gate.mjs`;
3. run `npm run security:audit`;
4. run `npm run verify:source`;
5. run `npm run typecheck`;
6. run the production build;
7. keep real restaurant data separate from demonstration content during validation.


## BACKEND COMPLETE V6

The frontend visual system is locked. Do not redesign it. The backend now has live Neon readers, protected business write APIs, control-rule alerts, audited imports, Owner-only security, and production demo-data disabled by default. Read BACKEND_COMPLETION_REPORT.md before making any production change.
