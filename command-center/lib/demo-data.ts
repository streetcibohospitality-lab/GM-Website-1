export type OutletState = "ahead" | "steady" | "watch" | "critical";
export type Severity = "info" | "watch" | "high" | "critical";

export type Outlet = {
  id: string;
  name: string;
  city: string;
  manager: string;
  revenue: number;
  profit: number;
  margin: number;
  orders: number;
  staff: number;
  aov: number;
  foodCost: number;
  labourCost: number;
  delta: number;
  target: number;
  state: OutletState;
  cashVariance: number;
  rating: number;
  inventoryHealth: number;
  compliance: number;
  launched: string;
};

export const reportingPeriod = { label: "AUG 2026", month: 8, year: 2026, daysElapsed: 25, daysInMonth: 31 } as const;

export const outlets: Outlet[] = [
  { id:"KRM", name:"Koramangala", city:"Bengaluru", manager:"Outlet Manager 01", revenue:2845230, profit:468230, margin:32.8, orders:6543, staff:18, aov:435, foodCost:31.1, labourCost:13.8, delta:9.4, target:91, state:"ahead", cashVariance:320, rating:4.6, inventoryHealth:92, compliance:100, launched:"2023-10-14" },
  { id:"JNR", name:"Jayanagar", city:"Bengaluru", manager:"Outlet Manager 02", revenue:1875620, profit:314980, margin:36.2, orders:4008, staff:12, aov:468, foodCost:29.8, labourCost:12.9, delta:11.3, target:94, state:"ahead", cashVariance:-180, rating:4.7, inventoryHealth:95, compliance:100, launched:"2024-02-08" },
  { id:"IDR", name:"Indiranagar", city:"Bengaluru", manager:"Outlet Manager 03", revenue:2318760, profit:320450, margin:29.7, orders:5124, staff:14, aov:452, foodCost:33.6, labourCost:14.7, delta:-2.1, target:82, state:"watch", cashVariance:1580, rating:4.4, inventoryHealth:84, compliance:96, launched:"2024-05-19" },
  { id:"WFD", name:"Whitefield", city:"Bengaluru", manager:"Outlet Manager 04", revenue:2036540, profit:215780, margin:25.4, orders:4231, staff:16, aov:481, foodCost:39.1, labourCost:16.5, delta:-5.6, target:76, state:"critical", cashVariance:2380, rating:4.2, inventoryHealth:71, compliance:92, launched:"2024-08-02" },
  { id:"HSR", name:"HSR Layout", city:"Bengaluru", manager:"Outlet Manager 05", revenue:1675430, profit:241230, margin:30.1, orders:3215, staff:11, aov:521, foodCost:32.1, labourCost:13.4, delta:6.7, target:88, state:"steady", cashVariance:0, rating:4.6, inventoryHealth:89, compliance:100, launched:"2025-01-12" },
  { id:"MRH", name:"Marathahalli", city:"Bengaluru", manager:"Outlet Manager 06", revenue:982740, profit:122450, margin:24.6, orders:2145, staff:10, aov:458, foodCost:35.4, labourCost:16.8, delta:-3.2, target:73, state:"watch", cashVariance:-910, rating:4.3, inventoryHealth:80, compliance:97, launched:"2025-03-06" },
  { id:"MLM", name:"Malleshwaram", city:"Bengaluru", manager:"Outlet Manager 07", revenue:476320, profit:56280, margin:11.8, orders:987, staff:8, aov:483, foodCost:41.7, labourCost:22.4, delta:-12.6, target:51, state:"critical", cashVariance:2760, rating:4.0, inventoryHealth:68, compliance:91, launched:"2025-09-18" },
  { id:"BTM", name:"BTM Layout", city:"Bengaluru", manager:"Outlet Manager 08", revenue:246680, profit:-23970, margin:-9.7, orders:590, staff:3, aov:418, foodCost:44.8, labourCost:27.1, delta:-18.4, target:37, state:"critical", cashVariance:3310, rating:3.9, inventoryHealth:63, compliance:88, launched:"2026-04-20" }
];

export const staff = [
  { id:"GM-001", name:"Sample Employee 01", role:"Outlet Manager", outlet:"KRM", status:"Active", joined:"2024-02-10", attendance:97, monthlyCost:42000, shift:"General" },
  { id:"GM-002", name:"Sample Employee 02", role:"Kitchen Lead", outlet:"KRM", status:"Active", joined:"2024-06-18", attendance:94, monthlyCost:36000, shift:"Closing" },
  { id:"GM-003", name:"Sample Employee 03", role:"Service Lead", outlet:"KRM", status:"Active", joined:"2024-09-11", attendance:96, monthlyCost:31000, shift:"Opening" },
  { id:"GM-004", name:"Sample Employee 04", role:"Outlet Manager", outlet:"JNR", status:"Active", joined:"2025-01-12", attendance:99, monthlyCost:43000, shift:"General" },
  { id:"GM-005", name:"Sample Employee 05", role:"Kitchen Lead", outlet:"JNR", status:"Active", joined:"2025-03-19", attendance:95, monthlyCost:35000, shift:"Closing" },
  { id:"GM-006", name:"Sample Employee 06", role:"Outlet Manager", outlet:"IDR", status:"Active", joined:"2025-03-08", attendance:92, monthlyCost:44000, shift:"General" },
  { id:"GM-007", name:"Sample Employee 07", role:"Shift Lead", outlet:"IDR", status:"Active", joined:"2025-05-02", attendance:91, monthlyCost:30000, shift:"Opening" },
  { id:"GM-008", name:"Sample Employee 08", role:"Outlet Manager", outlet:"WFD", status:"Active", joined:"2024-11-04", attendance:96, monthlyCost:45000, shift:"General" },
  { id:"GM-009", name:"Sample Employee 09", role:"Crew", outlet:"WFD", status:"Leave", joined:"2025-08-14", attendance:88, monthlyCost:22000, shift:"Closing" },
  { id:"GM-010", name:"Sample Employee 10", role:"Outlet Manager", outlet:"HSR", status:"Active", joined:"2025-02-02", attendance:98, monthlyCost:43000, shift:"General" },
  { id:"GM-011", name:"Sample Employee 11", role:"Kitchen Lead", outlet:"HSR", status:"Active", joined:"2025-04-17", attendance:95, monthlyCost:35000, shift:"Closing" },
  { id:"GM-012", name:"Sample Employee 12", role:"Outlet Manager", outlet:"MRH", status:"Active", joined:"2025-06-14", attendance:93, monthlyCost:40000, shift:"General" },
  { id:"GM-013", name:"Sample Employee 13", role:"Outlet Manager", outlet:"MLM", status:"Active", joined:"2025-07-01", attendance:84, monthlyCost:39000, shift:"General" },
  { id:"GM-014", name:"Sample Employee 14", role:"Crew", outlet:"MLM", status:"Notice", joined:"2025-10-23", attendance:82, monthlyCost:21000, shift:"Opening" },
  { id:"GM-015", name:"Sample Employee 15", role:"Outlet Manager", outlet:"BTM", status:"Active", joined:"2026-03-28", attendance:90, monthlyCost:38000, shift:"General" },
  { id:"GM-016", name:"Sample Employee 16", role:"Kitchen Crew", outlet:"KRM", status:"Active", joined:"2025-11-10", attendance:96, monthlyCost:23000, shift:"Opening" },
  { id:"GM-017", name:"Sample Employee 17", role:"Service Crew", outlet:"KRM", status:"Active", joined:"2026-01-05", attendance:97, monthlyCost:22000, shift:"Closing" },
  { id:"GM-018", name:"Sample Employee 18", role:"Kitchen Crew", outlet:"JNR", status:"Active", joined:"2025-12-02", attendance:95, monthlyCost:23000, shift:"Opening" },
  { id:"GM-019", name:"Sample Employee 19", role:"Service Crew", outlet:"IDR", status:"Active", joined:"2026-02-14", attendance:92, monthlyCost:22000, shift:"Closing" },
  { id:"GM-020", name:"Sample Employee 20", role:"Kitchen Crew", outlet:"WFD", status:"Active", joined:"2025-12-21", attendance:91, monthlyCost:23000, shift:"Opening" },
  { id:"GM-021", name:"Sample Employee 21", role:"Service Crew", outlet:"HSR", status:"Active", joined:"2026-02-19", attendance:98, monthlyCost:22000, shift:"Closing" },
  { id:"GM-022", name:"Sample Employee 22", role:"Kitchen Crew", outlet:"MRH", status:"Active", joined:"2026-03-11", attendance:93, monthlyCost:23000, shift:"Opening" },
  { id:"GM-023", name:"Sample Employee 23", role:"Service Crew", outlet:"MLM", status:"Active", joined:"2026-01-29", attendance:89, monthlyCost:22000, shift:"Closing" },
  { id:"GM-024", name:"Sample Employee 24", role:"Kitchen Crew", outlet:"BTM", status:"Active", joined:"2026-04-18", attendance:90, monthlyCost:23000, shift:"Opening" }
] as const;

export const alerts = [
  { id:"AL-441", severity:"critical", outlet:"WFD", title:"Food-cost variance crossed control limit", detail:"39.1% actual · 32.0% target", age:"10m", owner:"Owner" },
  { id:"AL-438", severity:"high", outlet:"MLM", title:"Margin below minimum threshold", detail:"11.8% net margin · control floor 18%", age:"18m", owner:"Owner" },
  { id:"AL-433", severity:"watch", outlet:"IDR", title:"Monthly target is slipping", detail:"82% achieved · 6 days remaining", age:"25m", owner:"Owner" },
  { id:"AL-421", severity:"watch", outlet:"GROUP", title:"Three outlets below stock floor", detail:"Chicken breast · buns · fryer oil", age:"1h", owner:"Owner" },
  { id:"AL-417", severity:"info", outlet:"PEOPLE", title:"Two leave approvals waiting", detail:"Owner review required", age:"2h", owner:"Owner" }
] as const;

export const channelMix = [
  { name:"Dine-in", share:38.7, revenue:4825430, contribution:31.2, orders:9820, commission:0 },
  { name:"Takeaway", share:22.1, revenue:2748320, contribution:28.6, orders:6410, commission:0 },
  { name:"Swiggy", share:20.3, revenue:2524540, contribution:17.4, orders:6231, commission:512420 },
  { name:"Zomato", share:15.6, revenue:1936540, contribution:16.9, orders:5149, commission:402370 },
  { name:"Direct", share:3.3, revenue:423490, contribution:34.1, orders:933, commission:0 }
] as const;

export const expenses = [
  { category:"Food & ingredients", amount:3987140, pct:32.0, delta:2.9, status:"watch" },
  { category:"Payroll", amount:1847350, pct:14.8, delta:0.6, status:"steady" },
  { category:"Aggregator commission", amount:1183480, pct:9.5, delta:1.2, status:"watch" },
  { category:"Rent", amount:846000, pct:6.8, delta:0, status:"steady" },
  { category:"Packaging", amount:622910, pct:5.0, delta:-0.4, status:"ahead" },
  { category:"Utilities", amount:361290, pct:2.9, delta:0.2, status:"steady" },
  { category:"Maintenance", amount:174540, pct:1.4, delta:0.5, status:"watch" },
  { category:"Marketing", amount:124320, pct:1.0, delta:-0.2, status:"ahead" },
  { category:"Software & services", amount:87200, pct:0.7, delta:0.1, status:"steady" }
] as const;

export const inventoryRisks = [
  { item:"Chicken breast", sku:"ING-001", category:"Protein", outlets:3, days:1.4, variance:8.2, stockValue:126800, action:"Replenish" },
  { item:"Burger buns", sku:"ING-014", category:"Bakery", outlets:2, days:1.8, variance:4.1, stockValue:42600, action:"Replenish" },
  { item:"Fryer oil", sku:"ING-031", category:"Oil", outlets:3, days:2.1, variance:12.7, stockValue:78400, action:"Review usage" },
  { item:"Cheddar", sku:"ING-008", category:"Dairy", outlets:1, days:2.7, variance:-1.2, stockValue:58100, action:"Monitor" },
  { item:"Milkshake base", sku:"ING-046", category:"Beverage", outlets:1, days:3.2, variance:6.8, stockValue:33600, action:"Monitor" },
  { item:"Potato fries", sku:"ING-021", category:"Frozen", outlets:0, days:5.6, variance:1.7, stockValue:144500, action:"Healthy" }
] as const;

export const vendors = [
  { id:"VN-01", name:"Sample Foods Pvt Ltd", category:"Protein", spend:842310, change:11.4, reliability:96, fillRate:93, terms:"15 days", status:"watch" },
  { id:"VN-02", name:"Sample Produce Co", category:"Produce", spend:428900, change:2.1, reliability:98, fillRate:97, terms:"7 days", status:"steady" },
  { id:"VN-03", name:"Sample Bakery Supply", category:"Bakery", spend:318440, change:-1.8, reliability:94, fillRate:95, terms:"15 days", status:"ahead" },
  { id:"VN-04", name:"Sample Packaging", category:"Packaging", spend:276380, change:0.6, reliability:99, fillRate:99, terms:"30 days", status:"steady" },
  { id:"VN-05", name:"Sample Dairy Co", category:"Dairy", spend:214760, change:5.2, reliability:92, fillRate:90, terms:"7 days", status:"watch" }
] as const;

export const activity = [
  { time:"15:24", actor:"Owner", action:"August expense batch imported", target:"GROUP", type:"import" },
  { time:"15:18", actor:"WFD", action:"Inventory count submitted", target:"WFD", type:"ops" },
  { time:"15:12", actor:"System", action:"Food cost alert escalated", target:"WFD", type:"alert" },
  { time:"14:58", actor:"Owner", action:"Staff transfer recorded", target:"HSR → KRM", type:"people" },
  { time:"14:44", actor:"Owner", action:"Cash variance acknowledged", target:"IDR", type:"finance" },
  { time:"14:31", actor:"System", action:"Sales import reconciliation completed", target:"GROUP", type:"import" }
] as const;

export const dailyRevenue = [8.2,9.1,9.8,10.4,12.2,13.7,12.9,14.4,15.1,17.8,16.2,15.8,18.9,20.3,18.7,19.2,21.6,20.8,19.7,22.8,24.7,22.9,21.8,23.4,25.2,27.1,26.4,24.9,28.8,27.3,29.2];
export const dailyOrders = [812,860,902,948,1010,1104,1078,1142,1198,1320,1241,1214,1376,1460,1394,1422,1518,1488,1436,1582,1669,1603,1554,1638,1712,1810,1772,1694,1881,1827,1921];

export const monthlyTrend = [
  { month:"MAR", revenue:96.2, profit:12.4, margin:12.9 },
  { month:"APR", revenue:101.8, profit:13.9, margin:13.7 },
  { month:"MAY", revenue:108.1, profit:15.2, margin:14.1 },
  { month:"JUN", revenue:113.7, profit:16.1, margin:14.2 },
  { month:"JUL", revenue:114.7, profit:17.7, margin:15.4 },
  { month:"AUG", revenue:124.6, profit:18.8, margin:15.1 }
] as const;

export const menuItems = [
  { code:"GM-B01", name:"Classic Smash Burger", category:"Burgers", units:4380, revenue:1847600, foodCost:29.8, contribution:44.2, delta:12.1, rank:1, state:"ahead" },
  { code:"GM-W03", name:"Hot Honey Wings", category:"Wings", units:3214, revenue:1124900, foodCost:31.4, contribution:41.7, delta:8.8, rank:2, state:"ahead" },
  { code:"GM-B04", name:"Double Trouble Burger", category:"Burgers", units:2860, revenue:1372800, foodCost:34.1, contribution:39.8, delta:5.4, rank:3, state:"steady" },
  { code:"GM-F02", name:"Loaded Animal Fries", category:"Fries", units:2744, revenue:741000, foodCost:27.9, contribution:48.6, delta:14.7, rank:4, state:"ahead" },
  { code:"GM-S01", name:"Vanilla Diner Shake", category:"Shakes", units:1981, revenue:554680, foodCost:25.8, contribution:51.2, delta:3.9, rank:5, state:"steady" },
  { code:"GM-W06", name:"BBQ Wings", category:"Wings", units:1472, revenue:500480, foodCost:37.7, contribution:32.4, delta:-6.8, rank:6, state:"watch" },
  { code:"GM-B08", name:"Mushroom Melt", category:"Burgers", units:918, revenue:412200, foodCost:40.9, contribution:28.3, delta:-11.2, rank:7, state:"critical" },
  { code:"GM-S05", name:"Peanut Butter Shake", category:"Shakes", units:642, revenue:186180, foodCost:36.8, contribution:34.1, delta:-4.1, rank:8, state:"watch" }
] as const;

export const menuCategories = [
  { name:"Burgers", sales:5324300, units:11820, mix:42.7, margin:40.1, delta:8.6 },
  { name:"Wings", sales:2738100, units:8060, mix:22.0, margin:36.8, delta:4.2 },
  { name:"Fries & sides", sales:1836200, units:8900, mix:14.7, margin:47.5, delta:11.9 },
  { name:"Shakes", sales:1649400, units:6120, mix:13.2, margin:46.2, delta:2.8 },
  { name:"Beverages", sales:919700, units:4420, mix:7.4, margin:58.6, delta:-1.1 }
] as const;

export const tasks = [
  { id:"TK-209", title:"Resolve Whitefield food-cost variance", outlet:"WFD", owner:"Mohammed Afridi", due:"26 Aug", priority:"critical", status:"In progress", linked:"AL-441" },
  { id:"TK-207", title:"Complete Malleshwaram margin action plan", outlet:"MLM", owner:"Mueen Ahmed", due:"27 Aug", priority:"high", status:"Open", linked:"AL-438" },
  { id:"TK-204", title:"Approve August attendance exceptions", outlet:"GROUP", owner:"Mohammed Hisham", due:"25 Aug", priority:"watch", status:"Review", linked:"PEOPLE" },
  { id:"TK-201", title:"Reconcile Indiranagar cash variance", outlet:"IDR", owner:"Mohammed Hisham", due:"25 Aug", priority:"watch", status:"Open", linked:"CASH" },
  { id:"TK-198", title:"Confirm fryer-oil usage investigation", outlet:"GROUP", owner:"Mueen Ahmed", due:"28 Aug", priority:"watch", status:"Open", linked:"INV" },
  { id:"TK-194", title:"Prepare August management pack", outlet:"GROUP", owner:"Mohammed Afridi", due:"31 Aug", priority:"info", status:"Scheduled", linked:"REPORT" }
] as const;

export const documents = [
  { id:"DOC-01", name:"Group Monthly P&L · July 2026", type:"Management Pack", scope:"GROUP", owner:"Owner", updated:"03 Aug 2026", status:"Final" },
  { id:"DOC-02", name:"FSSAI · Koramangala", type:"License", scope:"KRM", owner:"Owner", updated:"12 Jul 2026", status:"Valid" },
  { id:"DOC-03", name:"Lease · Whitefield", type:"Lease", scope:"WFD", owner:"Owner", updated:"18 Jun 2026", status:"Valid" },
  { id:"DOC-04", name:"Fire Compliance · Indiranagar", type:"Compliance", scope:"IDR", owner:"Owner", updated:"07 Aug 2026", status:"Review in 45d" },
  { id:"DOC-05", name:"Vendor Agreement · Sample Foods", type:"Vendor", scope:"GROUP", owner:"Owner", updated:"15 May 2026", status:"Valid" },
  { id:"DOC-06", name:"Equipment AMC · HSR", type:"Maintenance", scope:"HSR", owner:"Owner", updated:"28 Jul 2026", status:"Valid" }
] as const;

export const complianceItems = [
  { name:"FSSAI", outlets:8, compliant:8, next:"14 Nov 2026", state:"steady" },
  { name:"Fire / safety", outlets:8, compliant:7, next:"09 Oct 2026", state:"watch" },
  { name:"Trade licenses", outlets:8, compliant:8, next:"22 Dec 2026", state:"steady" },
  { name:"Equipment AMC", outlets:8, compliant:6, next:"03 Sep 2026", state:"watch" }
] as const;

export const reports = [
  { name:"Group Monthly P&L", cadence:"Monthly", owner:"Owners", status:"Ready" },
  { name:"Outlet Performance Pack", cadence:"Monthly", owner:"Owners", status:"Ready" },
  { name:"Food Cost Variance", cadence:"Weekly", owner:"Owners", status:"Ready" },
  { name:"Workforce & Labour", cadence:"Monthly", owner:"Owners", status:"Waiting on attendance" },
  { name:"Inventory Risk", cadence:"Weekly", owner:"Owners", status:"Ready" },
  { name:"Channel Contribution", cadence:"Monthly", owner:"Owners", status:"Ready" }
] as const;

export const importHistory = [
  { file:"aug-2026-sales.csv", type:"Daily sales", rows:248, accepted:248, rejected:0, status:"Imported", at:"25 Aug · 15:24" },
  { file:"aug-expenses.csv", type:"Expenses", rows:96, accepted:94, rejected:2, status:"Needs review", at:"25 Aug · 14:42" },
  { file:"staff-master.csv", type:"Staff", rows:162, accepted:162, rejected:0, status:"Imported", at:"24 Aug · 19:16" },
  { file:"channel-sales.csv", type:"Channel sales", rows:310, accepted:310, rejected:0, status:"Imported", at:"24 Aug · 18:20" }
] as const;

export const securityFeed = [
  { at:"15:30:02", severity:"info", event:"Owner session verified", actor:"Mohammed Afridi", source:"Approved device" },
  { at:"14:18:11", severity:"watch", event:"New Owner device approval requested", actor:"Mueen Ahmed", source:"Chrome / Bengaluru" },
  { at:"13:42:39", severity:"info", event:"Owner session ended", actor:"Mohammed Hisham", source:"Session policy" },
  { at:"12:10:05", severity:"info", event:"Monthly report exported", actor:"Mohammed Afridi", source:"Audit trail" }
] as const;

export const cashReconciliation = outlets.map((o,i)=>({ outlet:o.id, expected:Math.round(o.revenue*.16), deposited:Math.round(o.revenue*.16-o.cashVariance), variance:o.cashVariance, status:Math.abs(o.cashVariance)>2000?"critical":Math.abs(o.cashVariance)>1000?"watch":"steady", closed:i<5 }));

export const executiveInsights = [
  { code:"I-01", tone:"good", title:"Revenue velocity is ahead of July", body:"Group MTD revenue is 8.6% above the comparable July position. Jayanagar and Koramangala are contributing the strongest positive momentum.", metric:"+8.6%" },
  { code:"I-02", tone:"critical", title:"Food-cost leakage is concentrated", body:"Whitefield and Malleshwaram are above the configured control band. Together they account for most of the group food-cost variance this month.", metric:"2 OUTLETS" },
  { code:"I-03", tone:"watch", title:"Two outlets are diluting group margin", body:"Malleshwaram and BTM remain below the minimum operating-margin threshold despite group revenue growth.", metric:"-₹0.8L" },
  { code:"I-04", tone:"info", title:"Weekend capacity carries the month", body:"Friday through Sunday demand indexes materially above weekday levels. Labour and stock plans should be aligned to this concentration.", metric:"41% MIX" }
] as const;

export const calendarItems = [
  { date:"26 AUG", title:"Whitefield food-cost review", type:"CONTROL" },
  { date:"27 AUG", title:"Malleshwaram action-plan review", type:"OWNER" },
  { date:"28 AUG", title:"Inventory count lock", type:"OPS" },
  { date:"31 AUG", title:"August management close", type:"FINANCE" },
  { date:"03 SEP", title:"Equipment AMC review", type:"COMPLIANCE" }
] as const;

export function money(n:number){
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
}

export function compactMoney(n:number){
  const sign=n<0?"-":""; const abs=Math.abs(n);
  if(abs>=10_000_000) return `${sign}₹${(abs/10_000_000).toFixed(2)}Cr`;
  if(abs>=100_000) return `${sign}₹${(abs/100_000).toFixed(2)}L`;
  return `${sign}${money(abs)}`;
}

export function outletById(id:string){ return outlets.find(o=>o.id===id.toUpperCase()); }
