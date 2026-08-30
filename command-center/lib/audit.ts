import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getCurrentProfileForAudit } from "@/lib/authz";
import { requestMeta } from "@/lib/request-meta";

async function auditIdentity() {
  const { userId, sessionId } = await auth();
  if (!userId || !sessionId) return null;
  try {
    const profile = await getCurrentProfileForAudit();
    return {
      sessionId,
      clerkUserId: userId,
      userId: profile.id as string | null,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
    };
  } catch {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email || userId;
    return { sessionId, clerkUserId: userId, userId: null as string | null, email, displayName, role: null as string | null };
  }
}

export async function recordSessionEvent(eventType: "login" | "logout" | "access_denied", options: { path?: string; reason?: string; metadata?: Record<string, unknown> } = {}) {
  const identity = await auditIdentity();
  if (!identity) return;
  const meta = await requestMeta();
  const payload = JSON.stringify({ path: options.path || "", reason: options.reason || "", country: meta.country, ...(options.metadata || {}) });
  if (eventType === "access_denied") {
    const bucket = `dash-access-denied:${identity.clerkUserId}:${identity.sessionId}`;
    await db()`
      WITH bucket AS (
        INSERT INTO rate_limit_buckets(bucket_key,window_started_at,request_count,updated_at)
        VALUES(${bucket},NOW(),1,NOW())
        ON CONFLICT(bucket_key) DO UPDATE SET
          request_count=CASE WHEN rate_limit_buckets.window_started_at<=NOW()-INTERVAL '60 seconds' THEN 1 ELSE rate_limit_buckets.request_count+1 END,
          window_started_at=CASE WHEN rate_limit_buckets.window_started_at<=NOW()-INTERVAL '60 seconds' THEN NOW() ELSE rate_limit_buckets.window_started_at END,
          updated_at=NOW()
        RETURNING request_count
      )
      INSERT INTO access_logs(session_id,user_id,clerk_user_id,email,display_name,role,event_type,request_id,metadata)
      SELECT ${identity.sessionId},${identity.userId},${identity.clerkUserId},${identity.email},${identity.displayName},${identity.role},${eventType},${meta.requestId},${payload}::jsonb
      FROM bucket WHERE request_count<=20
    `;
    return;
  }
  await db()`
    INSERT INTO access_logs(session_id,user_id,clerk_user_id,email,display_name,role,event_type,request_id,metadata)
    VALUES(${identity.sessionId},${identity.userId},${identity.clerkUserId},${identity.email},${identity.displayName},${identity.role},${eventType},${meta.requestId},${payload}::jsonb)
    ON CONFLICT DO NOTHING
  `;
}

export type SecuritySeverity = "info" | "watch" | "high" | "critical";
export async function recordSecurityEvent(eventType: string, options: { severity?: SecuritySeverity; metadata?: Record<string, unknown> } = {}) {
  const identity = await auditIdentity();
  if (!identity) return;
  const meta = await requestMeta();
  await db()`
    INSERT INTO security_events(user_id,event_type,severity,session_id,ip_hash,user_agent_hash,metadata)
    VALUES(
      ${identity.userId},${eventType},${options.severity || "info"},${identity.sessionId},${meta.ipHash},${meta.userAgentHash},
      ${JSON.stringify({ clerkUserId: identity.clerkUserId, email: identity.email, country: meta.country, requestId: meta.requestId, ...(options.metadata || {}) })}::jsonb
    )
  `;
}

export async function recordBusinessAudit(input:{actorUserId:string;action:string;entityType:string;entityId:string;outletId?:string|null;oldValues?:unknown;newValues?:unknown;metadata?:Record<string,unknown>}){
  const meta=await requestMeta();
  await db()`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,outlet_id,request_id,old_values,new_values,metadata)
    VALUES(${input.actorUserId},${input.action},${input.entityType},${input.entityId},${input.outletId||null},${meta.requestId},${input.oldValues?JSON.stringify(input.oldValues):null}::jsonb,${input.newValues?JSON.stringify(input.newValues):null}::jsonb,${JSON.stringify(input.metadata||{})}::jsonb)`;
}
