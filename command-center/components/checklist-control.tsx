"use client";

import { useMemo,useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistTemplateRecord } from "@/lib/checklists";

type DraftItem={id?:string;label:string;detail:string;required:boolean;active:boolean};
type DraftTemplate={id:string;code:"opening"|"closing";name:string;description:string;scheduleTime:string;timezone:string;active:boolean;items:DraftItem[]};

function toDraft(template:ChecklistTemplateRecord):DraftTemplate{
  return {id:template.id,code:template.code,name:template.name,description:template.description||"",scheduleTime:template.schedule_time||"10:00",timezone:template.timezone||"Asia/Kolkata",active:template.active,items:template.items.map(item=>({id:item.id,label:item.label,detail:item.detail||"",required:item.required,active:item.active}))};
}

export function ChecklistControl({initialTemplates}:{initialTemplates:ChecklistTemplateRecord[]}){
  const router=useRouter();
  const [templates,setTemplates]=useState<DraftTemplate[]>(()=>initialTemplates.map(toDraft));
  const [selected,setSelected]=useState<"opening"|"closing">("opening");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const current=useMemo(()=>templates.find(template=>template.code===selected),[templates,selected]);
  const updateCurrent=(change:Partial<DraftTemplate>)=>setTemplates(list=>list.map(template=>template.code===selected?{...template,...change}:template));
  const updateItem=(index:number,change:Partial<DraftItem>)=>{
    if(!current)return;
    updateCurrent({items:current.items.map((item,i)=>i===index?{...item,...change}:item)});
  };
  const moveItem=(index:number,direction:-1|1)=>{
    if(!current)return;const target=index+direction;if(target<0||target>=current.items.length)return;
    const items=[...current.items];[items[index],items[target]]=[items[target],items[index]];updateCurrent({items});
  };
  const removeItem=(index:number)=>{
    if(!current||current.items.length<=1)return;
    updateCurrent({items:current.items.filter((_,i)=>i!==index)});
  };
  const addItem=()=>{if(!current||current.items.length>=30)return;updateCurrent({items:[...current.items,{label:"New checklist item",detail:"",required:true,active:true}]});};
  async function save(){
    if(!current)return;setSaving(true);setMessage("Saving checklist…");
    const response=await fetch("/api/checklists",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({code:current.code,name:current.name,description:current.description,scheduleTime:current.scheduleTime,timezone:"Asia/Kolkata",active:current.active,items:current.items})});
    if(response.status===428){location.href=`/security/verify?next=/checklists`;return;}
    const data=await response.json().catch(()=>({}));
    if(response.ok&&data.template){setTemplates(list=>list.map(template=>template.code===selected?toDraft(data.template):template));}
    setMessage(response.ok?"Saved. This checklist is ready for daily dispatch.":data.error||"Could not save checklist");setSaving(false);if(response.ok)router.refresh();
  }
  if(!current)return <div className="checklist-empty"><strong>Checklist templates are not installed.</strong><span>Apply db/daily-checklists.sql to create Daily Opening and Daily Closing.</span></div>;
  const activeCount=current.items.filter(item=>item.active).length;
  const requiredCount=current.items.filter(item=>item.active&&item.required).length;
  return <div className="checklist-workbench">
    <section className="checklist-selector" aria-label="Checklist template selector">
      {templates.map(template=><button type="button" key={template.code} className={selected===template.code?"is-active":""} onClick={()=>{setSelected(template.code);setMessage("")}}><span>{template.code==="opening"?"OPEN":"CLOSE"}</span><strong>{template.name}</strong><small>{template.items.filter(item=>item.active).length} ACTIVE · {template.scheduleTime}</small></button>)}
    </section>
    <section className="checklist-editor">
      <header className="checklist-editor__head"><div><small>GROUP-WIDE TEMPLATE</small><h2>{current.name}</h2><p>Staff will eventually receive these items as Yes / No confirmations through the daily dispatch workflow.</p></div><label className="checklist-switch"><input type="checkbox" checked={current.active} onChange={event=>updateCurrent({active:event.target.checked})}/><span>{current.active?"ACTIVE":"PAUSED"}</span></label></header>
      <div className="checklist-meta-grid">
        <label><span>CHECKLIST NAME</span><input value={current.name} onChange={event=>updateCurrent({name:event.target.value})} maxLength={80}/></label>
        <label><span>DAILY DISPATCH TIME</span><input type="time" value={current.scheduleTime} onChange={event=>updateCurrent({scheduleTime:event.target.value})}/></label>
        <label className="checklist-description"><span>DESCRIPTION</span><textarea rows={2} value={current.description} onChange={event=>updateCurrent({description:event.target.value})} maxLength={500}/></label>
      </div>
      <div className="checklist-summary"><span><b>{activeCount}</b> ACTIVE ITEMS</span><span><b>{requiredCount}</b> REQUIRED</span><span><b>{current.items.length-requiredCount}</b> OPTIONAL / PAUSED</span><span>TIMEZONE · IST</span></div>
      <div className="checklist-items-head"><span>ORDER</span><span>CHECK</span><span>RULE</span><span>STATE</span><span>ACTIONS</span></div>
      <div className="checklist-items">
        {current.items.map((item,index)=><article className={`checklist-item ${item.active?"":"is-paused"}`} key={`${item.id||"new"}-${index}`}>
          <div className="checklist-order"><b>{String(index+1).padStart(2,"0")}</b><div><button type="button" aria-label={`Move item ${index+1} up`} disabled={index===0} onClick={()=>moveItem(index,-1)}>↑</button><button type="button" aria-label={`Move item ${index+1} down`} disabled={index===current.items.length-1} onClick={()=>moveItem(index,1)}>↓</button></div></div>
          <div className="checklist-copy"><input aria-label={`Checklist item ${index+1}`} value={item.label} onChange={event=>updateItem(index,{label:event.target.value})} maxLength={180}/><input className="checklist-detail" aria-label={`Checklist item ${index+1} guidance`} value={item.detail} placeholder="Optional staff guidance / evidence required" onChange={event=>updateItem(index,{detail:event.target.value})} maxLength={500}/></div>
          <label className="checklist-mini-toggle"><input type="checkbox" checked={item.required} onChange={event=>updateItem(index,{required:event.target.checked})}/><span>{item.required?"REQUIRED":"OPTIONAL"}</span></label>
          <label className="checklist-mini-toggle"><input type="checkbox" checked={item.active} onChange={event=>updateItem(index,{active:event.target.checked})}/><span>{item.active?"ACTIVE":"PAUSED"}</span></label>
          <button type="button" className="checklist-remove" disabled={current.items.length<=1} onClick={()=>removeItem(index)}>DELETE</button>
        </article>)}
      </div>
      <footer className="checklist-actions"><button type="button" className="command-button secondary" onClick={addItem} disabled={current.items.length>=30}>+ ADD CHECK</button><div><span>{message}</span><button type="button" className="command-button" onClick={()=>void save()} disabled={saving}>{saving?"SAVING…":"SAVE CHECKLIST →"}</button></div></footer>
    </section>
  </div>;
}
