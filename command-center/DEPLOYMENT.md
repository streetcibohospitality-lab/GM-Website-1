# Deployment handoff

Target: `dashboard.grubmonkeys.in`

## Environment

Copy `.env.example` to the Vercel Production environment and fill only real production values. `DATABASE_URL` must be a restricted runtime credential. Never place the Neon owner/admin URL in Vercel runtime variables.

`GM_DASH_MFA_ENCRYPTION_KEY` must decode to exactly 32 random bytes. Generate with a cryptographically secure random source and store only as an environment secret.

Keep `GM_ALLOW_DEMO_DATA=0` in Production. Development demo fallback must never be enabled on the live Owner Command Center.

## Clerk

Use one production Clerk instance for the Command Center and create only these three Owner accounts:

- mueen.ahmed1922@gmail.com
- reachafridi@gmail.com
- md.hisham29@gmail.com

Require strong account credentials in Clerk. Collect the immutable Clerk user ID for each of the three accounts, bind them using `db/bind-owner-identities.sql.template`, verify all three are bound, then run `db/lock-owner-registry.sql`. Keep `GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP=0`. The application itself then requires GM Authenticator TOTP.

## Neon

The separate Neon project is `GM Command Center`. The schema and backend-completion cleanup have already been applied. `db/backend-completion.sql` is included as the idempotent handoff migration for a fresh/reconstructed environment. Use `db/verify.sql` and `db/verify-owner-only.sql` to re-check production permissions before launch.

## Framework security gate

Do not deploy while `next` remains `16.3.2`. Upgrade to the official patched release newer than 16.3.2, then run `npm run production:build`.

## DNS/Vercel

Use a separate Vercel project. Add `dashboard.grubmonkeys.in` as its production domain and create only the DNS record Vercel specifies for the `dashboard` subdomain. Do not modify the restaurant root domain records.


## People payroll control
Employee records include current monthly salary, effective date, salary history and audited increment/adjustment records. Salary changes are Owner-only and require fresh MFA.
