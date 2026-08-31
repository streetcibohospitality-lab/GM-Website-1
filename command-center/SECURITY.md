# Security architecture

## Identity

Access is closed to exactly three Owners. The code allowlist and database registry must agree. The Clerk email must be verified. Production pre-binds each immutable Clerk user ID before first login. Email bootstrap is disabled by default. A database trigger prevents re-binding, and the final lock step revokes runtime UPDATE permission on the registry entirely.

## MFA

GM Command Center implements its own RFC-style TOTP factor independently of Clerk plan-level MFA. TOTP secrets are encrypted using AES-256-GCM with `GM_DASH_MFA_ENCRYPTION_KEY`. Recovery codes are stored only as keyed hashes. Reused TOTP time counters are rejected.

## Device trust

Every Owner uses trusted browsers. Device cookies are Secure, HttpOnly, SameSite=Strict and `__Host-` scoped. The database stores only SHA-256 hashes. The first browser for an Owner may self-bootstrap only after a successful GM TOTP verification; subsequent browsers require approval from an already authorized Owner session.

## Session controls

Only one application session may be live for an Owner at a time. A new session revokes the older Clerk session. Protected screens lock after 10 minutes without user activity and delete the session's MFA verification. Continued inactivity signs out after 30 minutes. Application sessions have a two-hour absolute maximum.

## Data protection

All protected responses are private/no-store, pages are noindex, framing is denied, origin checks protect state-changing requests, and request bodies/rates are bounded. Financial and security changes require recent MFA.

## Database

The Vercel runtime must use a login that is a member of `gm_command_runtime`, never `neondb_owner`. The runtime can read the Owner registry and bind only the immutable Clerk ID fields; it cannot add/delete Owners or change registry identity/activation. Audit and security logs are append-only from the runtime perspective. Closed reporting periods reject protected financial changes in PostgreSQL itself.

## Deliberately not used

There is no screenshot detection, watermarking, copy blocking, print blocking or browser surveillance. These controls do not materially improve this three-Owner threat model.


## People payroll control
Employee records include current monthly salary, effective date, salary history and audited increment/adjustment records. Salary changes are Owner-only and require fresh MFA.
