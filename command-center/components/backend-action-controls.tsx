"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function request(url:string,init:RequestInit,next:string){
  const response=await fetch(url,init);
  if(response.status===428){location.href=`/security/verify?next=${encodeURIComponent(next)}`;return null;}
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.error||"Action failed");
  return body;
}

export function ControlRefreshButton(){
  const router=useRouter();const[busy,setBusy]=useState(false);
  return <button className="command-button" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await request('/api/controls/refresh',{method:'POST'},'/alerts');if(r){router.refresh();}}catch(e){alert(e instanceof Error?e.message:'Control refresh failed');}finally{setBusy(false);}}}>{busy?'REFRESHING…':'REFRESH CONTROL RULES'} <span>→</span></button>;
}

export function AlertAcknowledgeButton({id}:{id:string}){
  const router=useRouter();const[busy,setBusy]=useState(false);const realId=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
  if(!realId)return <button onClick={()=>router.push("/people")} title="This reminder is generated from the People lifecycle view; manage it from People.">OPEN PEOPLE →</button>;
  return <button disabled={busy} onClick={async()=>{setBusy(true);try{const r=await request(`/api/alerts/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'acknowledged'})},'/alerts');if(r)router.refresh();}catch(e){alert(e instanceof Error?e.message:'Alert update failed');}finally{setBusy(false);}}}>{busy?'SAVING…':'ACKNOWLEDGE →'}</button>;
}

export function MonthCloseButton({year,month,closed}:{year:number;month:number;closed:boolean}){
  const router=useRouter();const[busy,setBusy]=useState(false);
  return <button className="command-button" disabled={busy||closed} onClick={async()=>{if(!confirm(`Close ${year}-${String(month).padStart(2,'0')}? Closed periods reject protected rewrites.`))return;setBusy(true);try{const r=await request('/api/reporting-periods/close',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({year,month,note:'Closed by Owner from Command Center'})},'/financials');if(r)router.refresh();}catch(e){alert(e instanceof Error?e.message:'Month close failed');}finally{setBusy(false);}}}>{closed?'MONTH CLOSED':busy?'CLOSING…':'START MONTH CLOSE'} <span>→</span></button>;
}
