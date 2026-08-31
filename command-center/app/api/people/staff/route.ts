import { z } from "zod";
import { requireApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { enforceSameOrigin, readJsonWithLimit, requestParseError, consumeRateLimit, rateLimitResponse } from "@/lib/http-security";
import { hasFreshFinancialMfa } from "@/lib/mfa";

const schema=z.object({
  employeeCode:z.string().trim().max(40).optional(),fullName:z.string().trim().min(2).max(120),roleTitle:z.string().trim().min(2).max(100),
  joiningDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),employmentType:z.enum(["full_time","part_time","contract","intern"]).default("full_time"),
  monthlyCost:z.number().min(0).max(10000000).optional(),currentSalary:z.number().min(0).max(10000000).optional(),outletCode:z.string().trim().max(12).optional(),probationEndDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});
export async function POST(req:Request){
  const same=enforceSameOrigin(req);if(same)return same;
  const access=await requireApiProfile("/api/people/staff");if("response" in access)return access.response;
  if(!(await hasFreshFinancialMfa()))return Response.json({error:"Fresh MFA required",code:"MFA_FRESH_REQUIRED"},{status:428});
  const limit=await consumeRateLimit("people-create",12,60,"user");if(!limit.allowed)return rateLimitResponse(limit.retryAfter);
  try{
    const parsed=schema.safeParse(await readJsonWithLimit(req,8192));if(!parsed.success)return Response.json({error:"Invalid employee record",issues:parsed.error.flatten()},{status:400});
    const v=parsed.data;
    let outletId:string|null=null;if(v.outletCode){const outlet=await db()`SELECT id FROM outlets WHERE upper(code)=upper(${v.outletCode}) LIMIT 1`;if(!outlet.length)return Response.json({error:"Outlet code not found"},{status:400});outletId=String(outlet[0].id);}
    const rows=await db()`INSERT INTO staff_members(employee_code,full_name,role_title,employment_type,home_outlet_id,joining_date,probation_end_date,monthly_cost,current_monthly_salary,salary_effective_from,status)
      VALUES(${v.employeeCode||null},${v.fullName},${v.roleTitle},${v.employmentType},${outletId},${v.joiningDate},${v.probationEndDate||null},${v.monthlyCost||null},${v.currentSalary||null},${v.currentSalary!=null?v.joiningDate:null},'active') RETURNING id`;
    const id=String(rows[0].id);
    await db()`INSERT INTO staff_events(staff_id,event_type,effective_date,title,notes,created_by) VALUES(${id},'joining',${v.joiningDate},'Employee joined Grub Monkeys',${`${v.roleTitle}${v.employeeCode?` · ${v.employeeCode}`:""}`},${access.profile.id})`;
    if(v.currentSalary!=null){await db()`INSERT INTO staff_salary_history(staff_id,effective_from,monthly_salary,previous_monthly_salary,change_type,notes,changed_by) VALUES(${id},${v.joiningDate},${v.currentSalary},NULL,'joining','Joining salary',${access.profile.id})`;}
    await recordSecurityEvent("staff_record_created",{metadata:{staffId:id,employeeCode:v.employeeCode||null}});
    return Response.json({ok:true,id},{headers:{"Cache-Control":"no-store"}});
  }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
