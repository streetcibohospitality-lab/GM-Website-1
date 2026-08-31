import { getTasks } from "@/lib/command-data";
import { outletOptions } from "@/lib/restaurant-controls";
import { OWNER_DIRECTORY } from "@/lib/owner-directory";
import { TaskCreateButton, TaskDoneButton } from "@/components/qa-record-actions";
import { PageLead, Panel, SectionHead, StatePill } from "@/components/ui";

export default async function TasksPage({searchParams}:{searchParams:Promise<{new?:string}>}){
  const [tasks,outlets,query]=await Promise.all([getTasks(),outletOptions(),searchParams]);
  return <>
    <PageLead code="14" eyebrow="OWNER ACTIONS / TASKS" title="Turn exceptions into accountable action." copy="Tasks can be linked to outlets and alerts, assigned to one of the three Owners and tracked through completion." action={<TaskCreateButton outlets={outlets as any} owners={[...OWNER_DIRECTORY]} autoOpen={query.new==="1"}/>} />
    <div className="tasks-grid command-gap">
      <Panel className="task-board"><SectionHead no="01" kicker="OPEN ACTIONS" title="Owner task queue"/>
        <div className="task-board-head"><span>TASK / LINK</span><span>OWNER</span><span>DUE</span><span>PRIORITY</span><span>STATUS</span><span>OUTLET</span></div>
        {tasks.length?tasks.map(t=><div className={`task-row ${t.priority==='urgent'?'is-critical':''}`} key={t.id}>
          <span><b>{t.id.slice(0,6).toUpperCase()}</b><i>TK</i><strong>{t.title}</strong><small>{t.linked==='—'?'OWNER TASK':`LINKED · ${t.linked}`}</small></span>
          <b>{t.owner}</b><time>{t.due}</time>
          <span><StatePill state={t.priority==='urgent'?'critical':t.priority==='high'?'watch':'steady'}>{t.priority.toUpperCase()}</StatePill></span>
          <span><TaskDoneButton id={t.id}/></span><b>{t.outlet}</b>
        </div>):<div className="empty-state"><span>00</span><strong>No open tasks</strong><p>Create an Owner task when an exception needs accountable follow-through.</p></div>}
      </Panel>
    </div>
  </>;
}
