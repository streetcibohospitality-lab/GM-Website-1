# GM Command Center — Backend Completion Report

## Production data layer

The Command Center backend now reads and writes the separate Neon `GM Command Center` database for the principal restaurant-chain control areas:

- outlet master and outlet performance
- monthly P&L and targets
- daily/channel sales
- expenses
- employee lifecycle, salaries and monthly performance reviews
- inventory snapshots
- vendors and purchases
- menu performance
- cash reconciliation
- customer experience
- equipment and maintenance
- monthly outlet audits
- documents
- tasks
- alerts and automated control rules
- import jobs
- audit and security history

## Protected write APIs

Thirty API route handlers are present. Business mutations include outlet, monthly financial, expense, target, vendor, purchase, cash reconciliation, task, document, employee, salary, performance, customer-experience, maintenance, outlet-audit, alert and reporting-period controls. Sensitive writes require Owner authorization and fresh MFA.

## Control-rule engine

Automated alerts are de-duplicated and can be refreshed for:

- food-cost variance
- labour-cost variance
- revenue forecast shortfall
- cash discrepancy
- staff notice/exit watch
- document expiry
- customer-experience deterioration
- high/critical maintenance incidents
- low outlet-audit scores

## Real-data mode

`GM_ALLOW_DEMO_DATA=0` is the production default. Development may explicitly enable demo data. The global shell and data readers use the same runtime policy, eliminating the previous flag mismatch.

The reporting-period chip and alert drawer are backend-driven. Production does not silently promote placeholder numbers to real restaurant data.

## Database synchronization

The source schema includes:

- full unique alert `dedupe_key` index compatible with `ON CONFLICT(dedupe_key)`
- purchase invoice de-duplication
- vendor reliability/fill-rate fields
- operational query indexes
- closed-period guards
- append-only audit/security permissions for the runtime role
- exactly-three-Owner registry architecture

A database cleanup was applied to the pre-launch main Neon project so these source assumptions match the live schema.

## Validation performed here

- Security static audit: 26/26 PASS
- Source parser: 99 TS/TSX files PASS
- Neon final checks: exactly three Owner registry rows, no non-Owner app users, full alert de-duplication index, purchase invoice de-duplication index, duplicate purchase index removed
- No `node_modules` or package-lock was fabricated

## Validation intentionally still gated

The environment could not complete `npm install` because npm registry access timed out. Therefore dependency-aware `tsc` and `next build` are not claimed as passed.

The production framework gate also intentionally blocks Next.js 16.3.2. After the official security patch is released, upgrade to the patched 16.3 version and run `npm run verify` in Claude Code before deployment.
