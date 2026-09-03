"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { compactMoney } from "@/lib/demo-data";
import type { Outlet } from "@/lib/demo-data";
import type { AlertRow, ActivityRow, ChannelRow, ReportingContext } from "@/lib/command-data";
import { CountUp, Donut, Gauge, RevenueLine } from "@/components/ui";

type Previous={label:string;hasData:boolean;revenue:number;profit:number;margin:number;orders:number;aov:number;grossProfit:number;operatingProfit:number;dailyRevenue:number[]};
export type OverviewData={reportingPeriod:ReportingContext;outlets:Outlet[];dailyRevenue:number[];channelMix:ChannelRow[];alerts:AlertRow[];activity:ActivityRow[];groupTarget:number;grossProfit:number;operatingProfit:number;previous:Previous};

function MetricIcon({ code, tone = "red" }: { code: string; tone?: "red" | "teal" | "cream" }) { return <span className={`brand-metric-icon is-${tone}`}>{code}</span>; }
function clamp(v:number){return Math.max(0,Math.min(100,v));}
function pctDelta(current:number,previous:number){return previous?((current-previous)/previous)*100:null;}
function deltaCopy(value:number|null,label:string,points=false){if(value===null)return <small className="is-neutral">PRIOR PERIOD NOT LOADED</small>;const up=value>=0;return <small className={up?"is-positive":"is-negative"}>{up?"↗":"↘"} {Math.abs(value).toFixed(1)}{points?" pts":"%"} <em>vs {label}</em></small>;}

export function Overview({data}:{data:OverviewData}) {
  const {reportingPeriod,outlets,dailyRevenue,channelMix,alerts,activity,groupTarget,grossProfit,operatingProfit,previous}=data;
  const totals = useMemo(() => outlets.reduce((a,o)=>({revenue:a.revenue+o.revenue,profit:a.profit+o.profit,orders:a.orders+o.orders,staff:a.staff+o.staff}),{revenue:0,profit:0,orders:0,staff:0}),[outlets]);
  const avgOrderValue=totals.orders?totals.revenue/totals.orders:0,margin=totals.revenue?(totals.profit/totals.revenue)*100:0,targetPct=groupTarget>0?clamp((totals.revenue/groupTarget)*100):0;
  const topOutlets=[...outlets].sort((a,b)=>b.margin-a.margin).slice(0,5);
  const avg=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
  const healthComponents=[
    ["TARGET",targetPct],
    ["PROFITABILITY",clamp(margin*4)],
    ["COST CONTROL",avg(outlets.map(o=>clamp(100-Math.max(0,o.foodCost-30)*5)))],
    ["INVENTORY",avg(outlets.map(o=>o.inventoryHealth))],
    ["CUSTOMER",avg(outlets.map(o=>clamp((o.rating||0)*20)))],
    ["AUDIT",avg(outlets.map(o=>o.compliance))]
  ] as const;
  const health=Math.round(avg(healthComponents.map(([,v])=>v)));
  const healthLabel=health>=90?"EXCELLENT":health>=80?"VERY GOOD":health>=70?"STEADY":health>=55?"WATCH":"CRITICAL";
  const latestDay=Math.max(1,Math.min(reportingPeriod.daysElapsed,dailyRevenue.length||1)),latestDaily=(dailyRevenue[latestDay-1]||0)*100000;
  const grossMargin=totals.revenue?grossProfit/totals.revenue*100:0,operatingMargin=totals.revenue?operatingProfit/totals.revenue*100:0;
  const revenueChange=previous.hasData?pctDelta(totals.revenue,previous.revenue):null;
  const previousGrossMargin=previous.revenue?previous.grossProfit/previous.revenue*100:0,previousOperatingMargin=previous.revenue?previous.operatingProfit/previous.revenue*100:0;

  if(!outlets.length){return <section className="brand-card empty-command-state"><span>COMMAND CENTER READY</span><h2>No outlet data has been loaded yet.</h2><p>Use Imports to load outlets and operating data. Production never substitutes fabricated business numbers.</p><Link href="/imports" className="brand-card-action">OPEN IMPORT CENTER →</Link></section>}

  return <>
    <section className="brand-overview-intro"><div className="brand-overview-identity"><Image className="brand-overview-logo" src="/grub-monkeys-logo.png" alt="Grub Monkeys" width={118} height={46} priority/><span>OWNER COMMAND VIEW</span><strong>GROUP OPERATIONS · {reportingPeriod.label}</strong></div><div className="brand-overview-status"><i/><span><b>LIVE OPERATING VIEW</b><small>{reportingPeriod.dataMode==="live"?"Neon production data":reportingPeriod.dataMode==="demo"?"Development demo data":"Waiting for first controlled import"}</small></span></div></section>

    <section className="brand-kpi-deck">
      <article className="brand-kpi-card"><MetricIcon code="₹" tone="red"/><div><span>TOTAL REVENUE (MTD)</span><strong>{compactMoney(totals.revenue)}</strong>{deltaCopy(previous.hasData?pctDelta(totals.revenue,previous.revenue):null,previous.label)}</div></article>
      <article className="brand-kpi-card"><MetricIcon code="NP" tone="teal"/><div><span>NET PROFIT (MTD)</span><strong>{compactMoney(totals.profit)}</strong>{deltaCopy(previous.hasData?pctDelta(totals.profit,previous.profit):null,previous.label)}</div></article>
      <article className="brand-kpi-card"><MetricIcon code="%" tone="red"/><div><span>NET MARGIN</span><strong><CountUp value={margin} decimals={1} suffix="%"/></strong>{deltaCopy(previous.hasData?margin-previous.margin:null,previous.label,true)}</div></article>
      <article className="brand-kpi-card"><MetricIcon code="OR" tone="teal"/><div><span>TOTAL ORDERS</span><strong><CountUp value={totals.orders}/></strong>{deltaCopy(previous.hasData?pctDelta(totals.orders,previous.orders):null,previous.label)}</div></article>
      <article className="brand-kpi-card"><MetricIcon code="AO" tone="red"/><div><span>AVG ORDER VALUE</span><strong>₹<CountUp value={avgOrderValue}/></strong>{deltaCopy(previous.hasData?pctDelta(avgOrderValue,previous.aov):null,previous.label)}</div></article>
      <article className="brand-kpi-card"><MetricIcon code="HR" tone="teal"/><div><span>TOTAL STAFF</span><strong><CountUp value={totals.staff}/></strong><small className="is-neutral">{outlets.length} ACTIVE / TEMP-CLOSED OUTLETS</small></div></article>
    </section>

    <div className="brand-command-grid brand-command-grid--primary">
      <section className="brand-card outlet-performance-card"><header><div><span>OUTLET PERFORMANCE</span><small>MTD performance vs prior period</small></div><Link href="/outlets">VIEW ALL OUTLETS →</Link></header><div className="brand-outlet-table brand-outlet-table--head"><span>OUTLET</span><span>REVENUE</span><span>PROFIT</span><span>MARGIN</span><span>ORDERS</span><span>STAFF</span><span>VS PRIOR PERIOD</span></div><div className="brand-outlet-table-body">{outlets.map((o,i)=><Link href={`/outlets/${o.id}`} className="brand-outlet-table" key={o.id}><span className="outlet-cell"><b>{i+1}</b><i>{o.id}</i><strong>{o.name}</strong></span><span>{compactMoney(o.revenue)}</span><span>{compactMoney(o.profit)}</span><span>{o.margin.toFixed(1)}%</span><span>{o.orders.toLocaleString("en-IN")}</span><span>{o.staff}</span><span className={o.delta<0?"row-delta is-negative":"row-delta"}><b>{o.delta>0?"↗":o.delta<0?"↘":"→"} {Math.abs(o.delta).toFixed(1)}%</b></span></Link>)}</div></section>

      <section className="brand-card revenue-overview-card"><header><div><span>REVENUE OVERVIEW</span><small>{previous.hasData?`${reportingPeriod.label} vs ${previous.label}`:`${reportingPeriod.label} trajectory`}</small></div><span className="brand-card-context" aria-label="Current reporting view">CURRENT MTD</span></header><div className="brand-chart-value"><strong>{compactMoney(totals.revenue)}</strong>{revenueChange!==null&&<span>{revenueChange>=0?"↗":"↘"} {Math.abs(revenueChange).toFixed(1)}% <em>vs {previous.label}</em></span>}</div><div className="brand-revenue-chart"><RevenueLine values={dailyRevenue} compare={previous.hasData?previous.dailyRevenue:undefined} tone="red"/><div className="brand-chart-tooltip"><small>{latestDay} {reportingPeriod.label}</small><strong>{compactMoney(latestDaily)}</strong></div></div><div className="brand-chart-axis"><span>1</span><span>7</span><span>14</span><span>21</span><span>{reportingPeriod.daysInMonth}</span></div></section>

      <section className="brand-card channel-card"><header><div><span>CHANNEL-WISE REVENUE</span><small>Revenue mix · MTD</small></div><span className="brand-card-context" aria-label="Current reporting view">CURRENT MTD</span></header><div className="brand-channel-layout"><Donut segments={channelMix.map((c,i)=>({value:c.share,className:`seg-${i+1}`}))} center={compactMoney(totals.revenue)} sub="TOTAL"/><div className="brand-channel-list">{channelMix.map((c,i)=><div key={c.name}><i className={`brand-dot brand-dot-${i+1}`}/><span><strong>{c.name}</strong><small>{compactMoney(c.revenue)}</small></span><b>{c.share.toFixed(1)}%</b></div>)}</div></div><Link className="brand-card-action" href="/sales">VIEW CHANNEL REPORT →</Link></section>
    </div>

    <div className="brand-command-grid brand-command-grid--secondary">
      <section className="brand-card alerts-card"><header><div><span>ALERTS & NOTIFICATIONS</span><small>Exceptions requiring owner attention</small></div><Link href="/alerts">VIEW ALL ({alerts.length}) →</Link></header><div className="brand-alert-list">{alerts.slice(0,4).map((a,i)=><Link href="/alerts" key={a.id} className={`brand-alert is-${a.severity}`}><b>{i+1}</b><span><strong>{a.title}</strong><small>{a.detail}</small></span><time>{a.age}</time></Link>)}</div></section>

      <section className="brand-card profitability-card"><header><div><span>PROFITABILITY</span><small>Current P&L margins from controlled financial records</small></div><span className="brand-card-context" aria-label="Current reporting view">CURRENT MTD</span></header><div className="brand-profit-kpis"><div><span>GROSS PROFIT</span><strong>{compactMoney(grossProfit)}</strong>{deltaCopy(previous.hasData?grossMargin-previousGrossMargin:null,previous.label,true)}</div><div><span>OPERATING PROFIT</span><strong>{compactMoney(operatingProfit)}</strong>{deltaCopy(previous.hasData?operatingMargin-previousOperatingMargin:null,previous.label,true)}</div><div><span>NET PROFIT</span><strong>{compactMoney(totals.profit)}</strong>{deltaCopy(previous.hasData?margin-previous.margin:null,previous.label,true)}</div></div><div className="brand-profit-rails"><div><span>GROSS MARGIN</span><strong>{grossMargin.toFixed(1)}%</strong><i><b style={{width:`${clamp(grossMargin*3)}%`}}/></i></div><div><span>OPERATING MARGIN</span><strong>{operatingMargin.toFixed(1)}%</strong><i><b style={{width:`${clamp(operatingMargin*4)}%`}}/></i></div><div><span>NET MARGIN</span><strong>{margin.toFixed(1)}%</strong><i><b style={{width:`${clamp(margin*4)}%`}}/></i></div></div><Link className="brand-card-action" href="/financials">VIEW FULL PROFITABILITY REPORT →</Link></section>

      <section className="brand-card top-outlets-card"><header><div><span>TOP PERFORMING OUTLETS</span><small>Ranked by current profit margin</small></div><span className="brand-card-context" aria-label="Current ranking method">SORTED: MARGIN</span></header><div className="brand-ranking">{topOutlets.map((o,i)=><Link href={`/outlets/${o.id}`} key={o.id}><b>{i+1}</b><span><strong>{o.name}</strong><small>{o.id}</small></span><em>{o.margin.toFixed(1)}%</em><strong className={o.delta<0?"bad-text":"good-text"}>{o.delta>0?"+":""}{o.delta.toFixed(1)}%</strong></Link>)}</div><Link className="brand-card-action" href="/outlets">VIEW ALL OUTLET PERFORMANCE →</Link></section>

      <section className="brand-card live-feed-card"><header><div><span>LIVE ACTIVITY FEED</span><small>Latest operating events</small></div><i className="live-dot"/></header><div className="brand-live-feed">{activity.slice(0,6).map((a,i)=><div key={`${a.time}-${i}`}><b>{a.type.slice(0,2).toUpperCase()}</b><span><strong>{a.action}</strong><small>{a.actor} · {a.target}</small></span><time>{a.time}</time></div>)}</div><Link className="brand-card-action" href="/alerts">VIEW ALL ACTIVITY →</Link></section>
    </div>

    <div className="brand-bottom-grid">
      <section className="brand-card group-health-card"><header><div><span>GROUP HEALTH SCORE</span><small>Derived from current operating data</small></div><span className="health-change">CURRENT PERIOD</span></header><div className="brand-health-body"><Gauge value={health} label={healthLabel} sub={reportingPeriod.label}/><div className="brand-health-rails">{healthComponents.map(([label,value])=><div key={label}><span>{label}</span><strong>{Math.round(value)}<small>/100</small></strong><i><b style={{width:`${clamp(value)}%`}}/></i></div>)}</div></div></section>

      <section className="brand-card quick-actions-card"><header><div><span>QUICK ACTIONS</span><small>Owner shortcuts</small></div></header><div className="brand-quick-actions"><Link href="/expenses#expense-entry"><MetricIcon code="₹" tone="red"/><span>ADD EXPENSE</span></Link><Link href="/people"><MetricIcon code="HR" tone="teal"/><span>ADD STAFF</span></Link><Link href="/imports"><MetricIcon code="UP" tone="cream"/><span>UPLOAD REPORT</span></Link><Link href="/imports"><MetricIcon code="ST" tone="red"/><span>IMPORT STOCK COUNT</span></Link><Link href="/reports"><MetricIcon code="RP" tone="teal"/><span>VIEW REPORTS</span></Link><Link href="/tasks?new=1"><MetricIcon code="TK" tone="cream"/><span>CREATE TASK</span></Link></div></section>

      <section className="brand-card target-card"><header><div><span>TARGET ACHIEVEMENT</span><small>{reportingPeriod.label} group target</small></div></header><div className="brand-target-body"><div className="target-ring" style={{"--target":`${targetPct*3.6}deg`} as CSSProperties}><strong>{Math.round(targetPct)}%</strong></div><div><span>GROUP TARGET</span><strong>{compactMoney(groupTarget)}</strong><small>ACHIEVED</small><b>{compactMoney(totals.revenue)}</b><i><em style={{width:`${targetPct}%`}}/></i></div></div></section>
    </div>
  </>;
}
