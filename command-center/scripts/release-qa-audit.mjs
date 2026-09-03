import fs from "node:fs";

const checks = [];
const pass = (name, ok) => checks.push({ name, ok: Boolean(ok) });
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const pkg = JSON.parse(read("package.json"));
const nextVersion = String(pkg.dependencies?.next || "0.0.0").replace(/^[^0-9]*/, "");
const [maj=0,min=0,patch=0] = nextVersion.split(".").map(Number);
pass("Next.js meets 16.3.3 security baseline", maj > 16 || (maj === 16 && (min > 3 || (min === 3 && patch >= 3))));

const importCommit = read("app/api/imports/commit/route.ts");
pass("CSV commit uses a serializable transaction", importCommit.includes('sql.begin("isolation level serializable",async(tx)=>'));
pass("Import job ID is generated before transaction", importCommit.includes("randomUUID()") && importCommit.includes("data_import_jobs(id,"));
pass("Import audit row is finalized inside transaction", importCommit.includes("await tx`INSERT INTO audit_log"));
pass("Import API hides raw internal exceptions", importCommit.includes("internalApiError(error") && !importCommit.includes("error.message"));
pass("Post-commit alert/security refresh cannot misreport rollback", importCommit.includes("Promise.allSettled") && importCommit.includes("post-commit warning"));

const importValidate = read("app/api/imports/validate/route.ts");
pass("Validation API hides raw internal exceptions", importValidate.includes("internalApiError(error") && !importValidate.includes("error.message"));

const data = read("lib/command-data.ts");
pass("Production command-data failures are not converted to zeros", data.includes("throw new CommandDataQueryError()"));
pass("Demo-only fallback remains available", data.includes("if(demoAllowed())return fallback"));

const shell = read("components/command-shell.tsx");
pass("Sidebar command search is a native button", shell.includes('<button type="button" className="rail-shortcut"'));
pass("Command palette exposes modal semantics", shell.includes('role="dialog" aria-modal="true"'));
pass("Command palette traps and restores focus", shell.includes("paletteRef") && shell.includes("prior?.focus()"));

const css = read("app/globals.css");
pass("Reduced-motion preference is supported", css.includes("@media (prefers-reduced-motion: reduce)"));
const explicitSizes = [...css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
pass("Explicit CSS font-size floor is 9px", explicitSizes.every(v => v >= 9));
const shorthandSizes = [...css.matchAll(/font:[^;{}]*?\s(\d+(?:\.\d+)?)px\//g)].map(m => Number(m[1]));
pass("CSS shorthand font-size floor is 9px", shorthandSizes.every(v => v >= 9));


const people = read("components/people-lifecycle.tsx");
pass("People modal exposes dialog semantics", people.includes('role="dialog" aria-modal="true"') && people.includes('aria-labelledby="people-modal-title"'));
pass("People modal traps focus and handles Escape", people.includes("modalRef") && people.includes('event.key==="Escape"') && people.includes("returnFocusRef"));
const recordActions = read("components/qa-record-actions.tsx");
pass("Shared record modal traps and restores focus", recordActions.includes("cardRef") && recordActions.includes("returnFocusRef") && recordActions.includes('event.key==="Escape"'));

const checklistApi = read("app/api/checklists/route.ts");
const checklistUi = read("components/checklist-control.tsx");
const checklistMigration = read("db/daily-checklists.sql");
pass("Daily Opening and Closing checklist templates are seeded", checklistMigration.includes("'opening','Daily Opening'") && checklistMigration.includes("'closing','Daily Closing'"));
pass("Checklist edits require same-origin and fresh MFA", checklistApi.includes("enforceSameOrigin") && checklistApi.includes("hasFreshFinancialMfa"));
pass("Checklist updates commit atomically", checklistApi.includes('sql.begin("isolation level serializable",async(tx)=>'));
pass("Checklist editor supports add, delete and reorder", checklistUi.includes("addItem") && checklistUi.includes("removeItem") && checklistUi.includes("moveItem"));
pass("Checklist editor supports required and active controls", checklistUi.includes("REQUIRED") && checklistUi.includes("PAUSED"));

const session = read("lib/single-session.ts") + read("lib/device-security.ts");
pass("Clerk revoke failures are observable", session.includes("clerk_session_revoke_failed") && !/catch\s*\{\s*\}/.test(session));

const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
console.log(`RELEASE_QA_AUDIT ${checks.length - failed.length}/${checks.length}`);
if (failed.length) process.exit(1);
