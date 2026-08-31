# GM Command Center — Restaurant Chain Build Audit v5

## Scope added
1. Month-end forecast in Financials.
2. Customer Experience control.
3. Critical Equipment / Maintenance control.
4. Monthly Outlet Audit scorecard.
5. Expanded real-data import paths.

## Data-entry / import coverage
- Daily sales
- Channel sales
- Expenses
- Staff master + salary
- Monthly financials / P&L
- Inventory snapshots
- Vendors
- Purchases
- Menu performance
- Cash reconciliation

## Security inheritance
All new pages are behind the same exact-three-Owner access gate. New writes use approved-device + one-active-session enforcement, fresh MFA, same-origin checks, rate limiting, no-store responses, business-table audit triggers and reporting-period locks where monthly records are involved.

## Database validation
Validated on an isolated Neon branch before main schema application:
- Customer experience insert: PASS
- Equipment asset insert: PASS
- Critical maintenance incident insert: PASS
- Outlet audit insert: PASS
- Audit-log trigger rows: PASS (4/4)
- Closed-month update rejection: PASS
- Main Command Center database updated with empty new tables only; no validation/demo business rows were copied into main.

## Source validation
- Security static audit: 22/22 PASS
- TS/TSX syntax parse: 81 files PASS
- Dependency-aware `tsc` / Next production build: not completed in this environment because npm registry installation timed out. Claude Code must run `npm install`, `npm run typecheck`, and the production framework gate/build before deployment.
