import "server-only";
import { db } from "@/lib/db";

export async function ensurePeriod(year:number,month:number){
 const rows=await db()`INSERT INTO reporting_periods(year,month,status) VALUES(${year},${month},'open') ON CONFLICT(year,month) DO UPDATE SET year=EXCLUDED.year RETURNING id,status`;
 return rows[0] as {id:string;status:string};
}
export async function outletOptions(){return await db()`SELECT id,code,name FROM outlets WHERE status IN ('active','temporarily_closed') ORDER BY name`;}
export async function customerExperienceRows(){return await db()`SELECT c.id,c.outlet_id,o.code outlet_code,o.name outlet_name,p.year,p.month,c.google_rating,c.swiggy_rating,c.zomato_rating,c.complaints_received,c.complaints_unresolved,c.owner_notes FROM customer_experience_monthly c JOIN outlets o ON o.id=c.outlet_id JOIN reporting_periods p ON p.id=c.period_id ORDER BY p.year DESC,p.month DESC,o.name`;}
export async function maintenanceRows(){return await db()`SELECT m.id,m.outlet_id,o.code outlet_code,o.name outlet_name,m.asset_id,a.asset_code,a.name asset_name,m.priority,m.issue,m.vendor_name,m.estimated_cost,m.actual_cost,m.status,m.reported_at,m.resolved_at,m.resolution_notes FROM maintenance_incidents m JOIN outlets o ON o.id=m.outlet_id LEFT JOIN equipment_assets a ON a.id=m.asset_id ORDER BY CASE m.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, CASE m.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,m.reported_at DESC`;}
export async function equipmentRows(){return await db()`SELECT a.id,a.outlet_id,o.code outlet_code,o.name outlet_name,a.asset_code,a.name,a.category,a.status,a.installed_on,a.last_service_on,a.next_service_due,a.vendor_name,a.notes FROM equipment_assets a JOIN outlets o ON o.id=a.outlet_id ORDER BY o.name,a.category,a.name`;}
export async function outletAuditRows(){return await db()`SELECT a.id,a.outlet_id,o.code outlet_code,o.name outlet_name,p.year,p.month,a.audit_date,a.hygiene,a.food_quality,a.service,a.stock_discipline,a.staff_presentation,a.equipment_condition,a.compliance,a.overall_score,a.notes FROM outlet_audits_monthly a JOIN outlets o ON o.id=a.outlet_id JOIN reporting_periods p ON p.id=a.period_id ORDER BY p.year DESC,p.month DESC,a.overall_score DESC`;}
export async function groupForecast(year:number,month:number,asOfDay:number){
 const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
 const r=await db()`WITH sales AS (SELECT COALESCE(sum(ds.net_sales),0)::float8 AS mtd FROM daily_sales ds JOIN outlets o ON o.id=ds.outlet_id WHERE o.status='active' AND EXTRACT(YEAR FROM ds.business_date)=${year} AND EXTRACT(MONTH FROM ds.business_date)=${month} AND EXTRACT(DAY FROM ds.business_date)<=${asOfDay}), targets AS (SELECT COALESCE(sum(COALESCE(t.revenue_target,o.monthly_revenue_target,0)),0)::float8 AS target FROM outlets o LEFT JOIN reporting_periods p ON p.year=${year} AND p.month=${month} LEFT JOIN outlet_targets t ON t.outlet_id=o.id AND t.period_id=p.id WHERE o.status='active') SELECT sales.mtd,targets.target FROM sales,targets`;
 return{mtd:Number(r[0]?.mtd||0),target:Number(r[0]?.target||0),daysInMonth};
}
export async function expenseCategoryOptions(){return await db()`SELECT code,name FROM expense_categories WHERE active ORDER BY name`;}
