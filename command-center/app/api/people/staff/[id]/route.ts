import { z } from "zod";
import { requireApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { enforceSameOrigin, readJsonWithLimit, requestParseError, consumeRateLimit, rateLimitResponse } from "@/lib/http-security";
import { hasFreshFinancialMfa } from "@/lib/mfa";
const schema=z.object({noticeGivenDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),lastWorkingDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),exitReason:z.string().trim().max(500).optional()});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const same=enforceSameOrigin(req);if(same)return same;const access=await requireApiProfile("/api/people/staff/notice");if("response" in access)return access.response;
 if(!(await hasFreshFinancialMfa()))return Response.json({error:"Fresh MFA required",code:"MFA_FRESH_REQUIRED"},{status:428});
 const limit=await consumeRateLimit("people-notice",20,60,"user");if(!limit.allowed)return rateLimitResponse(limit.retryAfter);
 try{const parsed=schema.safeParse(await readJsonWithLimit(req,4096));if(!parsed.success)return Response.json({error:"Invalid notice record"},{status:400});const {id}=await params;const v=parsed.data;
 const rows=await db()`UPDATE staff_members SET notice_given_date=${v.noticeGivenDate},planned_last_working_date=${v.lastWorkingDate},leaving_date=${v.lastWorkingDate},exit_reason=${v.exitReason||null},status='notice' WHERE id=${id} RETURNING id,full_name`;
 if(!rows.length)return Response.json({error:"Employee not found"},{status:404});
 await db()`INSERT INTO staff_events(staff_id,event_type,effective_date,title,notes,created_by) VALUES(${id},'notice',${v.noticeGivenDate},'Notice period recorded',${`Planned last working day: ${v.lastWorkingDate}${v.exitReason?` · ${v.exitReason}`:""}`},${access.profile.id})`;
 await recordSecurityEvent("staff_notice_recorded",{severity:"watch",metadata:{staffId:id,lastWorkingDate:v.lastWorkingDate}});return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
