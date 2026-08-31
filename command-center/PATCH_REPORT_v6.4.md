# GM Command Center v6.4 Production Candidate — QA Remediation Report

**Date:** 26 Aug 2026 (Asia/Kolkata)

## Fixed in v6.4

1. **Next.js security baseline** — pinned `next` to stable `16.3.3`; production framework gate now requires 16.3.3 or newer.
2. **Silent command-data failures** — production DB read failures now throw a branded data-health error instead of substituting zeros/empty arrays. Demo fallbacks remain available only when demo mode is explicitly allowed.
3. **CSV import atomicity** — import business writes, supporting period/item writes, import-job record and audit-log record now execute in one Neon HTTP transaction at Serializable isolation. A pre-generated UUID lets audit finalization stay inside the same transaction.
4. **Import post-commit behavior** — security-event/control-rule refresh failures are reported as post-commit warnings and can no longer make a committed import appear rolled back.
5. **Import scope correctness** — staff salary-history backfill is limited to staff codes present in the current CSV; period creation is set-based rather than one query per period.
6. **Internal error leakage** — import validation/commit APIs return stable public error messages/codes while detailed exceptions are logged server-side.
7. **Clerk revoke observability** — failed Clerk session revocations now generate a high-severity security event instead of being silently swallowed.
8. **Keyboard/accessibility fixes** — sidebar command search is a native button; command palette has dialog semantics, focus trap, Escape handling and focus return; People and shared record modals now have consistent dialog/focus behavior.
9. **Reduced motion** — added `prefers-reduced-motion` handling for non-essential animation/transition behavior.
10. **Typography floor** — explicit and shorthand CSS font sizes below 9px were raised to a 9px minimum. Prior minimum was 4.4px.
11. **CI scaffold** — added GitHub Actions QA workflow with a hard requirement for `package-lock.json`, clean `npm ci`, static QA, typecheck and production build.
12. **Release QA script** — added `scripts/release-qa-audit.mjs` with 19 production-remediation assertions.
13. **Stale build artifact removed** — removed `tsconfig.tsbuildinfo` from the distributable source.
14. **npm reproducibility settings** — added exact-save/engine-strict npm settings and pinned package manager metadata.

## Verification completed

- Security static audit: **26/26 PASS**
- Interaction audit: **30/30 PASS**
- Source parser: **103 TS/TSX files PASS**
- Release QA audit: **19/19 PASS**
- Visible JSX buttons: **53/53 wired**
- Framework gate: **PASS on Next.js 16.3.3**
- CSS parse: **0 errors**
- CSS explicit font sizes below 9px: **0**
- CSS shorthand font sizes below 9px: **0**
- QA database transaction rollback probe: **PASS** (forced transaction error left 0 probe rows)

## Still unresolved / cannot be safely completed without external state

1. **`package-lock.json` and dependency-aware build** — npm registry DNS is unavailable in the execution environment (`EAI_AGAIN`). A lockfile was not fabricated. CI intentionally refuses release until a real lockfile exists.
2. **Owner identity binding** — live Neon still has 3 active Owners and 0 bound Clerk user IDs. Real immutable Clerk IDs are required.
3. **Vercel production setup** — connected Vercel team still has no project; production secrets/domain cannot be configured from the current available write tools.
4. **Production company data** — live Neon business tables are empty. Real approved company data/source files are required.
5. **Neon infrastructure hardening** — main branch protection, connection policy and retention settings are account-level controls not exposed by the available Neon write tools in this session.
6. **Authenticated browser E2E** — requires installed dependencies plus real Clerk/Vercel preview configuration and Owner test identities.

## Release decision

**HOLD — Production Candidate, not yet GO-LIVE.**

The source defects identified in the QA audit that can be fixed locally are remediated. Remaining blockers are external/release-environment items listed above.
