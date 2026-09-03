import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { requireIdentityApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { decryptMfaSecret, generateRecoveryCodes, hashRecoveryCode, markSessionMfaVerified, verifyTotp } from "@/lib/mfa";
import { consumeRateLimit, enforceSameOrigin, rateLimitResponse, readJsonWithLimit, requestParseError } from "@/lib/http-security";
const schema=z.object({code:z.string().regex(/^\s*\d{6}\s*$/).max(16)});
export async function POST(req:Request){
 const same=enforceSameOrigin(req);if(same)return same;const access=await requireIdentityApiProfile("/api/security/mfa/enroll");if("response" in access)return access.response;const profile=access.profile;if(profile.mfa_enabled)return Response.json({error:"MFA already enrolled"},{status:409});const rate=await consumeRateLimit("dash-mfa-enroll",6,300,"user");if(!rate.allowed)return rateLimitResponse(rate.retryAfter);
 try{const parsed=schema.safeParse(await readJsonWithLimit(req,1024));if(!parsed.success)return Response.json({error:"Enter the 6-digit authenticator code"},{status:400});const {sessionId}=await auth();if(!sessionId)return Response.json({error:"Unauthorized"},{status:401});const rows=await db()`SELECT mfa_secret_encrypted,mfa_enrolled_at FROM app_users WHERE id=${profile.id} LIMIT 1`;const row=rows[0] as {mfa_secret_encrypted?:string|null;mfa_enrolled_at?:string|null}|undefined;if(!row?.mfa_secret_encrypted||row.mfa_enrolled_at)return Response.json({error:"MFA setup is not available"},{status:409});const verified=verifyTotp(decryptMfaSecret(row.mfa_secret_encrypted),parsed.data.code);if(!verified.valid){await recordSecurityEvent("mfa_verification_failed",{severity:"watch",metadata:{stage:"enrollment"}}).catch(()=>undefined);return Response.json({error:"That authenticator code is not valid"},{status:401});}
 const recoveryCodes=generateRecoveryCodes(10);const hashes=recoveryCodes.map(hashRecoveryCode);await db()`UPDATE app_users SET mfa_enrolled_at=NOW(),updated_at=NOW() WHERE id=${profile.id} AND mfa_enrolled_at IS NULL`;for(const hash of hashes)await db()`INSERT INTO mfa_recovery_codes(user_id,code_hash) VALUES(${profile.id},${hash})`;const accepted=await markSessionMfaVerified(profile,"totp",verified.counter);if(!accepted)throw new Error("Could not establish MFA session");await recordSecurityEvent("mfa_enrollment_completed",{metadata:{recoveryCodeCount:10}});return Response.json({ok:true,recoveryCodes},{headers:{"Cache-Control":"no-store"}});
 }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
