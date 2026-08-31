"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PeopleDashboardData, PeopleStaffRow } from "@/lib/people";

function money(n:number){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n)}
function fmtDate(v:string|null){if(!v)return "—";const d=new Date(`${v}T00:00:00`);return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
function tenure(v:string|null){if(!v)return "—";const start=new Date(`${v}T00:00:00`).getTime();const months=Math.max(0,Math.floor((Date.now()-start)/(1000*60*60*24*30.44)));const y=Math.floor(months/12),m=months%12;return y?`${y}Y ${m}M`:`${m}M`}
function scoreTone(v:number|null){if(v==null)return "muted";if(v>=8.5)return "strong";if(v>=7)return "steady";return "watch"}

type Modal="add"|"notice"|"review"|"salary"|null;
export function PeopleLifecycle({data}:{data:PeopleDashboardData}){
 const [modal,setModal]=useState<Modal>(null);const [selected,setSelected]=useState<PeopleStaffRow|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const modalRef=useRef<HTMLFormElement>(null);const returnFocusRef=useRef<HTMLElement|null>(null);
 const notice=data.staff.filter(s=>s.status==="notice").sort((a,b)=>(a.daysRemaining??999)-(b.daysRemaining??999));
 const top=[...data.staff].filter(s=>s.latestRating!=null).sort((a,b)=>(b.latestRating??0)-(a.latestRating??0)).slice(0,5);
 const reviews=data.staff.filter(s=>s.status==="active"&&s.latestRating==null).slice(0,5);
 const active=data.staff.filter(s=>s.status==="active").length;
 const monthlyCost=data.staff.reduce((sum,s)=>sum+s.monthlyCost,0);
 const monthlyPayroll=data.staff.reduce((sum,s)=>sum+s.currentSalary,0);
 const open=(kind:Modal,staff?:PeopleStaffRow)=>{returnFocusRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setSelected(staff||null);setMessage("");setModal(kind)};
 useEffect(()=>{
   if(!modal){returnFocusRef.current?.focus();return;}
   const node=modalRef.current;if(!node)return;
   const focusable=()=>Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'));
   const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setModal(null);return;}if(event.key!=="Tab")return;const items=focusable();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
   window.addEventListener("keydown",key);queueMicrotask(()=>focusable()[0]?.focus());return()=>window.removeEventListener("keydown",key);
 },[modal]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const fd=new FormData(e.currentTarget);try{
   let url="",method="POST",payload:any={};
   if(modal==="add"){url="/api/people/staff";payload={employeeCode:String(fd.get("employeeCode")||"")||undefined,fullName:String(fd.get("fullName")||""),roleTitle:String(fd.get("roleTitle")||""),joiningDate:String(fd.get("joiningDate")||""),employmentType:String(fd.get("employmentType")||"full_time"),monthlyCost:Number(fd.get("monthlyCost")||0)||undefined,currentSalary:Number(fd.get("currentSalary")||0)||undefined,outletCode:String(fd.get("outletCode")||"")||undefined,probationEndDate:String(fd.get("probationEndDate")||"")||undefined};}
   if(modal==="notice"&&selected){url=`/api/people/staff/${selected.id}`;method="PATCH";payload={noticeGivenDate:String(fd.get("noticeGivenDate")||""),lastWorkingDate:String(fd.get("lastWorkingDate")||""),exitReason:String(fd.get("exitReason")||"")||undefined};}
   if(modal==="review"&&selected){url="/api/people/performance";payload={staffId:selected.id,month:String(fd.get("month")||""),overallRating:Number(fd.get("overallRating")),attendanceRating:Number(fd.get("attendanceRating")),roleSkillRating:Number(fd.get("roleSkillRating")),teamworkRating:Number(fd.get("teamworkRating")),ownershipRating:Number(fd.get("ownershipRating")),strengths:String(fd.get("strengths")||"")||undefined,improvementPoints:String(fd.get("improvementPoints")||"")||undefined,reviewNotes:String(fd.get("reviewNotes")||"")||undefined};}
   if(modal==="salary"&&selected){url="/api/people/salary";payload={staffId:selected.id,effectiveFrom:String(fd.get("effectiveFrom")||""),monthlySalary:Number(fd.get("monthlySalary")),changeType:String(fd.get("changeType")||"adjustment"),notes:String(fd.get("notes")||"")||undefined};}
   const res=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const out=await res.json();if(!res.ok){setMessage(out.error||"Unable to save");return;}setMessage("SAVED · REFRESHING");setTimeout(()=>location.reload(),500);
 }catch{setMessage("Unable to save. Check connection and try again.");}finally{setBusy(false)}}
 const thisMonth=new Date().toISOString().slice(0,7);
 return <>
  {data.loadError&&<div className="data-held-banner"><b>PEOPLE DATA HELD</b><span>The employee register could not be read from the controlled database. No zero-state is being substituted for the connection failure.</span></div>}
  <section className="people-command-head">
   <div><span>06 / PEOPLE COMMAND</span><h1>People are a business metric.</h1><p>Joining, tenure, monthly performance and exit planning in one Owner-only operating record.</p></div>
   <div className="people-command-actions"><button className="command-button" onClick={()=>open("add")}>ADD EMPLOYEE <b>+</b></button><button className="ghost-button" onClick={()=>document.getElementById("performance-board")?.scrollIntoView({behavior:"smooth"})}>PERFORMANCE BOARD ↓</button></div>
  </section>
  <section className="people-kpi-rail">
   <div><small>ACTIVE HEADCOUNT</small><strong>{active}</strong><em>OWNER CONTROLLED</em></div>
   <div><small>NEW JOINERS / MONTH</small><strong>{data.joiningThisMonth}</strong><em>JOINING DATE TRACKED</em></div>
   <div className={data.noticeCount?"is-alert":""}><small>ON NOTICE</small><strong>{data.noticeCount}</strong><em>30-DAY EXIT WATCH</em></div>
   <div><small>AVG PERFORMANCE</small><strong>{data.avgRating?.toFixed(1)??"—"}<i>/10</i></strong><em>MONTHLY OWNER RATING</em></div>
   <div><small>REVIEWS DUE</small><strong>{data.reviewsDue}</strong><em>MONTHLY REVIEW QUEUE</em></div>
   <div><small>MONTHLY PAYROLL</small><strong>{money(monthlyPayroll)}</strong><em>CURRENT BASE SALARIES</em></div>
  </section>

  <section className="people-control-grid">
   <article className="people-control-card people-directory-card">
    <header><span>01</span><div><small>EMPLOYEE MASTER</small><h2>Lifecycle register</h2></div><em>{data.staff.length} RECORDS</em></header>
    <div className="employee-register-head"><span>EMPLOYEE</span><span>ROLE / OUTLET</span><span>JOINED</span><span>SALARY</span><span>PERFORMANCE</span><span>STATUS / EXIT</span><span>ACTIONS</span></div>
    <div className="employee-register-body">{data.staff.map(s=><div className="employee-register-row" key={s.id}>
      <span className="employee-id"><b>{s.employeeCode}</b><strong>{s.fullName}</strong></span>
      <span><strong>{s.roleTitle}</strong><small>{s.outletCode} · {s.outletName}</small></span>
      <span><strong>{fmtDate(s.joiningDate)}</strong><small>JOIN DATE</small></span>
      <span><strong>{money(s.currentSalary)}</strong><small>CURRENT / MONTH</small><em>{s.salaryEffectiveFrom?`FROM ${fmtDate(s.salaryEffectiveFrom)}`:"SALARY NOT SET"}</em></span>
      <span><div className={`performance-chip ${scoreTone(s.latestRating)}`}><b>{s.latestRating?.toFixed(1)??"—"}</b><small>/10</small></div><em>{s.latestRatingMonth||"NOT RATED"}</em></span>
      <span>{s.status==="notice"?<><b className="notice-badge">NOTICE</b><small>{s.daysRemaining==null?"":`${Math.max(0,s.daysRemaining)} DAYS LEFT`}</small><em>{fmtDate(s.lastWorkingDate)}</em></>:<><b className={`status-dot ${s.status}`}>{s.status.toUpperCase()}</b><small>{s.status==="active"?"IN SERVICE":"EMPLOYEE STATUS"}</small></>}</span>
      <span className="staff-row-actions"><button onClick={()=>open("review",s)}>RATE</button><button onClick={()=>open("salary",s)}>SALARY</button><button onClick={()=>open("notice",s)}>NOTICE</button></span>
    </div>)}</div>
   </article>

   <aside className="people-control-card exit-watch-card">
    <header><span>02</span><div><small>EXIT CONTROL</small><h2>30-day notice watch</h2></div></header>
    {notice.length? <div className="notice-watch-list">{notice.map(s=><div key={s.id}><b className={s.daysRemaining!=null&&s.daysRemaining<=7?"critical":""}>{s.daysRemaining??"—"}</b><span><strong>{s.fullName}</strong><small>{s.roleTitle} · {s.outletCode}</small><em>LAST DAY {fmtDate(s.lastWorkingDate)}</em></span><button onClick={()=>open("notice",s)}>EDIT</button></div>)}</div>:<div className="empty-command"><strong>NO UPCOMING EXITS</strong><p>When a notice period is recorded, the countdown appears here automatically for the final 30 days.</p></div>}
    <div className="notice-rules"><span>30 DAYS <b>NOTICE ACTIVE</b></span><span>14 DAYS <b>HANDOVER CHECK</b></span><span>07 DAYS <b>OWNER PRIORITY</b></span><span>01 DAY <b>EXIT CONFIRM</b></span></div>
   </aside>

   <article className="people-control-card performance-board-card" id="performance-board">
    <header><span>03</span><div><small>MONTHLY PERFORMANCE</small><h2>Owner rating board</h2></div><em>0 — 10 SCALE</em></header>
    <div className="rating-scale"><span>0</span><i/><b>NEEDS IMPROVEMENT</b><i/><b>SOLID</b><i/><b>EXCELLENT</b><i/><span>10</span></div>
    <div className="top-performer-list">{top.map((s,i)=><button key={s.id} onClick={()=>open("review",s)}><b>{String(i+1).padStart(2,"0")}</b><span><strong>{s.fullName}</strong><small>{s.roleTitle} · {s.outletCode}</small></span><div><strong>{s.latestRating?.toFixed(1)}</strong><small>/10</small></div></button>)}</div>
   </article>

   <aside className="people-control-card review-queue-card">
    <header><span>04</span><div><small>REVIEW CONTROL</small><h2>Monthly review queue</h2></div></header>
    {reviews.length?<div className="review-queue-list">{reviews.map(s=><button key={s.id} onClick={()=>open("review",s)}><span><strong>{s.fullName}</strong><small>{s.employeeCode} · {s.outletCode}</small></span><b>RATE →</b></button>)}</div>:<div className="empty-command"><strong>REVIEWS CURRENT</strong><p>No missing monthly reviews in the live dataset.</p></div>}
    <div className="review-method"><small>RECOMMENDED MONTHLY SCORE</small><p><b>40%</b> role execution · <b>20%</b> attendance · <b>20%</b> teamwork · <b>20%</b> ownership</p></div>
   </aside>
  </section>

  {modal&&<div className="people-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setModal(null)}}><form ref={modalRef} className="people-modal" role="dialog" aria-modal="true" aria-labelledby="people-modal-title" onSubmit={submit}>
    <header><span id="people-modal-title">{modal==="add"?"NEW EMPLOYEE":modal==="notice"?"NOTICE PERIOD":modal==="salary"?"SALARY CONTROL":"MONTHLY PERFORMANCE"}</span><button type="button" onClick={()=>setModal(null)} aria-label="Close People form">×</button></header>
    {modal==="add"&&<div className="people-form-grid"><label><span>EMPLOYEE CODE</span><input name="employeeCode" placeholder="GM-025"/></label><label><span>FULL NAME *</span><input name="fullName" required/></label><label><span>ROLE / DESIGNATION *</span><input name="roleTitle" required placeholder="Outlet Manager"/></label><label><span>OUTLET CODE</span><input name="outletCode" placeholder="KRM"/></label><label><span>JOINING DATE *</span><input name="joiningDate" type="date" required/></label><label><span>EMPLOYMENT TYPE</span><select name="employmentType"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></label><label><span>MONTHLY SALARY *</span><input name="currentSalary" type="number" min="0" step="1" required/></label><label><span>TOTAL EMPLOYER COST</span><input name="monthlyCost" type="number" min="0" step="1"/></label><label><span>PROBATION END</span><input name="probationEndDate" type="date"/></label></div>}
    {modal==="notice"&&selected&&<><div className="modal-employee"><small>EMPLOYEE</small><strong>{selected.fullName}</strong><span>{selected.employeeCode} · {selected.roleTitle} · {selected.outletCode}</span></div><div className="people-form-grid"><label><span>NOTICE GIVEN *</span><input name="noticeGivenDate" type="date" required defaultValue={selected.noticeGivenDate||new Date().toISOString().slice(0,10)}/></label><label><span>LAST WORKING DAY *</span><input name="lastWorkingDate" type="date" required defaultValue={selected.lastWorkingDate||""}/></label><label className="span-2"><span>EXIT / NOTICE NOTES</span><textarea name="exitReason" rows={4} placeholder="Reason, handover plan, replacement requirement…"/></label></div></>}

    {modal==="salary"&&selected&&<><div className="modal-employee"><small>EMPLOYEE</small><strong>{selected.fullName}</strong><span>{selected.employeeCode} · {selected.roleTitle} · {selected.outletCode}</span></div><div className="salary-current-strip"><small>CURRENT MONTHLY SALARY</small><strong>{money(selected.currentSalary)}</strong><em>{selected.salaryEffectiveFrom?`EFFECTIVE ${fmtDate(selected.salaryEffectiveFrom)}`:"NO EFFECTIVE DATE"}</em></div><div className="people-form-grid"><label><span>NEW MONTHLY SALARY *</span><input name="monthlySalary" type="number" min="0" max="10000000" step="1" required defaultValue={selected.currentSalary||undefined}/></label><label><span>EFFECTIVE FROM *</span><input name="effectiveFrom" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label><label><span>CHANGE TYPE</span><select name="changeType" defaultValue={selected.currentSalary>0?"increment":"joining"}><option value="joining">Joining salary</option><option value="increment">Increment</option><option value="adjustment">Adjustment</option><option value="correction">Correction</option></select></label><label><span>PREVIOUS SALARY</span><input value={money(selected.currentSalary)} readOnly/></label><label className="span-2"><span>OWNER NOTES</span><textarea name="notes" rows={3} placeholder="Increment reason, appraisal note, correction reference…"/></label></div></>}
    {modal==="review"&&selected&&<><div className="modal-employee"><small>EMPLOYEE</small><strong>{selected.fullName}</strong><span>{selected.employeeCode} · {selected.roleTitle} · {selected.outletCode}</span></div><div className="people-form-grid"><label><span>REVIEW MONTH *</span><input name="month" type="month" required defaultValue={thisMonth}/></label><label><span>OVERALL /10 *</span><input name="overallRating" type="number" min="0" max="10" step="0.1" required defaultValue={selected.latestRating??8}/></label><label><span>ATTENDANCE /10</span><input name="attendanceRating" type="number" min="0" max="10" step="0.1" defaultValue="8"/></label><label><span>ROLE EXECUTION /10</span><input name="roleSkillRating" type="number" min="0" max="10" step="0.1" defaultValue="8"/></label><label><span>TEAMWORK /10</span><input name="teamworkRating" type="number" min="0" max="10" step="0.1" defaultValue="8"/></label><label><span>OWNERSHIP /10</span><input name="ownershipRating" type="number" min="0" max="10" step="0.1" defaultValue="8"/></label><label className="span-2"><span>STRENGTHS</span><textarea name="strengths" rows={2}/></label><label className="span-2"><span>IMPROVEMENT POINTS</span><textarea name="improvementPoints" rows={2}/></label><label className="span-2"><span>OWNER REVIEW NOTES</span><textarea name="reviewNotes" rows={3}/></label></div></>}
    {message&&<p className="people-form-message">{message}</p>}<footer><small>OWNER ONLY · FRESH MFA REQUIRED TO SAVE</small><button className="command-button" disabled={busy}>{busy?"SAVING…":"SAVE RECORD →"}</button></footer>
  </form></div>}
 </>
}
