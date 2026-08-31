# GM Command Center v6.4.1 — Claude Code Handoff

This folder is the complete current Grub Monkeys Command Center source package.

## Current baseline
- Version: v6.4.1 Branding Patch / Production Candidate lineage
- Framework: Next.js 16.3.3
- UI: glassmorphic Grub Monkeys Command Center using the supplied real branding asset
- Branding palette: #EB0000, #3A3A3A, #F0EFE9, #00DDC2
- Owner-only architecture: exactly 3 approved Owners
- Database: Neon Postgres
- Auth architecture: Clerk identity + app-owned TOTP MFA + trusted devices/session controls

## Verified source status
- Security static audit: 26/26 PASS
- Interaction static audit: 30/30 PASS
- Source parser: 103 TS/TSX files PASS
- Release QA audit: 19/19 PASS
- Framework production gate: PASS on Next.js 16.3.3
- Visible buttons were audited as wired in the latest validation pass

## Important production constraints
Do NOT weaken or remove these controls to make deployment easier:
- exactly three Owners only
- immutable Clerk user-ID binding
- GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP must remain 0 in production after identity binding
- GM_ALLOW_DEMO_DATA must remain 0 in production
- runtime DB role must be restricted (gm_command_runtime), never neondb_owner
- fresh MFA for sensitive financial/security writes
- closed-month protections
- append-only audit/security logs
- framework production gate

## Items still requiring real account/input data
- Real Clerk production publishable + secret keys are not committed in this ZIP.
- The three immutable Clerk `user_...` Owner IDs still need to be bound in production and the Owner registry then locked.
- Production Vercel environment variables/domain still need final configuration.
- Real company operating data needs to be loaded/reconciled; do not substitute demo data.
- A genuine package-lock.json should be generated with npm access; do not fabricate lockfile integrity metadata.

## Product note
Outlet Audits include a Hygiene score as one of the audit dimensions. A standalone detailed Hygiene & Food Safety Audit module has not yet been built.

## Start here
Read in this order:
1. START_HERE_V6.4.txt
2. CLAUDE.md
3. HANDOFF_SUMMARY.md
4. SECURITY.md
5. DEPLOYMENT.md
6. PATCH_REPORT_v6.4.md
7. BRANDING_PATCH_V6.4.1.md

Run the static gates before changing behavior:
- npm run verify:static
- npm run release:qa
- npm run framework:gate

Then, once dependencies are installed and a real lockfile exists:
- npm run typecheck
- npm run production:build

Preserve the existing Grub Monkeys visual direction and security architecture unless explicitly instructed otherwise.

## v6.5 Daily Checklist addition
A new `/checklists` module has been added with editable Daily Opening and Daily Closing templates. Existing installations must run `db/daily-checklists.sql` before the page is used. The migration is additive and production has not been modified by this patch. See `DAILY_CHECKLISTS_V6.5.md`.
