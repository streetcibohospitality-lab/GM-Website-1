import "server-only";
import { db } from "@/lib/db";

export type ChecklistItemRecord = {
  id: string;
  template_id: string;
  item_order: number;
  label: string;
  detail: string | null;
  required: boolean;
  active: boolean;
};

export type ChecklistTemplateRecord = {
  id: string;
  code: "opening" | "closing";
  name: string;
  description: string | null;
  schedule_time: string;
  timezone: string;
  active: boolean;
  items: ChecklistItemRecord[];
};

export async function getChecklistTemplates(): Promise<ChecklistTemplateRecord[]> {
  const sql = db();
  const [templateRows, itemRows] = await Promise.all([
    sql`SELECT id,code,name,description,to_char(schedule_time,'HH24:MI') AS schedule_time,timezone,active
          FROM checklist_templates
          ORDER BY CASE code WHEN 'opening' THEN 0 WHEN 'closing' THEN 1 ELSE 2 END,name`,
    sql`SELECT id,template_id,item_order,label,detail,required,active
          FROM checklist_items
          ORDER BY template_id,item_order,id`,
  ]);
  const items = itemRows as unknown as ChecklistItemRecord[];
  return (templateRows as unknown as Omit<ChecklistTemplateRecord,"items">[]).map(template => ({
    ...template,
    items: items.filter(item => item.template_id === template.id),
  }));
}
