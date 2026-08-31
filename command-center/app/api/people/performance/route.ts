import { z } from "zod";
import { requireApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { enforceSameOrigin, readJsonWithLimit, requestParseError, consumeRateLimit, rateLimitResponse } from "@/lib/http-security";
import { hasFreshFinancialMfa } from "@/lib/mfa";
const rating=z.number().min(0).max(10);
const schema=z.object({staffId:z.string().uuid(),month:z.string().regex(/^\d{4}-\d{2}$/),overallRating:rating,attendanceRating:rating.optional(),roleSkillRating:rating.optional(),teamworkRating:rating.optional(),ownershipRating:rating.optional(),strengths:z.string().trim().max(1500).optional(),improvementPoints:z.string().trim().max(1500).optional(),reviewNotes:z.string().trim().max(3000).optional()});
export async function POST(req:Request){
 const same=enforceSameOrigin(req);if(same)return same;const access=await requireApiProfile("/api/people/performance");if("response" in access)return access.response;
 if(!(await hasFreshFinancialMfa()))return Response.json({error:"Fresh MFA required",code:"MFA_FRESH_REQUIRED"},{status:428});
 const limit=await consumeRateLimit("people-performance",30,60,"user");if(!limit.allowed)return rateLimitResponse(limit.retryAfter);
 try{const parsed=schema.safeParse(await readJsonWithLimit(req,12288));if(!parsed.success)return Response.json({error:"Invalid performance review",issues:parsed.error.flatten()},{status:400});const v=parsed.data;const [year,month]=v.month.split("-").map(Number);
 const periods=await db()`INSERT INTO reporting_periods(year,month,status) VALUES(${year},${month},'open') ON CONFLICT(year,month) DO UPDATE SET year=EXCLUDED.year RETURNING id,status`;
 if(String(periods[0].status)==="closed")return Response.json({error:"That month is already closed"},{status:409});const periodId=String(periods[0].id);
 await db()`INSERT INTO staff_performance_reviews(staff_id,period_id,overall_rating,attendance_rating,role_skill_rating,teamwork_rating,ownership_rating,strengths,improvement_points,review_notes,reviewed_by,reviewed_at)
 VALUES(${v.staffId},${periodId},${v.overallRating},${v.attendanceRating??null},${v.roleSkillRating??null},${v.teamworkRating??null},${v.ownershipRating??null},${v.strengths||null},${v.improvementPoints||null},${v.reviewNotes||null},${access.profile.id},NOW())
 ON CONFLICT(staff_id,period_id) DO UPDATE SET overall_rating=EXCLUDED.overall_rating,attendance_rating=EXCLUDED.attendance_rating,role_skill_rating=EXCLUDED.role_skill_rating,teamwork_rating=EXCLUDED.teamwork_rating,ownership_rating=EXCLUDED.ownership_rating,strengths=EXCLUDED.strengths,improvement_points=EXCLUDED.improvement_points,review_notes=EXCLUDED.review_notes,reviewed_by=EXCLUDED.reviewed_by,reviewed_at=NOW(),updated_at=NOW()`;
 await recordSecurityEvent("staff_performance_review_saved",{metadata:{staffId:v.staffId,month:v.month,overallRating:v.overallRating}});return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
