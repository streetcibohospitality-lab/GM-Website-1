import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const ts=require("typescript");

const roots=["app","components"];
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(/\.tsx$/.test(p))files.push(p)}}
for(const root of roots)walk(root);
const read=p=>fs.readFileSync(p,"utf8");
const assertions=[];
function check(name,ok,detail=""){assertions.push({name,ok,detail});}
function tagName(opening){const t=opening.tagName;return ts.isIdentifier(t)?t.text:t.getText();}
let totalButtons=0;const dead=[];
for(const f of files){
  const src=read(f);const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(n,anc=[]){
    if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
      const opening=ts.isJsxElement(n)?n.openingElement:n;const name=tagName(opening);
      if(name==="button"){
        totalButtons++;
        const attrs=opening.attributes.properties.filter(ts.isJsxAttribute);const amap=new Map(attrs.map(a=>[String(a.name.text),a]));
        const hasHandler=[...amap.keys()].some(k=>k.startsWith("on"));
        const type=amap.get("type")?.initializer?.getText(sf).replace(/["']/g,"");
        const inForm=anc.includes("form");
        const inActionWrapper=anc.some(x=>["SignOutButton"].includes(x));
        const actionable=hasHandler||type==="submit"||(!type&&inForm)||inActionWrapper;
        if(!actionable){dead.push(`${f}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1} ${n.getText(sf).replace(/\s+/g," ").slice(0,150)}`)}
      }
      const next=[...anc,name];
      if(ts.isJsxElement(n))for(const c of n.children)visit(c,next);
      for(const a of opening.attributes.properties){if(ts.isJsxAttribute(a)&&a.initializer&&ts.isJsxExpression(a.initializer)&&a.initializer.expression)visit(a.initializer.expression,anc)}
      return;
    }
    ts.forEachChild(n,c=>visit(c,anc));
  }
  visit(sf,[]);
}
check(`all ${totalButtons} visible JSX buttons have an action path`,dead.length===0,dead.join("\n"));

const combined=files.map(read).join("\n");
for(const bad of ["vs Jul 2026","18 AUG 2026","August group target","STOCK ADJUSTMENT","NO EMPLOYEE DEVICES"]){
  check(`no stale/misleading copy: ${bad}`,!combined.includes(bad));
}
const overview=read("components/overview.tsx");
check("overview totals recompute when outlet data changes",/useMemo\([\s\S]*?\[outlets\]\)/.test(overview));
check("overview quick task opens creation flow",overview.includes('/tasks?new=1'));
check("overview expense action opens real entry control",overview.includes('/expenses#expense-entry'));
check("overview stock action is truthful import workflow",overview.includes('IMPORT STOCK COUNT')&&overview.includes('/imports'));
check("overview does not use synthetic TinyTrend",!overview.includes("TinyTrend"));
check("overview period/ranking labels are explicitly non-interactive context",overview.includes("brand-card-context")&&!overview.includes('className="brand-card-filter">MTD'));

const reports=read("app/(command)/reports/page.tsx");
check("management pack export is wired",reports.includes('href="/api/reports/management-pack"')&&fs.existsSync("app/api/reports/management-pack/route.ts"));
check("report OPEN links are real routes",(reports.match(/href:\s*'\//g)||[]).length>=6);
check("task create and completion APIs exist",fs.existsSync("app/api/tasks/route.ts")&&fs.existsSync("app/api/tasks/[id]/route.ts"));
check("outlet create API exists",fs.existsSync("app/api/outlets/route.ts"));
check("document create API exists",fs.existsSync("app/api/documents/route.ts"));
check("expense entry API exists",fs.existsSync("app/api/expenses/route.ts"));

const cx=read("components/customer-experience-control.tsx");
const audits=read("components/outlet-audit-control.tsx");
check("customer table has contained horizontal scroll",cx.includes("chain-table-scroll"));
check("customer form uses active reporting period",cx.includes("year")&&cx.includes("month")&&!cx.includes("2026-08"));
check("outlet audit form uses active reporting period",audits.includes("year")&&audits.includes("month")&&!audits.includes("2026-08"));

const maintenance=read("components/maintenance-control.tsx");
check("maintenance incidents can be edited/resolved",maintenance.includes("editIncident")&&maintenance.includes('option>resolved</option>')&&maintenance.includes("resolutionNotes"));
check("maintenance assets can be edited",maintenance.includes("editAsset")&&maintenance.includes("nextServiceDue")&&maintenance.includes("id:a.id"));
check("maintenance exposes reopen/in-progress/resolve actions",maintenance.includes("REOPEN")&&maintenance.includes("MARK IN PROGRESS")&&maintenance.includes("MARK RESOLVED"));
const assetApi=read("app/api/maintenance/assets/route.ts");
check("equipment edits update by record id",assetApi.includes("id:z.string().uuid().optional()")&&assetApi.includes("WHERE id=${v.id}"));

const commandPages=fs.readdirSync("app/(command)",{withFileTypes:true}).filter(e=>e.isDirectory()).flatMap(e=>{const p=`app/(command)/${e.name}/page.tsx`;return fs.existsSync(p)?[p]:[]});
const silent=commandPages.filter(p=>/catch\s*\{\s*\}/.test(read(p)));
check("command pages do not silently swallow database failures",silent.length===0,silent.join(", "));

const css=read("app/globals.css");
check("tasks have tablet/mobile overflow containment",css.includes(".task-board-head,.task-row{min-width:860px}")&&css.includes(".task-board")&&css.includes("overflow:auto"));
check("documents have tablet/mobile overflow containment",css.includes(".document-head,.document-row{min-width:760px}"));
check("reports have tablet/mobile overflow containment",css.includes(".report-head,.report-row{min-width:690px}")&&css.includes(".report-table{overflow-x:auto}"));
check("record modals are viewport bounded",css.includes("max-height:min(88vh,900px)")&&css.includes("max-height:96vh"));

let failed=0;
for(const a of assertions){console.log(`${a.ok?"PASS":"FAIL"} ${a.name}`);if(!a.ok){failed++;if(a.detail)console.log(a.detail)}}
if(failed){console.error(`INTERACTION_AUDIT_FAIL ${failed}/${assertions.length}`);process.exit(1)}
console.log(`INTERACTION_AUDIT_PASS ${assertions.length} checks`);
