import { z } from "zod";
import { requireIdentityApiProfile } from "@/lib/access-control";
import { recordSecurityEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { decryptMfaSecret, hashRecoveryCode, markSessionMfaVerified, normalizeRecoveryCode, verifyTotp } from "@/lib/mfa";
import { consumeRateLimit, enforceSameOrigin, rateLimitResponse, readJsonWithLimit, requestParseError } from "@/lib/http-security";
const schema=z.object({code:z.string().min(6).max(32).transform(v=>v.trim())});
export async function POST(req:Request){
 const same=enforceSameOrigin(req);if(same)return same;const access=await requireIdentityApiProfile("/api/security/reverify");if("response" in access)return access.response;const profile=access.profile;if(!profile.mfa_enabled)return Response.json({error:"MFA setup required",code:"MFA_SETUP_REQUIRED"},{status:428});const rate=await consumeRateLimit("dash-mfa-verify",8,300,"user");if(!rate.allowed)return rateLimitResponse(rate.retryAfter);
 try{const parsed=schema.safeParse(await readJsonWithLimit(req,1024));if(!parsed.success)return Response.json({error:"Enter your authenticator or recovery code"},{status:400});const rows=await db()`SELECT mfa_secret_encrypted FROM app_users WHERE id=${profile.id} AND mfa_enrolled_at IS NOT NULL LIMIT 1`;const encrypted=String(rows[0]?.mfa_secret_encrypted||"");if(!encrypted)return Response.json({error:"MFA setup required"},{status:428});const code=parsed.data.code;const totp=verifyTotp(decryptMfaSecret(encrypted),code);if(totp.valid){const accepted=await markSessionMfaVerified(profile,"totp",totp.counter);if(!accepted)return Response.json({error:"That code was already used. Wait for the next code."},{status:409});await recordSecurityEvent("mfa_verification_success");return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});}
 const normalized=normalizeRecoveryCode(code);if(normalized.length===10){const used=await db()`UPDATE mfa_recovery_codes SET used_at=NOW() WHERE user_id=${profile.id} AND code_hash=${hashRecoveryCode(normalized)} AND used_at IS NULL RETURNING id`;if(used.length===1){await markSessionMfaVerified(profile,"recovery");await recordSecurityEvent("mfa_recovery_code_used",{severity:"watch"});return Response.json({ok:true,recoveryCodeUsed:true},{headers:{"Cache-Control":"no-store"}});}}
 await recordSecurityEvent("mfa_verification_failed",{severity:"watch"}).catch(()=>undefined);return Response.json({error:"Invalid verification code"},{status:401,headers:{"Cache-Control":"no-store"}});
 }catch(error){const response=requestParseError(error);if(response)return response;throw error;}
}
