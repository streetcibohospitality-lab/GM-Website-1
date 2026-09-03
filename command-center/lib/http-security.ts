import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export class PayloadTooLargeError extends Error{}
export class InvalidJsonError extends Error{}
export function enforceSameOrigin(req:Request){
  const origin=req.headers.get("origin"); const secFetchSite=req.headers.get("sec-fetch-site"); const requestOrigin=new URL(req.url).origin;
  if(origin&&origin!==requestOrigin) return Response.json({error:"Cross-origin request blocked"},{status:403});
  if(secFetchSite&&!['same-origin','none'].includes(secFetchSite)) return Response.json({error:"Cross-site request blocked"},{status:403});
  return null;
}
export async function readJsonWithLimit<T=unknown>(req:Request,maxBytes:number):Promise<T>{
  const length=Number(req.headers.get("content-length")||"0"); if(Number.isFinite(length)&&length>maxBytes) throw new PayloadTooLargeError();
  if(!req.body) return {} as T; const reader=req.body.getReader();const chunks:Uint8Array[]=[];let total=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;if(!value)continue;total+=value.byteLength;if(total>maxBytes){await reader.cancel().catch(()=>undefined);throw new PayloadTooLargeError();}chunks.push(value);}}finally{reader.releaseLock();}
  const merged=new Uint8Array(total);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}const text=new TextDecoder().decode(merged);if(!text.trim())return {} as T;try{return JSON.parse(text) as T;}catch{throw new InvalidJsonError();}
}
export async function consumeRateLimit(namespace:string,limit:number,windowSeconds:number,scope:"session"|"user"="session"){
  const {userId,sessionId}=await auth();if(!userId)return{allowed:false,remaining:0,retryAfter:windowSeconds};const key=scope==="user"?`${namespace}:${userId}:user`:`${namespace}:${userId}:${sessionId||"none"}`;
  const rows=await db()`INSERT INTO rate_limit_buckets(bucket_key,window_started_at,request_count,updated_at) VALUES(${key},NOW(),1,NOW()) ON CONFLICT(bucket_key) DO UPDATE SET request_count=CASE WHEN rate_limit_buckets.window_started_at<=NOW()-(${windowSeconds}*INTERVAL '1 second') THEN 1 ELSE rate_limit_buckets.request_count+1 END,window_started_at=CASE WHEN rate_limit_buckets.window_started_at<=NOW()-(${windowSeconds}*INTERVAL '1 second') THEN NOW() ELSE rate_limit_buckets.window_started_at END,updated_at=NOW() RETURNING request_count,GREATEST(1,CEIL(EXTRACT(EPOCH FROM(window_started_at+(${windowSeconds}*INTERVAL '1 second')-NOW())))::int) AS retry_after`;
  const count=Number(rows[0]?.request_count||1);return{allowed:count<=limit,remaining:Math.max(0,limit-count),retryAfter:Number(rows[0]?.retry_after||windowSeconds)};
}
export function rateLimitResponse(retryAfter:number){return Response.json({error:"Too many requests"},{status:429,headers:{"Retry-After":String(Math.max(1,retryAfter)),"Cache-Control":"no-store"}});}
export function requestParseError(error:unknown){if(error instanceof PayloadTooLargeError)return Response.json({error:"Request body too large"},{status:413});if(error instanceof InvalidJsonError)return Response.json({error:"Invalid JSON"},{status:400});return null;}
export function internalApiError(error:unknown,message:string,code:string,status=500){
  console.error(`GM API error [${code}]`,error);
  return Response.json({error:message,code},{status,headers:{"Cache-Control":"no-store"}});
}
