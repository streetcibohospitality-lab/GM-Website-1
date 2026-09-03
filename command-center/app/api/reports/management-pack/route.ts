import { requireApiProfile } from "@/lib/access-control";
import { getAlerts,getFinancialData,getInventoryRisks,getMenuData,getOutlets,getProcurementData,getReportingContext,getTasks } from "@/lib/command-data";

function csvCell(value:unknown){const s=String(value??"");return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function row(values:unknown[]){return values.map(csvCell).join(",");}

export async function GET(){
  const access=await requireApiProfile("/api/reports/management-pack");if("response" in access)return access.response;
  const ctx=await getReportingContext();
  const [outlets,financial,inventory,procurement,menu,tasks,alerts]=await Promise.all([getOutlets(ctx),getFinancialData(),getInventoryRisks(),getProcurementData(),getMenuData(ctx),getTasks(),getAlerts()]);
  const lines=[row(["SECTION","METRIC / RECORD","SCOPE","VALUE","DETAIL"]),row(["META","Reporting period","GROUP",ctx.label,ctx.dataMode])];
  const revenue=outlets.reduce((s,o)=>s+o.revenue,0),profit=outlets.reduce((s,o)=>s+o.profit,0),orders=outlets.reduce((s,o)=>s+o.orders,0),staff=outlets.reduce((s,o)=>s+o.staff,0);
  lines.push(row(["GROUP","Revenue","GROUP",revenue,"INR"]),row(["GROUP","Net profit","GROUP",profit,"INR"]),row(["GROUP","Net margin","GROUP",revenue?`${(profit/revenue*100).toFixed(2)}%`:"0%",""]),row(["GROUP","Orders","GROUP",orders,""]),row(["GROUP","Staff","GROUP",staff,""]),row(["GROUP","Gross profit","GROUP",financial.grossProfit,"INR"]),row(["GROUP","Operating profit","GROUP",financial.operatingProfit,"INR"]));
  for(const o of outlets)lines.push(row(["OUTLET","Performance",o.id,o.revenue,`${o.name} · profit ${o.profit} · margin ${o.margin}% · orders ${o.orders} · staff ${o.staff} · target ${o.target}%`]));
  for(const c of financial.channelMix)lines.push(row(["CHANNEL",c.name,"GROUP",c.revenue,`share ${c.share}% · orders ${c.orders} · commission ${c.commission}`]));
  for(const i of inventory)lines.push(row(["INVENTORY",i.item,i.sku,i.stockValue,`${i.outlets} low-stock outlets · wastage ${i.variance}% · ${i.action}`]));
  for(const v of procurement.vendors)lines.push(row(["VENDOR",v.name,v.id,v.spend,`${v.category} · reliability ${v.reliability}% · fill ${v.fillRate}% · ${v.status}`]));
  for(const m of menu.items.slice(0,30))lines.push(row(["MENU",m.name,m.code,m.revenue,`${m.category} · units ${m.units} · food cost ${m.foodCost}% · contribution ${m.contribution}%`]));
  for(const t of tasks)lines.push(row(["TASK",t.title,t.outlet,t.status,`${t.owner} · ${t.priority} · due ${t.due}`]));
  for(const a of alerts)lines.push(row(["ALERT",a.title,a.outlet,a.severity,`${a.detail} · ${a.age}`]));
  const filename=`GM_Command_Center_${ctx.year}-${String(ctx.month).padStart(2,"0")}_Management_Pack.csv`;
  return new Response(lines.join("\n")+"\n",{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${filename}"`,"Cache-Control":"private, no-store"}});
}
