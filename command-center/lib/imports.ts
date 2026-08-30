import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

export type ImportType="outlets"|"daily_sales"|"channel_sales"|"expenses"|"staff"|"monthly_financials"|"inventory"|"vendors"|"purchases"|"menu_performance"|"cash_reconciliation";
export type ImportIssue={row:number;field:string;message:string};

export function parseCsv(text:string){
 const rows:string[][]=[];let row:string[]=[];let field="";let quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"'){quoted=false;}else field+=ch;continue;}
  if(ch==='"'){quoted=true;continue;}if(ch===","){row.push(field);field="";continue;}if(ch==="\n"){row.push(field.replace(/\r$/, ""));rows.push(row);row=[];field="";continue;}field+=ch;
 }
 if(field.length||row.length){row.push(field.replace(/\r$/, ""));rows.push(row);}
 return rows.filter(r=>r.some(v=>v.trim()!==""));
}

function records(text:string){
 const matrix=parseCsv(text);if(matrix.length<1)throw new Error("CSV is empty");
 const headers=matrix[0].map(h=>h.trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw new Error("CSV contains duplicate column names");
 return matrix.slice(1).map((cells,index)=>({row:index+2,value:Object.fromEntries(headers.map((h,i)=>[h,(cells[i]||"").trim()]))}));
}
const money=z.coerce.number().finite().min(0).max(1_000_000_000);
const signedMoney=z.coerce.number().finite().min(-1_000_000_000).max(1_000_000_000);
const integer=z.coerce.number().int().min(0).max(100_000_000);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const period=z.string().regex(/^\d{4}-\d{2}$/);
const code=z.string().trim().min(1).max(40).transform(v=>v.toUpperCase());
const outletSchema=z.object({outlet_code:code,name:z.string().trim().min(2).max(120),legal_name:z.string().trim().max(180).optional().default(""),city:z.string().trim().min(2).max(100).default("Bengaluru"),address:z.string().trim().max(500).optional().default(""),opening_date:z.union([date,z.literal("")]).default(""),status:z.enum(["planned","active","temporarily_closed","closed"]).default("active"),monthly_revenue_target:z.union([money,z.literal("")]).default(""),monthly_profit_target:z.union([signedMoney,z.literal("")]).default(""),food_cost_target_pct:z.union([z.coerce.number().min(0).max(100),z.literal("")]).default(""),labour_cost_target_pct:z.union([z.coerce.number().min(0).max(100),z.literal("")]).default("")});
const dailySchema=z.object({outlet_code:code,business_date:date,gross_sales:money,net_sales:money,orders:integer,discounts:money.default(0),refunds:money.default(0),tax:money.default(0)});
const channelSchema=z.object({outlet_code:code,business_date:date,channel:code,gross_sales:money,net_sales:money,orders:integer,commission:money.default(0),discounts:money.default(0)});
const expenseSchema=z.object({outlet_code:code,period:period,expense_date:date,category:code,vendor_name:z.string().max(160).optional().default(""),reference_no:z.string().max(120).optional().default(""),amount:money,description:z.string().max(500).optional().default("")});
const staffSchema=z.object({employee_code:z.string().trim().min(1).max(40),full_name:z.string().trim().min(2).max(160),role_title:z.string().trim().min(2).max(120),outlet_code:code,joining_date:z.union([date,z.literal("")]).default(""),status:z.enum(["active","leave","notice","inactive"]).default("active"),monthly_salary:z.union([signedMoney,z.literal("")]).default(""),monthly_cost:z.union([signedMoney,z.literal("")]).default("")});
const financialSchema=z.object({outlet_code:code,period:period,gross_revenue:money,net_revenue:money,total_orders:integer,discounts:money.default(0),refunds:money.default(0),food_cost:money.default(0),packaging_cost:money.default(0),payroll_cost:money.default(0),rent_cost:money.default(0),utilities_cost:money.default(0),aggregator_commission:money.default(0),marketing_cost:money.default(0),maintenance_cost:money.default(0),other_operating_cost:money.default(0),gross_profit:signedMoney,operating_profit:signedMoney,net_profit:signedMoney,notes:z.string().max(1000).optional().default("")});
const inventorySchema=z.object({outlet_code:code,snapshot_date:date,item_sku:code,item_name:z.string().trim().min(2).max(160),unit:z.string().trim().min(1).max(40),category:z.string().trim().max(100).optional().default(""),on_hand_qty:z.coerce.number().finite().min(0).max(100000000),unit_cost:money,reorder_point:z.union([z.coerce.number().finite().min(0),z.literal("")]).default(""),wastage_qty:z.coerce.number().finite().min(0).max(100000000).default(0)});
const vendorSchema=z.object({vendor_code:code,name:z.string().trim().min(2).max(180),category:z.string().trim().max(100).optional().default(""),contact_name:z.string().trim().max(160).optional().default(""),phone:z.string().trim().max(40).optional().default(""),email:z.union([z.string().email().max(200),z.literal("")]).default(""),payment_terms:z.string().trim().max(160).optional().default(""),reliability_pct:z.union([z.coerce.number().min(0).max(100),z.literal("")]).default(""),fill_rate_pct:z.union([z.coerce.number().min(0).max(100),z.literal("")]).default(""),active:z.enum(["true","false","1","0"]).default("true")});
const purchaseSchema=z.object({outlet_code:code,purchase_date:date,vendor_code:code,invoice_no:z.string().trim().max(120).optional().default(""),subtotal:money,tax:money.default(0),total:money,payment_status:z.enum(["pending","partial","paid","disputed"]).default("pending")});
const menuPerformanceSchema=z.object({outlet_code:code,period:period,item_sku:code,item_name:z.string().trim().min(2).max(160),category:z.string().trim().max(100).optional().default(""),quantity_sold:integer,net_sales:money,estimated_food_cost:z.union([money,z.literal("")]).default(""),contribution_margin:z.union([signedMoney,z.literal("")]).default(""),refunds:integer.default(0)});
const cashSchema=z.object({outlet_code:code,business_date:date,expected_cash:money,counted_cash:money,banked_cash:money,variance:signedMoney,notes:z.string().trim().max(1000).optional().default("")}).refine(v=>Math.abs(Number(v.variance)-(Number(v.counted_cash)-Number(v.expected_cash)))<0.01,{message:"Variance must equal counted_cash - expected_cash",path:["variance"]});

export async function validateImport(type:ImportType,text:string){
 const source=records(text);if(source.length>10_000)throw new Error("A single import is limited to 10,000 rows");
 const schema=type==="outlets"?outletSchema:type==="daily_sales"?dailySchema:type==="channel_sales"?channelSchema:type==="expenses"?expenseSchema:type==="staff"?staffSchema:type==="monthly_financials"?financialSchema:type==="inventory"?inventorySchema:type==="vendors"?vendorSchema:type==="purchases"?purchaseSchema:type==="menu_performance"?menuPerformanceSchema:cashSchema;
 const issues:ImportIssue[]=[];const valid:{row:number;value:Record<string,unknown>}[]=[];
 for(const item of source){const parsed=schema.safeParse(item.value);if(!parsed.success){for(const issue of parsed.error.issues.slice(0,5))issues.push({row:item.row,field:String(issue.path[0]||"row"),message:issue.message});}else valid.push({row:item.row,value:parsed.data as unknown as Record<string,unknown>});if(issues.length>=200)break;}
 if(issues.length)return{ok:false,totalRows:source.length,acceptedRows:0,issues,rows:[] as Record<string,unknown>[]};
 if(type!=="vendors"&&type!=="outlets"){const outletCodes=[...new Set(valid.map(v=>String(v.value.outlet_code)))];const outlets=await db()`SELECT code FROM outlets WHERE code=ANY(${outletCodes}::text[])`;const knownOutlets=new Set(outlets.map(r=>String(r.code)));
 for(const item of valid)if(!knownOutlets.has(String(item.value.outlet_code)))issues.push({row:item.row,field:"outlet_code",message:`Unknown outlet code: ${item.value.outlet_code}`});}
 if(type==="channel_sales"){const channelCodes=[...new Set(valid.map(v=>String(v.value.channel)))];const channels=await db()`SELECT code FROM sales_channels WHERE code=ANY(${channelCodes}::text[])`;const known=new Set(channels.map(r=>String(r.code)));for(const item of valid)if(!known.has(String(item.value.channel)))issues.push({row:item.row,field:"channel",message:`Unknown channel: ${item.value.channel}`});}
 if(type==="purchases"){const vendorCodes=[...new Set(valid.map(v=>String(v.value.vendor_code)))];const rows=await db()`SELECT code FROM vendors WHERE code=ANY(${vendorCodes}::text[])`;const known=new Set(rows.map(r=>String(r.code)));for(const item of valid)if(!known.has(String(item.value.vendor_code)))issues.push({row:item.row,field:"vendor_code",message:`Unknown vendor code: ${item.value.vendor_code}. Import vendors first.`});}
 if(type==="expenses"){const cats=[...new Set(valid.map(v=>String(v.value.category)))];const rows=await db()`SELECT code FROM expense_categories WHERE code=ANY(${cats}::text[])`;const known=new Set(rows.map(r=>String(r.code)));for(const item of valid)if(!known.has(String(item.value.category)))issues.push({row:item.row,field:"category",message:`Unknown expense category: ${item.value.category}`});for(const item of valid){const p=String(item.value.period),d=String(item.value.expense_date);if(!d.startsWith(`${p}-`))issues.push({row:item.row,field:"expense_date",message:`Expense date ${d} does not match reporting period ${p}`});}}
 const periodTypes=new Set<ImportType>(["daily_sales","channel_sales","cash_reconciliation","expenses","monthly_financials","menu_performance"]);
 if(periodTypes.has(type)){
  const rowPeriod=(item:{value:Record<string,unknown>})=>type==="expenses"||type==="monthly_financials"||type==="menu_performance"?String(item.value.period):String(item.value.business_date).slice(0,7);
  const periods=[...new Set(valid.map(rowPeriod))];
  if(periods.length){const closed=await db()`SELECT year,month FROM reporting_periods WHERE status='closed' AND (year::text||'-'||lpad(month::text,2,'0'))=ANY(${periods}::text[])`;const closedSet=new Set(closed.map(r=>`${r.year}-${String(r.month).padStart(2,"0")}`));for(const item of valid){const p=rowPeriod(item);if(closedSet.has(p))issues.push({row:item.row,field:type==="expenses"||type==="monthly_financials"||type==="menu_performance"?"period":"business_date",message:`Reporting period ${p} is closed`});}}
 }
 return{ok:issues.length===0,totalRows:source.length,acceptedRows:issues.length?0:valid.length,issues:issues.slice(0,200),rows:issues.length?[]:valid.map(v=>v.value)};
}
