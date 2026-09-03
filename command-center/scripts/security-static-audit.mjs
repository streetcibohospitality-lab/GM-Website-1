import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const all = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs|css|sql)$/.test(entry.name)) all.push(full);
  }
}
walk(root);
const runtimeFiles = all.filter((p) => /\/(app|components|lib)\//.test(p) || /\/(proxy\.ts|next\.config\.ts)$/.test(p));
const joined = runtimeFiles.map((p) => fs.readFileSync(p, "utf8")).join("\n");
const checks = [
  ["three-owner directory", () => ["mueen.ahmed1922@gmail.com","reachafridi@gmail.com","md.hisham29@gmail.com"].every((x) => read("lib/owner-directory.ts").includes(x))],
  ["owner registry table", () => read("db/schema.sql").includes("CREATE TABLE IF NOT EXISTS owner_access_registry")],
  ["owner-only database role constraint", () => read("db/schema.sql").includes("CHECK (role = 'owner')")],
  ["immutable Clerk binding", () => read("lib/authz.ts").includes("owner_identity_mismatch") && read("lib/authz.ts").includes("clerk_user_id")],
  ["database blocks Owner identity rebind", () => read("db/schema.sql").includes("owner_identity_binding_is_immutable") && read("db/schema.sql").includes("trg_owner_identity_immutable")],
  ["production email bootstrap disabled by default", () => read(".env.example").includes("GM_DASH_ALLOW_OWNER_EMAIL_BOOTSTRAP=0") && read("lib/authz.ts").includes("owner_identity_not_bound")],
  ["verified email required", () => read("lib/authz.ts").includes('verification?.status === "verified"')],
  ["MFA encryption AES-256-GCM", () => read("lib/mfa.ts").includes('createCipheriv("aes-256-gcm"')],
  ["TOTP replay protection", () => read("lib/mfa.ts").includes("last_totp_counter")],
  ["approved device strict cookie", () => read("lib/device-security.ts").includes('sameSite: "strict"') && read("lib/device-security.ts").includes("httpOnly: true")],
  ["first device requires MFA", () => read("app/api/security/device/register/route.ts").includes("hasRecentMfaVerification")],
  ["one active session", () => read("db/schema.sql").includes("active_sessions_one_live_per_user_idx")],
  ["2-hour absolute session", () => read("lib/single-session.ts").includes("2 * 60 * 60")],
  ["inactivity lock", () => read("components/session-security-guard.tsx").includes("10 * 60 * 1000") && read("app/api/security/session/lock/route.ts").includes("DELETE FROM mfa_session_verifications")],
  ["idle full sign-out", () => read("components/session-security-guard.tsx").includes("30 * 60 * 1000") && read("components/session-security-guard.tsx").includes("signOut")],
  ["strict origin middleware", () => read("proxy.ts").includes("authorizedParties")],
  ["anti-framing CSP", () => read("proxy.ts").includes('"frame-ancestors":["\'none\'"]')],
  ["no-store headers", () => read("next.config.ts").includes("private, no-store")],
  ["audit logs append-only", () => read("db/schema.sql").includes("REVOKE UPDATE,DELETE,TRUNCATE ON audit_log,security_events")],
  ["owner registry cannot be expanded by runtime", () => read("db/schema.sql").includes("REVOKE ALL ON owner_access_registry FROM gm_command_runtime") && !read("db/schema.sql").includes("GRANT INSERT ON owner_access_registry TO gm_command_runtime")],
  ["closed month database guard", () => { const schema=read("db/schema.sql"); return schema.includes("closed_reporting_period") || schema.includes("reporting period is closed") || schema.includes("status = 'closed'"); }],
  ["single demo-data policy", () => read(".env.example").includes("GM_ALLOW_DEMO_DATA=0") && !joined.includes("GM_DASH_DEMO_MODE") && read("lib/runtime-mode.ts").includes("GM_ALLOW_DEMO_DATA")],
  ["alert dedupe compatible with upsert", () => read("db/schema.sql").includes("CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_dedupe ON alerts(dedupe_key);") && read("lib/control-rules.ts").includes("ON CONFLICT(dedupe_key)")],
  ["backend write routes present", () => ["outlets","monthly-financials","expenses","targets","vendors","purchases","cash-reconciliation","tasks","documents","alerts/[id]","reporting-periods/close"].every((x) => fs.existsSync(path.join(root,`app/api/${x}/route.ts`)))],
  ["restaurant control rules implemented", () => ["customer_experience","maintenance","outlet_audit","staff_exit","document_expiry","cash_variance","revenue_trajectory","food_cost","labour_cost"].every((x) => read("lib/control-rules.ts").includes(x))],
  ["no screenshot/watermark surveillance code", () => !/watermark|PrintScreen|contextmenu|screenshot/i.test(joined)],
];
let failed = false;
for (const [name, check] of checks) {
  let ok = false;
  try { ok = Boolean(check()); } catch { ok = false; }
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`SECURITY_AUDIT_PASS ${checks.length} checks`);
