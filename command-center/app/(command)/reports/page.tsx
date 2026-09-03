import Link from "next/link";
import { getReportsData } from "@/lib/command-data";
import { PageLead, Panel, SectionHead, SparkBars, StatePill } from "@/components/ui";
const reportTypes=[
  {name:'Group Monthly P&L',cadence:'Monthly',href:'/financials'},
  {name:'Outlet Performance Pack',cadence:'Monthly',href:'/outlets'},
  {name:'Food Cost Variance',cadence:'Weekly',href:'/financials'},
  {name:'Workforce & Labour',cadence:'Monthly',href:'/people'},
  {name:'Inventory Risk',cadence:'Weekly',href:'/inventory'},
  {name:'Channel Contribution',cadence:'Monthly',href:'/sales'}
];
export default async function ReportsPage(){const {ctx,trend,imports}=await getReportsData();return <>
  <PageLead code="15" eyebrow={`REPORTING / MANAGEMENT PACK / ${ctx.label}`} title="One source of truth for owner review." copy="Reports are generated from the same production tables that drive the Command Center, so the management view and operating view stay aligned." action={<a className="command-button" href="/api/reports/management-pack">EXPORT MANAGEMENT PACK <span>↓</span></a>}/>
  <div className="reports-grid command-gap">
    <Panel className="report-library"><SectionHead no="01" kicker="REPORT LIBRARY" title="Owner reporting set"/>
      <div className="report-table"><div className="report-head"><span>REPORT</span><span>CADENCE</span><span>SCOPE</span><span>STATUS</span><span>OPEN</span></div>{reportTypes.map((r,i)=><div className="report-row" key={r.name}><span><strong>R{String(i+1).padStart(2,"0")} · {r.name}</strong><small>Command Center production view</small></span><span>{r.cadence}</span><b>OWNERS</b><StatePill state="steady">LIVE VIEW</StatePill><Link className="report-open-link" href={r.href}>OPEN →</Link></div>)}</div>
    </Panel>
    <Panel className="report-trend"><SectionHead no="02" kicker="6 MONTH TREND" title="Revenue and margin history"/><div className="history-bars">{trend.map(m=><div key={m.month}><span>{m.month}</span><i style={{height:`${Math.max(2,m.revenue/1.5)}px`}}/><b style={{height:`${Math.max(2,Math.abs(m.profit)*3)}px`}}/><small>₹{m.revenue}L</small></div>)}</div><SparkBars values={trend.map(m=>Math.max(0,m.margin*6))}/></Panel>
    <Panel className="report-source"><SectionHead no="03" kicker="DATA LINEAGE" title="Latest controlled imports"/><div className="resolution-list">{imports.slice(0,8).map(i=><div key={`${i.file}-${i.at}`}><time>{i.at}</time><span><strong>{i.file}</strong><small>{i.type} · {i.accepted}/{i.rows} accepted</small></span><b>{i.status.toUpperCase()}</b></div>)}</div></Panel>
  </div>
</>}
