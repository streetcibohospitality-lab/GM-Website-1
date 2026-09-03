import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { Profile } from "@/lib/types";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const APP_MFA_MAX_AGE_SECONDS = 8 * 60 * 60;
const SENSITIVE_MFA_MAX_AGE_SECONDS = 10 * 60;

function encryptionKey() {
  const raw = process.env.GM_DASH_MFA_ENCRYPTION_KEY || "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("GM_DASH_MFA_ENCRYPTION_KEY must decode to exactly 32 bytes");
  return key;
}

function base32Encode(input: Buffer) {
  const bits = Array.from(input, (byte) => byte.toString(2).padStart(8, "0")).join("");
  let out = "";
  for (let i=0;i<bits.length;i+=5) out += BASE32[Number.parseInt(bits.slice(i,i+5).padEnd(5,"0"),2)];
  return out;
}
function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bits = Array.from(clean, (char) => {
    const index=BASE32.indexOf(char); if(index<0) throw new Error("Invalid Base32 secret");
    return index.toString(2).padStart(5,"0");
  }).join("");
  const bytes:number[]=[];
  for(let i=0;i+8<=bits.length;i+=8) bytes.push(Number.parseInt(bits.slice(i,i+8),2));
  return Buffer.from(bytes);
}
export function generateTotpSecret(){ return base32Encode(randomBytes(20)); }
export function encryptMfaSecret(secret:string){
  const iv=randomBytes(12); const cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);
  const ciphertext=Buffer.concat([cipher.update(secret,"utf8"),cipher.final()]); const tag=cipher.getAuthTag();
  return ["v1",iv.toString("base64url"),ciphertext.toString("base64url"),tag.toString("base64url")].join(":");
}
export function decryptMfaSecret(value:string){
  const [version,ivRaw,cipherRaw,tagRaw]=value.split(":");
  if(version!=="v1"||!ivRaw||!cipherRaw||!tagRaw) throw new Error("Invalid encrypted MFA secret");
  const decipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(ivRaw,"base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw,"base64url"));
  return Buffer.concat([decipher.update(Buffer.from(cipherRaw,"base64url")),decipher.final()]).toString("utf8");
}
function totpForCounter(secret:string,counter:number){
  const key=base32Decode(secret); const buf=Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const digest=createHmac("sha1",key).update(buf).digest(); const offset=digest[digest.length-1]&0x0f;
  const binary=((digest[offset]&0x7f)<<24)|((digest[offset+1]&0xff)<<16)|((digest[offset+2]&0xff)<<8)|(digest[offset+3]&0xff);
  return String(binary%1_000_000).padStart(6,"0");
}
export function verifyTotp(secret:string,code:string,now=Date.now()){
  const normalized=code.replace(/\s+/g,""); if(!/^\d{6}$/.test(normalized)) return {valid:false as const,counter:null};
  const current=Math.floor(now/1000/30); const provided=Buffer.from(normalized);
  for(const drift of [-1,0,1]){ const counter=current+drift; const expected=Buffer.from(totpForCounter(secret,counter)); if(expected.length===provided.length&&timingSafeEqual(expected,provided)) return {valid:true as const,counter}; }
  return {valid:false as const,counter:null};
}
export function buildOtpAuthUri(secret:string,email:string){
  const issuer="GM Command Center"; const label=`${issuer}:${email}`;
  const params=new URLSearchParams({secret,issuer,algorithm:"SHA1",digits:"6",period:"30"});
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
const RECOVERY_ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateRecoveryCodes(count=10){return Array.from({length:count},()=>{const bytes=randomBytes(10);let raw="";for(let i=0;i<10;i++)raw+=RECOVERY_ALPHABET[bytes[i]%RECOVERY_ALPHABET.length];return `${raw.slice(0,5)}-${raw.slice(5)}`;});}
export function normalizeRecoveryCode(code:string){return code.toUpperCase().replace(/[^A-Z0-9]/g,"");}
export function hashRecoveryCode(code:string){const pepper=createHmac("sha256",encryptionKey()).update("gm-command-recovery-v1").digest();return createHmac("sha256",pepper).update(normalizeRecoveryCode(code)).digest("hex");}
export function requiresAppMfa(_profile:Profile){return true;}

export async function ensureEnrollmentSecret(profile: Profile){
  const rows=await db()`SELECT mfa_secret_encrypted,mfa_enrolled_at FROM app_users WHERE id=${profile.id} LIMIT 1`;
  const row=rows[0] as {mfa_secret_encrypted?:string|null;mfa_enrolled_at?:string|null}|undefined;
  if(!row) throw new Error("User profile not found"); if(row.mfa_enrolled_at) throw new Error("MFA already enrolled");
  if(row.mfa_secret_encrypted) return decryptMfaSecret(row.mfa_secret_encrypted);
  const secret=generateTotpSecret(); const encrypted=encryptMfaSecret(secret);
  await db()`UPDATE app_users SET mfa_secret_encrypted=${encrypted},updated_at=NOW() WHERE id=${profile.id} AND mfa_enrolled_at IS NULL`;
  return secret;
}
export async function hasRecentMfaVerification(maxAgeSeconds=APP_MFA_MAX_AGE_SECONDS){
  const {userId,sessionId}=await auth(); if(!userId||!sessionId) return false;
  const rows=await db()`SELECT 1 FROM mfa_session_verifications v JOIN app_users u ON u.id=v.user_id WHERE u.clerk_user_id=${userId} AND v.session_id=${sessionId} AND v.verified_at>=NOW()-(${maxAgeSeconds}*INTERVAL '1 second') AND v.expires_at>NOW() LIMIT 1`;
  return rows.length>0;
}
export async function hasFreshFinancialMfa(){return hasRecentMfaVerification(SENSITIVE_MFA_MAX_AGE_SECONDS);}
export async function markSessionMfaVerified(profile:Profile,method:"totp"|"recovery",counter:number|null=null){
  const {sessionId}=await auth(); if(!sessionId) throw new Error("Unauthenticated");
  const expires=new Date(Date.now()+APP_MFA_MAX_AGE_SECONDS*1000).toISOString();
  const rows=await db()`
    INSERT INTO mfa_session_verifications(user_id,session_id,verified_at,expires_at,verification_method,last_totp_counter,updated_at)
    VALUES(${profile.id},${sessionId},NOW(),${expires},${method},${counter},NOW())
    ON CONFLICT(user_id,session_id) DO UPDATE SET verified_at=NOW(),expires_at=EXCLUDED.expires_at,verification_method=EXCLUDED.verification_method,last_totp_counter=CASE WHEN EXCLUDED.last_totp_counter IS NULL THEN mfa_session_verifications.last_totp_counter ELSE EXCLUDED.last_totp_counter END,updated_at=NOW()
    WHERE EXCLUDED.last_totp_counter IS NULL OR mfa_session_verifications.last_totp_counter IS NULL OR mfa_session_verifications.last_totp_counter<EXCLUDED.last_totp_counter
    RETURNING id
  `;
  return rows.length===1;
}
export const mfaMaxAges={appSeconds:APP_MFA_MAX_AGE_SECONDS,financeSeconds:SENSITIVE_MFA_MAX_AGE_SECONDS};
