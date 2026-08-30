import "server-only";
import { db } from "@/lib/db";
import { getReportingContext } from "@/lib/command-data";

async function upsert(input:{key:string;outletId?:string|null;type:string;severity:"info"|"watch"|"high"|"critical";title:string;detail:string;metadata?:Record<string,unknown>}){
  await db()`INSERT INTO alerts(outlet_id,alert_type,severity,title,detail,status,metadata,dedupe_key,detected_at)
  VALUES(${input.outletId||null},${input.type},${input.severity},${input.title},${input.detail},'open',${JSON.stringify({generated:true,...(input.metadata||{})})}::jsonb,${input.key},NOW())
  ON CONFLICT(dedupe_key) DO UPDATE SET outlet_id=EXCLUDED.outlet_id,alert_type=EXCLUDED.alert_type,severity=EXCLUDED.severity,title=EXCLUDED.title,detail=EXCLUDED.detail,metadata=EXCLUDED.metadata,status=CASE WHEN alerts.status='dismissed' THEN alerts.status ELSE 'open' END,detected_at=CASE WHEN alerts.status IN ('resolved','dismissed') THEN alerts.detected_at ELSE EXCLUDED.detected_at END`;
}

export async function refreshControlAlerts(){
  const ctx=await getReportingContext();
  if(ctx.dataMode!=="live")return{createdOrUpdated:0,resolved:0};
  let count=0;
  const activeKeys=new Set<string>();
  const emit=async(input:Parameters<typeof upsert>[0])=>{activeKeys.add(input.key);await upsert(input);count++;};

  const financial=await db()`SELECT f.outlet_id::text,o.code,o.name,f.net_revenue::float8 revenue,f.net_profit::float8 profit,CASE WHEN f.net_revenue>0 THEN 100.0*f.food_cost/f.net_revenue ELSE 0 END::float8 food_pct,CASE WHEN f.net_revenue>0 THEN 100.0*f.payroll_cost/f.net_revenue ELSE 0 END::float8 labour_pct,COALESCE(t.food_cost_pct_target,o.food_cost_target_pct,32)::float8 food_target,COALESCE(t.labour_cost_pct_target,o.labour_cost_target_pct,18)::float8 labour_target,COALESCE(t.revenue_target,o.monthly_revenue_target,0)::float8 revenue_target FROM outlet_monthly_financials f JOIN outlets o ON o.id=f.outlet_id JOIN reporting_periods p ON p.id=f.period_id LEFT JOIN outlet_targets t ON t.outlet_id=o.id AND t.period_id=p.id WHERE p.year=${ctx.year} AND p.month=${ctx.month}`;
  for(const r of financial as any[]){
    const food=Number(r.food_pct),foodTarget=Number(r.food_target),lab=Number(r.labour_pct),labTarget=Number(r.labour_target),revenue=Number(r.revenue),target=Number(r.revenue_target);
    if(food>foodTarget+3)await emit({key:`food-cost:${ctx.year}-${ctx.month}:${r.outlet_id}`,outletId:r.outlet_id,type:"food_cost",severity:food>foodTarget+7?"critical":"high",title:`${r.name} food cost above control`,detail:`${food.toFixed(1)}% actual · ${foodTarget.toFixed(1)}% target`,metadata:{year:ctx.year,month:ctx.month}});
    if(lab>labTarget+3||lab>20)await emit({key:`labour:${ctx.year}-${ctx.month}:${r.outlet_id}`,outletId:r.outlet_id,type:"labour_cost",severity:lab>24?"high":"watch",title:`${r.name} labour cost above control`,detail:`${lab.toFixed(1)}% actual · ${labTarget.toFixed(1)}% target`,metadata:{year:ctx.year,month:ctx.month}});
    if(target>0&&ctx.daysElapsed>0){const projected=revenue/ctx.daysElapsed*ctx.daysInMonth;if(projected<target*.9)await emit({key:`revenue-trajectory:${ctx.year}-${ctx.month}:${r.outlet_id}`,outletId:r.outlet_id,type:"revenue_trajectory",severity:projected<target*.75?"high":"watch",title:`${r.name} revenue trajectory below target`,detail:`Projected ₹${Math.round(projected).toLocaleString('en-IN')} · target ₹${Math.round(target).toLocaleString('en-IN')}`,metadata:{year:ctx.year,month:ctx.month,projected,target}});}
  }

  const cash=await db()`SELECT cr.id::text,cr.outlet_id::text,o.name,cr.business_date,cr.variance::float8 FROM cash_reconciliations cr JOIN outlets o ON o.id=cr.outlet_id WHERE EXTRACT(YEAR FROM cr.business_date)=${ctx.year} AND EXTRACT(MONTH FROM cr.business_date)=${ctx.month} AND abs(cr.variance)>2000`;
  for(const r of cash as any[])await emit({key:`cash:${r.id}`,outletId:r.outlet_id,type:"cash_variance",severity:Math.abs(Number(r.variance))>5000?"high":"watch",title:`${r.name} cash variance`,detail:`₹${Math.round(Math.abs(Number(r.variance))).toLocaleString('en-IN')} variance on ${String(r.business_date).slice(0,10)}`});

  const notices=await db()`SELECT s.id::text,s.full_name,s.planned_last_working_date,o.id::text outlet_id,o.name,(s.planned_last_working_date-CURRENT_DATE)::int days FROM staff_members s LEFT JOIN outlets o ON o.id=s.home_outlet_id WHERE s.status='notice' AND s.planned_last_working_date BETWEEN CURRENT_DATE AND CURRENT_DATE+30`;
  for(const r of notices as any[])await emit({key:`staff-exit:${r.id}:${String(r.planned_last_working_date).slice(0,10)}`,outletId:r.outlet_id,type:"staff_exit",severity:Number(r.days)<=7?"high":"watch",title:`${r.full_name} leaving in ${r.days} days`,detail:`Planned last working day ${String(r.planned_last_working_date).slice(0,10)} · ${r.name||'Group'}`});

  const docs=await db()`SELECT d.id::text,d.title,d.outlet_id::text,o.name,d.expires_on,(d.expires_on-CURRENT_DATE)::int days FROM documents d LEFT JOIN outlets o ON o.id=d.outlet_id WHERE d.expires_on IS NOT NULL AND d.expires_on<=CURRENT_DATE+30`;
  for(const r of docs as any[]){const days=Number(r.days);await emit({key:`document-expiry:${r.id}:${String(r.expires_on).slice(0,10)}`,outletId:r.outlet_id,type:"document_expiry",severity:days<0||days<=7?"high":"watch",title:days<0?`Expired document: ${r.title}`:`Document expiry: ${r.title}`,detail:days<0?`Expired ${Math.abs(days)} days ago${r.name?` · ${r.name}`:''}`:`Expires in ${days} days${r.name?` · ${r.name}`:''}`});}

  const customer=await db()`SELECT c.id::text,c.outlet_id::text,o.name,c.google_rating::float8 google,c.swiggy_rating::float8 swiggy,c.zomato_rating::float8 zomato,c.complaints_received,c.complaints_unresolved FROM customer_experience_monthly c JOIN outlets o ON o.id=c.outlet_id JOIN reporting_periods p ON p.id=c.period_id WHERE p.year=${ctx.year} AND p.month=${ctx.month}`;
  for(const r of customer as any[]){const ratings=[r.google,r.swiggy,r.zomato].map(Number).filter(Number.isFinite).filter(x=>x>0),avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0,unresolved=Number(r.complaints_unresolved||0);if((avg>0&&avg<4.0)||unresolved>=3)await emit({key:`customer-experience:${ctx.year}-${ctx.month}:${r.outlet_id}`,outletId:r.outlet_id,type:"customer_experience",severity:(avg>0&&avg<3.6)||unresolved>=6?"high":"watch",title:`${r.name} customer experience needs attention`,detail:`${avg?`${avg.toFixed(2)}/5 average rating · `:""}${unresolved} unresolved complaint${unresolved===1?"":"s"}`,metadata:{year:ctx.year,month:ctx.month,averageRating:avg,unresolved}});}

  const maintenance=await db()`SELECT m.id::text,m.outlet_id::text,o.name,m.priority,m.issue,a.name asset_name FROM maintenance_incidents m JOIN outlets o ON o.id=m.outlet_id LEFT JOIN equipment_assets a ON a.id=m.asset_id WHERE m.status IN ('open','in_progress') AND m.priority IN ('high','critical')`;
  for(const r of maintenance as any[])await emit({key:`maintenance:${r.id}`,outletId:r.outlet_id,type:"maintenance",severity:r.priority==="critical"?"critical":"high",title:`${r.name}: ${r.asset_name||'maintenance incident'}`,detail:String(r.issue)});

  const audits=await db()`SELECT a.id::text,a.outlet_id::text,o.name,a.overall_score::float8 score FROM outlet_audits_monthly a JOIN outlets o ON o.id=a.outlet_id JOIN reporting_periods p ON p.id=a.period_id WHERE p.year=${ctx.year} AND p.month=${ctx.month} AND a.overall_score<70`;
  for(const r of audits as any[])await emit({key:`outlet-audit:${ctx.year}-${ctx.month}:${r.outlet_id}`,outletId:r.outlet_id,type:"outlet_audit",severity:Number(r.score)<55?"high":"watch",title:`${r.name} outlet audit below operating floor`,detail:`${Number(r.score).toFixed(0)}/100 overall audit score · minimum 70`,metadata:{year:ctx.year,month:ctx.month,score:Number(r.score)}});

  let resolved=0;
  const generated=await db()`SELECT id::text,dedupe_key FROM alerts WHERE status IN ('open','acknowledged') AND metadata->>'generated'='true' AND dedupe_key IS NOT NULL`;
  for(const row of generated as any[])if(!activeKeys.has(String(row.dedupe_key))){await db()`UPDATE alerts SET status='resolved',resolved_at=NOW() WHERE id=${row.id} AND status IN ('open','acknowledged')`;resolved++;}

  return{createdOrUpdated:count,resolved};
}
