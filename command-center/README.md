# GM Command Center — Backend Complete V6

# Grub Monkeys Command Center

**Brand Command Center V2:** the Owner Overview has been rebuilt to the approved dense command-center layout and all dashboard accent colors are constrained to the official Grub Monkeys palette.

Full private Owner business command center for `dashboard.grubmonkeys.in`.

The interface is custom to the Grub Monkeys brand: Monkey Red / Sorta Grey / Sorta White / Monkey Teal, Big Shoulders display typography (bold/extrabold, condensed scoreboard-style), Lexend product typography, sharp control rails, ticket-style motion and restrained operating-state animation. It deliberately avoids generic SaaS glass cards, purple/blue gaming gradients and stock admin-template composition.

## Authorized identities

Exactly three Owner identities may enter:

- Mueen Ahmed — `mueen.ahmed1922@gmail.com`
- Mohammed Afridi — `reachafridi@gmail.com`
- Mohammed Hisham — `md.hisham29@gmail.com`

There is no staff, manager, finance, auditor, viewer or public login path. Staff records inside the People module are business data only.

## Product coverage

The codebase contains the complete first-version interface for Overview, Outlets + outlet drill-down, Financials, Sales Intelligence, Menu Intelligence, People, Inventory, Procurement, Expenses, Alerts, Tasks, Insights, Reports, Documents, Imports, Security, Devices and Settings. See `PRODUCT_MAP.md` for route-level detail.

## Data model and ingestion

The separate Neon schema covers the full business model: outlets, reporting periods, daily/channel sales, monthly P&L, expenses, staff and movement history, attendance, targets, menu performance, inventory, procurement/vendors, cash reconciliation, documents, tasks, alerts, imports, devices, sessions, MFA and immutable audit/security records.

Four controlled CSV import paths are implemented now:

- daily sales
- channel sales
- expenses
- staff

Templates are in `public/templates/`. Imports validate before commit, are rate-limited, require an authenticated approved Owner session, require fresh MFA for commit and create audit/security records.

Production starts in live/empty mode with `GM_ALLOW_DEMO_DATA=0`. Development-only placeholders may be enabled explicitly for UI review, but must never be treated as Grub Monkeys business records. Real data should be loaded through the protected APIs/import station and reconciled before launch.

## Security model

Clerk identity → exact three-Owner registry → independent GM TOTP MFA → trusted Owner browser → one live session → server authorization → audit.

Additional controls include immutable Clerk ID binding, production email-bootstrap disabled by default, 10-minute inactivity lock, 30-minute idle sign-out, 2-hour absolute session ceiling, fresh MFA for sensitive operations, strict same-origin writes, rate/bounds controls, private/no-store responses, CSP/anti-framing/noindex, restricted Neon runtime privileges, append-only audit/security history and database-enforced closed-month protection.

No watermark, screenshot detection, copy blocking, print interception or keyboard surveillance is included by design.

## Local / production handoff

This archive intentionally excludes `node_modules` and secrets. Run `npm install` in a networked development environment, commit the generated lockfile, update the currently pinned framework to the approved patched production release, and run the full verification/build sequence before deployment.

## People Lifecycle module
The Owner-only People command now supports direct employee creation with joining date, employment type, outlet code, role, monthly cost and probation end date. Owners can record a notice date and planned last working day, with a 30-day exit countdown that also surfaces in the Alerts command. Monthly performance reviews use a 0-10 scale with optional attendance, role execution, teamwork and ownership sub-scores plus strengths, improvement points and Owner notes. Review changes remain blocked when the corresponding reporting month is closed.


## People payroll control
Employee records include current monthly salary, effective date, salary history and audited increment/adjustment records. Salary changes are Owner-only and require fresh MFA.

## v5 — Restaurant Chain Completeness Audit

This release closes the five material gaps identified in the owner-level restaurant-chain audit without expanding the product into a full ERP.

New owner controls:
- Month-end sales forecast with projected close, target gap and required daily run-rate.
- Customer Experience register (Google / Swiggy / Zomato + complaint control).
- Critical Equipment & Maintenance control.
- Monthly Outlet Operating Audit /100.
- Expanded production CSV intake for monthly financials, inventory, vendors, purchases, menu performance and cash reconciliation in addition to the existing sales, channel, expenses and staff imports.

Customer, maintenance and outlet-audit exceptions can create records in the central Alerts queue. All new write endpoints remain Owner-only, same-origin protected, rate limited, fresh-MFA protected, database audited and no-store.
