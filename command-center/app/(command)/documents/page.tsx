import { getDocuments,getReportingContext } from "@/lib/command-data";
import { outletOptions } from "@/lib/restaurant-controls";
import { DocumentCreateButton } from "@/components/qa-record-actions";
import { PageLead, Panel, SectionHead, StatePill } from "@/components/ui";

export default async function DocumentsPage(){
  const [ctx,documents,outlets]=await Promise.all([getReportingContext(),getDocuments(),outletOptions()]);
  const expiring=documents.filter(d=>d.status.startsWith('Review')||d.status==='Expired');
  return <>
    <PageLead code="16" eyebrow="DOCUMENT CONTROL / LICENSES / RECORDS" title="Keep critical records visible before they expire." copy="Store controlled document metadata by outlet, track expiry dates and keep sensitive records inside Owner-only access." action={<DocumentCreateButton outlets={outlets as any}/>} meta={<><span>{documents.length} RECORDS</span><span>{expiring.length} EXPIRY WATCH</span><span>{ctx.dataMode.toUpperCase()}</span></>}/>
    <div className="documents-grid command-gap">
      <Panel className="document-library"><SectionHead no="01" kicker="DOCUMENT VAULT" title="Controlled records"/>
        <div className="document-head"><span>DOCUMENT</span><span>TYPE</span><span>SCOPE</span><span>OWNER</span><span>UPDATED</span><span>STATUS</span></div>
        {documents.length?documents.map((d,i)=><div className="document-row" key={d.id}>
          <span><b>D{String(i+1).padStart(2,"0")}</b><strong>{d.name}</strong></span><span>{d.type}</span><b>{d.scope}</b><span>{d.owner}</span><time>{d.updated}</time><StatePill state={d.status==='Expired'?'critical':d.status.startsWith('Review')?'watch':'steady'}>{d.status==='Valid'?'VALID':'WATCH'}</StatePill>
        </div>):<div className="empty-state"><span>00</span><strong>No document records</strong><p>Add licenses, leases, insurance and other controlled records when ready.</p></div>}
      </Panel>
      <Panel className="document-expiry" tone="cream"><SectionHead no="02" kicker="EXPIRY WATCH" title="Records requiring attention"/><div className="expiry-timeline">{expiring.map(d=><div key={d.id}><time>{d.status==='Expired'?'NOW':'WATCH'}</time><span><strong>{d.name}</strong><small>{d.scope} · {d.type}</small></span><b>{d.status}</b></div>)}{!expiring.length&&<p className="panel-note">No document expiry records currently need attention.</p>}</div></Panel>
    </div>
  </>;
}
