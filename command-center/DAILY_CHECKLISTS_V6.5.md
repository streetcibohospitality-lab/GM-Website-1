# GM Command Center v6.5 — Daily Opening & Closing Checklists

## Added
- New **Daily Checklists** command-center page at `/checklists`.
- Two group-wide editable templates:
  - Daily Opening
  - Daily Closing
- Owners can edit checklist name, description and daily dispatch time.
- Owners can add, delete and reorder checks.
- Every check can be marked Required/Optional and Active/Paused.
- Entire template saves atomically in one Neon transaction.
- Existing item IDs are preserved during edits/reordering so future checklist completion records can safely reference them.
- Same-origin enforcement, Owner access, rate limiting and fresh MFA protect checklist edits.
- Database audit triggers cover templates and items.
- Responsive glassmorphic editor added using the existing Grub Monkeys visual system.

## Default Opening Checks
1. Premises and kitchen cleaned and ready
2. Chiller and freezer temperatures checked
3. Staff attendance, uniform and grooming checked
4. Opening stock and critical items verified
5. POS, cash float and delivery tablets ready

## Default Closing Checks
1. Closing stock and critical variances recorded
2. Wastage and spoilage entered
3. Cash, POS and aggregator reconciliation completed
4. Kitchen and equipment cleaned and safely shut down
5. Waste disposed and outlet secured

All items are editable; these are only starter standards.

## Database
Run `db/daily-checklists.sql` once on an existing v6.4.1 database before opening `/checklists`.
Fresh database installs can continue to use `db/schema.sql`, which now includes the same tables and seeds.

The migration creates only checklist configuration tables and starter templates/items. It does not modify outlet, sales, financial, staff or authentication data.

## Validation
- Source parse: 107 TS/TSX PASS
- Security static audit: 26/26 PASS
- Interaction static audit: 30/30 PASS
- Release QA: 24/24 PASS
- Framework gate: Next.js 16.3.3 PASS

Dependency-aware `tsc` / Next production build is not claimed because this artifact intentionally contains no `node_modules` and the current execution environment cannot retrieve npm dependencies.
