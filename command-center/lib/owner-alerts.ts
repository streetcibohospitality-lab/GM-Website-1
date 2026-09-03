import "server-only";
import type { Profile } from "@/lib/types";

function recipients(){return String(process.env.GM_DASH_OWNER_ALERT_EMAIL_TO||"").split(",").map(v=>v.trim()).filter(Boolean).slice(0,10);}
function safe(value:unknown,max=300){if(value==null)return"";if(typeof value==="string")return value.slice(0,max);if(typeof value==="number"||typeof value==="boolean")return String(value);try{return JSON.stringify(value).slice(0,max);}catch{return"";}}
export async function sendOwnerSecurityAlert(options:{title:string;type:string;profile:Profile;sessionId?:string;path?:string;metadata?:Record<string,unknown>}){
  const to=recipients();const key=String(process.env.RESEND_API_KEY||"").trim();const from=String(process.env.GM_DASH_OWNER_ALERT_EMAIL_FROM||"").trim();
  if(!to.length||!key||!from)return{delivered:false,reason:"email_not_configured" as const};
  const details=Object.entries(options.metadata||{}).slice(0,20).map(([k,v])=>`${k}: ${safe(v)}`).join("\n");
  const text=["Grub Monkeys Command Center security alert","",options.title,`Type: ${options.type}`,`User: ${options.profile.display_name}`,`Email: ${options.profile.email}`,`Role: ${options.profile.role}`,options.sessionId?`Session: ${options.sessionId}`:"",options.path?`Path: ${options.path}`:"",details?`\nDetails:\n${details}`:"","Generated: "+new Date().toISOString()].filter(Boolean).join("\n");
  try{const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({from,to,subject:`[GM Command Center] ${options.title}`.slice(0,180),text}),signal:AbortSignal.timeout(4000),cache:"no-store"});return{delivered:response.ok,reason:response.ok?"sent" as const:`provider_${response.status}`};}catch{return{delivered:false,reason:"provider_unavailable" as const};}
}
