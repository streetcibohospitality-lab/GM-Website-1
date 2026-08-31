import { z } from "zod";
import { requireApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { enforceSameOrigin, readJsonWithLimit, requestParseError, consumeRateLimit, rateLimitResponse } from "@/lib/http-security";
import { hasFreshFinancialMfa } from "@/lib/mfa";

const schema=z.object({
  staffId:z.string().uuid(),
  effectiveFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlySalary:z.number().min(0).max(10000000),
  changeType:z.enum(["joining","increment","adjustment","correction"]),
  notes:z.string().trim().max(1500).optional()
});

export async function POST(req:Request){
  const same=enforceSameOrigin(req);if(same)return same;
  const access=await requireApiProfile("/api/people/salary");if("response" in access)return access.response;
  if(!(await hasFreshFinancialMfa()))return Response.json({error:"Fresh MFA required",code:"MFA_FRESH_REQUIRED"},{status:428});
  const limit=await consumeRateLimit("people-salary",15,60,"user");if(!limit.allowed)return rateLimitResponse(limit.retryAfter);
  try{
    const parsed=schema.safeParse(await readJsonWithLimit(req,8192));if(!parsed.success)return Response.json({error:"Invalid salary record",issues:parsed.error.flatten()},{status:400});
    const v=parsed.data;
    const rows=await db()`
      WITH current AS (
        SELECT id,current_monthly_salary FROM staff_members WHERE id=${v.staffId} FOR UPDATE
      ), logged AS (
        INSERT INTO staff_salary_history(staff_id,effective_from,monthly_salary,previous_monthly_salary,change_type,notes,changed_by)
        SELECT id,${v.effectiveFrom},${v.monthlySalary},current_monthly_salary,${v.changeType},${v.notes||null},${access.profile.id} FROM current
        RETURNING id
      )
      UPDATE staff_members SET current_monthly_salary=${v.monthlySalary},salary_effective_from=${v.effectiveFrom},updated_at=NOW()
      WHERE id=${v.staffId} AND EXISTS(SELECT 1 FROM logged) RETURNING id,full_name`;
    if(!rows.length)return Response.json({error:"Employee not found"},{status:404});
    await db()`INSERT INTO staff_events(staff_id,event_type,effective_date,title,notes,created_by) VALUES(${v.staffId},${v.changeType==="increment"?"increment":"other"},${v.effectiveFrom},${v.changeType==="increment"?"Salary increment recorded":"Salary record updated"},${v.notes||null},${access.profile.id})`;
    await recordSecurityEvent("staff_salary_updated",{metadata:{staffId:v.staffId,changeType:v.changeType,effectiveFrom:v.effectiveFrom}});
    return Response.json({ok:true},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
  }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
