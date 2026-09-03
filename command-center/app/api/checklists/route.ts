import { z } from "zod";
import { requireApiProfile } from "@/lib/access-control";
import { getChecklistTemplates } from "@/lib/checklists";
import { db } from "@/lib/db";
import { consumeRateLimit,enforceSameOrigin,internalApiError,rateLimitResponse,readJsonWithLimit,requestParseError } from "@/lib/http-security";
import { hasFreshFinancialMfa } from "@/lib/mfa";
import { requestMeta } from "@/lib/request-meta";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(2).max(180),
  detail: z.string().trim().max(500).optional().default(""),
  required: z.boolean().default(true),
  active: z.boolean().default(true),
});
const templateSchema = z.object({
  code: z.enum(["opening","closing"]),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).optional().default(""),
  scheduleTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.literal("Asia/Kolkata").default("Asia/Kolkata"),
  active: z.boolean().default(true),
  items: z.array(itemSchema).min(1).max(30),
}).superRefine((value,ctx)=>{
  if(!value.items.some(item=>item.active)) ctx.addIssue({code:"custom",path:["items"],message:"At least one checklist item must remain active"});
  const ids=value.items.flatMap(item=>item.id?[item.id]:[]);
  if(new Set(ids).size!==ids.length)ctx.addIssue({code:"custom",path:["items"],message:"Checklist item ids must be unique"});
});

export async function GET(){
  const access=await requireApiProfile("/api/checklists");
  if("response" in access)return access.response;
  const templates=await getChecklistTemplates();
  return Response.json({templates},{headers:{"Cache-Control":"private, no-store"}});
}

export async function PATCH(req:Request){
  const same=enforceSameOrigin(req);if(same)return same;
  const access=await requireApiProfile("/api/checklists");if("response" in access)return access.response;
  if(!(await hasFreshFinancialMfa()))return Response.json({error:"Fresh MFA required",code:"MFA_FRESH_REQUIRED"},{status:428});
  const limit=await consumeRateLimit("checklist-template-write",20,60,"user");if(!limit.allowed)return rateLimitResponse(limit.retryAfter);
  try{
    const parsed=templateSchema.safeParse(await readJsonWithLimit(req,30000));
    if(!parsed.success)return Response.json({error:"Invalid checklist",issues:parsed.error.flatten()},{status:400});
    const value=parsed.data;const sql=db();
    const existing=(await sql`SELECT id FROM checklist_templates WHERE code=${value.code} LIMIT 1`)[0] as any;
    if(!existing)return Response.json({error:"Checklist template not found. Apply db/daily-checklists.sql first."},{status:409});
    const existingItems=await sql`SELECT id FROM checklist_items WHERE template_id=${existing.id}`;
    const allowedIds=new Set(existingItems.map((row:any)=>String(row.id)));
    const submittedIds=value.items.flatMap(item=>item.id?[item.id]:[]);
    if(submittedIds.some(id=>!allowedIds.has(id)))return Response.json({error:"Checklist item does not belong to this template"},{status:409});
    const meta=await requestMeta();
    await sql.begin("isolation level serializable",async(tx)=>{
      await tx`SELECT set_config('app.actor_user_id',${access.profile.id},true),set_config('app.request_id',${meta.requestId},true)`;
      await tx`UPDATE checklist_templates SET name=${value.name},description=${value.description||null},schedule_time=${value.scheduleTime}::time,timezone=${value.timezone},active=${value.active},updated_by=${access.profile.id},updated_at=NOW() WHERE id=${existing.id}`;
      await tx`UPDATE checklist_items SET item_order=item_order+1000 WHERE template_id=${existing.id}`;
      if(submittedIds.length){
        await tx`DELETE FROM checklist_items WHERE template_id=${existing.id} AND id NOT IN (SELECT value::uuid FROM jsonb_array_elements_text(${JSON.stringify(submittedIds)}::jsonb))`;
      }else{
        await tx`DELETE FROM checklist_items WHERE template_id=${existing.id}`;
      }
      for(const [index,item] of value.items.entries()){
        if(item.id){
          await tx`UPDATE checklist_items SET item_order=${index+1},label=${item.label},detail=${item.detail||null},required=${item.required},active=${item.active},updated_by=${access.profile.id},updated_at=NOW() WHERE id=${item.id} AND template_id=${existing.id}`;
        }else{
          await tx`INSERT INTO checklist_items(template_id,item_order,label,detail,required,active,created_by,updated_by) VALUES(${existing.id},${index+1},${item.label},${item.detail||null},${item.required},${item.active},${access.profile.id},${access.profile.id})`;
        }
      }
    });
    const refreshed=(await getChecklistTemplates()).find(template=>template.code===value.code);
    return Response.json({ok:true,template:refreshed},{headers:{"Cache-Control":"no-store"}});
  }catch(error){const response=requestParseError(error);if(response)return response;return internalApiError(error,"Checklist update failed","CHECKLIST_UPDATE_FAILED");}
}
