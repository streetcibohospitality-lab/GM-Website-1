# Grub Monkeys Command Center — Complete Handoff Summary

**Date:** 25 August 2026
**Target domain:** `dashboard.grubmonkeys.in`
**Latest working directory:** `gm_command_center_v6_2_QA_Fixed`
**Latest code state:** QA Fixed v6.2, pre-production

## 1. Project goal

Build a private Owner-only restaurant-chain command center for Grub Monkeys that gives the three Owners a high-level operating view across all outlets without becoming a bloated ERP.

The product should centralize the data needed to run the chain:

- outlet performance
- monthly P&L
- sales and channel mix
- menu performance
- employees, joining dates, salaries, performance, notice periods
- inventory and procurement
- expenses and cash reconciliation
- customer experience
- maintenance
- monthly outlet operating audits
- alerts, tasks, reports, documents, imports and security

The interface should feel like a premium restaurant HQ command center, not a generic SaaS dashboard.

## 2. Brand / visual requirements

Use the Grub Monkeys brand system only:

- Monkey Red: `#EB0000`
- Sorta Grey: `#3A3A3A`
- Sorta White: `#F0EFE9`
- Monkey Teal: `#00DDC2`
- Display font: Jaro
- UI/content font: Lexend

Use the supplied Grub Monkeys logo assets under `public/`.

Avoid:

- purple / electric blue / orange SaaS gradients
- glassmorphism
- generic admin templates
- gaming / cyberpunk UI
- generic icon-card grids
- unrelated typefaces

The approved visual direction is a dense command-center layout with mature 1960s-diner DNA: scoreboard hierarchy, rule lines, ticket/ticker motifs, compact data rails, strong tables and outlet matrices. Motion should communicate state/hierarchy, not decorate constantly.

The frontend visual direction is considered locked unless a functional backend need requires a small UI change.

## 3. Authorized users — exactly three Owners

Only these three identities are authorized:

1. Mueen Ahmed — `mueen.ahmed1922@gmail.com`
2. Mohammed Afridi — `reachafridi@gmail.com`
3. Mohammed Hisham — `md.hisham29@gmail.com`

There must be no staff, manager, finance, viewer, auditor or generic fallback login path.

The database enforces Owner-only application users.

## 4. Security decisions

The user explicitly does **not** want screenshot/watermark/browser-surveillance controls.

Do not add:

- watermarking
- screenshot detection
- clipboard blocking
- right-click blocking
- print blocking
- keyboard surveillance

Use strong identity/session/data security instead:

- Clerk identity
- exact three-owner allowlist + database owner registry
- verified Clerk email
- production pre-binding to immutable Clerk `user_...` IDs
- custom GM Command Center TOTP MFA
- AES-256-GCM encrypted TOTP secrets
- hashed recovery codes
- replay protection
- trusted browser/device tokens; only hashes stored server-side
- first device can bootstrap only after successful TOTP; later devices require approval
- one live application session per Owner
- 10-minute inactivity screen lock / MFA reset
- 30-minute inactivity full sign-out
- 2-hour absolute application-session maximum
- fresh MFA for sensitive financial/security writes
- strict same-origin checks
- bounded payloads and rate limiting
- private/no-store responses
- HSTS / CSP / noindex / anti-framing
- append-only audit/security logs from runtime role
- closed reporting periods block protected rewrites at PostgreSQL level

Production should use a restricted Neon runtime role that is a member of `gm_command_runtime`, never `neondb_owner`.

## 5. Owner identity commissioning

Before production, create the three Clerk users and collect their immutable Clerk user IDs.

Use `db/bind-owner-identities.sql.template` and replace:

```sql
REPLACE_MUEEN_CLERK_USER_ID
REPLACE_AFRIDI_CLERK_USER_ID
REPLACE_HISHAM_CLERK_USER_ID
```

Then run the completed script once with a Neon administrator connection.

After all three are bound and verified, run:

```text
db/lock-owner-registry.sql
```

This removes runtime permission to change Owner identity bindings.

Email bootstrap is disabled in production by default.

## 6. Environment variables

Use `.env.example` as the source of truth:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REPLACE
CLERK_SECRET_KEY=sk_live_REPLACE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
DATABASE_URL=postgresql://RESTRICTED_RUNTIME_CONNECTION
GM_DASH_ALLOWED_ORIGINS=https://dashboard.grubmonkeys.in
GM_DASH_MFA_ENCRYPTION_KEY=BASE64_32_BYTE_KEY
GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP=0
GM_ALLOW_DEMO_DATA=0
```

Never put a Neon owner/admin connection string into Vercel runtime env.

## 7. Application structure / routes

### Command

- `/overview`
- `/outlets`
- `/outlets/[id]`
- `/financials`
- `/sales`
- `/menu-intelligence`

### Operations

- `/people`
- `/inventory`
- `/procurement`
- `/expenses`

### Control

- `/customer-experience`
- `/maintenance`
- `/outlet-audits`
- `/alerts`
- `/tasks`
- `/insights`

### Management

- `/reports`
- `/documents`
- `/imports`
- `/security`
- `/security/devices`
- `/settings`

### Security gates

- `/sign-in`
- `/security/setup`
- `/security/verify`
- `/device/register`
- `/device/pending`
- `/access-denied`

## 8. Backend/API coverage

Current API routes include:

- `/api/admin/devices/[id]`
- `/api/alerts/[id]`
- `/api/cash-reconciliation`
- `/api/controls/refresh`
- `/api/customer-experience`
- `/api/documents`
- `/api/expenses`
- `/api/health`
- `/api/imports/commit`
- `/api/imports/validate`
- `/api/maintenance/assets`
- `/api/maintenance/incidents`
- `/api/monthly-financials`
- `/api/outlet-audits`
- `/api/outlets`
- `/api/people/performance`
- `/api/people/salary`
- `/api/people/staff/[id]`
- `/api/people/staff`
- `/api/purchases`
- `/api/reporting-periods/close`
- `/api/reports/management-pack`
- `/api/security/device/register`
- `/api/security/device/status`
- `/api/security/mfa/enroll`
- `/api/security/reverify`
- `/api/security/session/lock`
- `/api/security/session/status`
- `/api/targets`
- `/api/tasks/[id]`
- `/api/tasks`
- `/api/vendors`

Business mutations require Owner authorization; sensitive writes require fresh MFA and audit logging.

## 9. Database / Neon state

A separate Neon project named **GM Command Center** exists. It is separate from GM Kitchen.

The main schema already contains production-ready structures for:

- `owner_access_registry`
- `app_users`
- `outlets`
- `user_outlet_access`
- `reporting_periods`
- `outlet_monthly_financials`
- `daily_sales`
- `sales_channels`
- `channel_sales`
- `expense_categories`
- `expenses`
- `staff_members`
- `staff_salary_history`
- `staff_outlet_history`
- `attendance_monthly`
- `staff_performance_reviews`
- `staff_events`
- `outlet_targets`
- `menu_items`
- `menu_performance_monthly`
- `inventory_items`
- `inventory_snapshots`
- `vendors`
- `purchases`
- `purchase_items`
- `cash_reconciliations`
- `documents`
- `alerts`
- `tasks`
- `customer_experience_monthly`
- `equipment_assets`
- `maintenance_incidents`
- `outlet_audits_monthly`
- `data_import_jobs`
- `access_logs`
- `rate_limit_buckets`
- `security_events`
- `approved_devices`
- `active_sessions`
- `mfa_recovery_codes`
- `mfa_session_verifications`
- `audit_log`

Important database protections already validated/applied:

- exactly three Owner registry rows
- no non-Owner application users
- immutable Owner identity binding trigger
- full unique alert `dedupe_key` index compatible with `ON CONFLICT(dedupe_key)`
- purchase invoice de-duplication index
- vendor reliability/fill-rate fields
- closed-period guard triggers
- business-change audit triggers
- append-only audit/security runtime permissions
- one-live-session index per Owner

Do not modify the GM Kitchen database for this project.

## 10. People / HR requirements already built

Employee records support:

- employee code
- name
- role / designation
- outlet
- joining date
- automatic tenure
- employment type
- probation / confirmation dates
- current monthly salary
- salary effective date
- salary history
- increment / adjustment / correction history
- monthly labor cost / employer cost
- notice-given date
- planned last working day
- exit countdown
- monthly performance score out of 10
- optional attendance / role execution / teamwork / ownership sub-ratings
- strengths
- improvement points
- Owner review notes
- employee event ledger: joining, probation, confirmation, promotion, transfer, recognition, warning, notice, exit, increment

Notice reminders are designed for roughly 30/14/7/1 days before departure.

Salary/performance changes require Owner-only access and fresh MFA.

## 11. Restaurant-chain controls deliberately included

Only these focused controls were added after the feature audit:

### Month-end Forecast

- current MTD revenue
- monthly target
- projected month close
- projected surplus/shortfall
- required average daily revenue for remaining days

### Customer Experience

Per outlet/month:

- Google rating
- Swiggy rating
- Zomato rating
- complaints received
- unresolved complaints
- Owner notes

This is intentionally **not** a CRM.

### Maintenance

- equipment / asset register
- outlet
- issue
- reported date
- priority
- vendor
- cost
- status
- resolved date
- next service date

This is intentionally **not** a full CMMS.

### Monthly Outlet Audit

Scores for:

- hygiene
- food quality
- service
- stock discipline
- staff presentation
- equipment condition
- compliance

The system calculates an overall operating score.

## 12. Import Center

Controlled CSV intake supports:

- outlet master
- daily sales
- channel sales
- expenses
- staff / salary
- monthly financials
- inventory snapshots
- vendors
- purchases
- menu performance
- cash reconciliation

The import flow validates before commit and is audited.

Production should use real business data. Demo data is disabled with:

```env
GM_ALLOW_DEMO_DATA=0
```

## 13. Alert engine

Automatic de-duplicated control alerts exist for:

- food-cost variance
- labour-cost variance
- revenue forecast shortfall
- cash discrepancy
- staff notice / exit watch
- document expiry
- customer-experience deterioration
- high / critical maintenance incidents
- low outlet-audit scores

Stale generated alerts auto-resolve when their triggering condition clears.

## 14. QA / button / overlap status

A source-level and Chromium layout QA pass was performed after the user asked whether all buttons worked and whether there were bugs/overlaps.

### Fixed in v6.1

- Add Outlet works
- Create Task works
- task completion works
- Add Document works
- Export Management Pack points to real export API
- report OPEN actions route to real destinations
- Overview quick actions now match what they actually do
- expense quick action opens real expense entry
- stock quick action was renamed to `IMPORT STOCK COUNT` and routes to Imports
- alert acknowledgement and rule refresh are wired
- maintenance incidents can be edited/resolved
- equipment records can be edited
- hard-coded `vs Jul 2026`, `18 AUG 2026`, `August group target` text removed
- synthetic Overview trend generation removed
- prior-period comparisons now come from actual data when available
- Overview totals recompute when live outlet data changes
- Customer Experience and Outlet Audit use active reporting period
- database read failures surface as errors rather than fake zero-data states
- Customer Experience table uses internal horizontal scroll
- Tasks / Documents / Reports responsive containment corrected
- modal forms are viewport-bounded and scroll internally
- two-column modal forms collapse to one column on narrow screens
- Owner-only wording corrected

### Current QA results

- Security static audit: **26/26 PASS**
- Source parser: **102 TS/TSX files PASS**
- Interaction audit: **27/27 PASS**
- Visible JSX buttons with action path: **48/48 PASS**
- Chromium containment probe: PASS at **1440px, 768px, 390px**
- no page-level horizontal overflow at those widths
- modal containment PASS
- wide tables scroll internally instead of clipping page

Screenshots in latest working directory:

- `screenshots/QA_Layout_1440.png`
- `screenshots/QA_Layout_768.png`
- `screenshots/QA_Layout_390.png`
- `screenshots/GM_Command_Center_Brand_V2.png`
- `screenshots/GM_Command_Center_People_Lifecycle.png`

## 15. Important code/config decisions

### Unified demo-data policy

`lib/runtime-mode.ts`:

```ts
import "server-only";

export function demoDataAllowed() {
  return process.env.GM_ALLOW_DEMO_DATA === "1" ||
    (process.env.NODE_ENV !== "production" && process.env.GM_ALLOW_DEMO_DATA !== "0");
}
```

Production must keep `GM_ALLOW_DEMO_DATA=0`.

### Production framework gate

`scripts/framework-gate.mjs` intentionally refuses to build production on Next.js 16.3.2 or older:

```js
if (value <= minimumExclusive) {
  console.error(`PRODUCTION BLOCKED: Next.js ${version} must be upgraded to the official security-patched release newer than 16.3.2 before deployment.`);
  process.exit(1);
}
```

Do not remove this gate just to make deployment pass.

## 16. Package state / dependency caveat

Current `package.json` (superseded — see the current `package.json` in this repository for the live dependency set, which now uses `postgres` in place of `@neondatabase/serverless`):

```json
{
  "name": "grub-monkeys-command-center",
  "version": "1.1.1",
  "private": true,
  "engines": { "node": ">=20.9.0" },
  "dependencies": {
    "@clerk/nextjs": "7.8.0",
    "@neondatabase/serverless": "1.1.0",
    "next": "16.3.2",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@types/node": "24.0.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "typescript": "5.9.0"
  }
}
```

`npm install` repeatedly timed out in the previous execution environment. It did **not** create `node_modules` or a real `package-lock.json`.

Therefore dependency-aware `tsc --noEmit` and `next build` have **not** been truthfully claimed as passed.

This is the main unresolved technical validation item.

## 17. Current unresolved issues / deployment blockers

There are no known source-level dead buttons or confirmed page-overlap bugs after v6.1 QA.

The remaining blockers are external/commissioning/build items:

1. Next.js 16.3.2 is intentionally blocked for production by `scripts/framework-gate.mjs`.
2. Upgrade to the official security-patched Next.js 16.3 release when available.
3. Run real `npm install`; commit the generated `package-lock.json`.
4. Run dependency-aware `npm run verify`.
5. Fix any actual TypeScript/Next build errors without weakening security.
6. Configure Clerk production keys.
7. Create the three production Clerk Owner users.
8. Pre-bind all three immutable Clerk user IDs using `db/bind-owner-identities.sql.template`.
9. Run `db/lock-owner-registry.sql`.
10. Configure restricted Neon runtime `DATABASE_URL`.
11. Verify/import the real Grub Monkeys outlet, staff, financial and operating data.
12. Deploy a dedicated Vercel project for `dashboard.grubmonkeys.in`.
13. Point DNS to that Vercel project only after verification.

## 18. Exact next commands to run in a capable environment

After the official patched Next.js release is available:

```bash
cd <project-root>

# Update Next.js to the official patched 16.3 release first.
# Example only; use the actual official patched version:
npm install next@<OFFICIAL_PATCHED_16_3_VERSION>

npm install
npm run verify
```

`npm run verify` executes:

```text
verify:static -> security audit + source parse + interaction audit
then typecheck -> tsc --noEmit
then production:build -> framework gate + next build
```

Do not bypass `framework:gate`.

## 19. Files to read first in the new chat / Claude Code

Read in this order:

1. `HANDOFF_SUMMARY.md`
2. `CLAUDE.md`
3. `QA_FIX_REPORT.md`
4. `VALIDATION_REPORT.md`
5. `BACKEND_COMPLETION_REPORT.md`
6. `SECURITY.md`
7. `DEPLOYMENT.md`
8. `PRODUCT_MAP.md`
9. `.env.example`
10. `db/verify.sql`
11. `db/bind-owner-identities.sql.template`
12. `db/lock-owner-registry.sql`

## 20. Prompt to paste into a new chat

Use this exact prompt after uploading the latest ZIP:

> We are continuing the Grub Monkeys Command Center project for `dashboard.grubmonkeys.in`. Treat the uploaded ZIP as the canonical source. Read `HANDOFF_SUMMARY.md`, `CLAUDE.md`, `QA_FIX_REPORT.md`, `VALIDATION_REPORT.md`, `SECURITY.md`, `DEPLOYMENT.md`, and `PRODUCT_MAP.md` before changing anything. The frontend visual direction is locked. Do not replace it with a generic dashboard. Preserve the exact Grub Monkeys palette (`#EB0000`, `#3A3A3A`, `#F0EFE9`, `#00DDC2`), Jaro/Lexend, the three-Owner-only security model, custom TOTP MFA, trusted devices, one-live-session controls, closed-month protections, append-only audit model, and no screenshot/watermark/browser-surveillance features. Production demo data must remain disabled. First inspect the current source and run the existing static verification scripts. Then check whether the official security-patched Next.js 16.3 release is now available; if yes, upgrade to that official patched release, run a real `npm install`, commit the generated lockfile, run `npm run verify`, and fix any dependency-aware TypeScript or build failures without weakening security. Do not deploy until the framework gate, typecheck, production build, Owner identity pre-binding, registry lock, and real-data verification all pass.

## 21. Scope discipline

Do **not** add extra ERP-style features unless actual use reveals a clear gap.

Specifically avoid building full:

- payroll processing
- recruitment / ATS
- employee self-service
- CRM / loyalty
- POS
- accounting system
- recipe management (GM Kitchen already covers kitchen recipes/IP)
- internal chat
- unnecessary operational checklists

The Command Center should remain an Owner decision/control system.
