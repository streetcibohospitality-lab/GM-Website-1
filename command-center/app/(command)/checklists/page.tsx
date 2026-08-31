import { ChecklistControl } from "@/components/checklist-control";
import { PageLead,Panel,SectionHead } from "@/components/ui";
import { getChecklistTemplates } from "@/lib/checklists";

export default async function ChecklistsPage(){
  try{
    const templates=await getChecklistTemplates();
    return <>
      <PageLead code="13" eyebrow="DAILY CONTROL / OPENING + CLOSING" title="Make the daily routine explicit, editable and accountable." copy="Maintain the group-wide Opening and Closing checklists here. Items stay ordered, can be required or optional, and can be disabled without deleting the operating standard."/>
      <ChecklistControl initialTemplates={templates}/>
    </>;
  }catch(error){
    console.error("Checklist load failed",error);
    return <><PageLead code="13" eyebrow="DAILY CONTROL / DATA HELD" title="Daily checklists could not be loaded." copy="The page does not turn a database error into a false empty checklist."/><Panel tone="cream"><SectionHead no="ERR" kicker="DATA CONNECTION" title="Checklist register unavailable"/><p className="panel-note">Apply the checklist database migration and retry after the database connection is healthy.</p></Panel></>;
  }
}
