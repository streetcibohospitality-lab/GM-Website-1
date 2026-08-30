"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function MfaVerificationForm({nextPath="/overview"}:{nextPath?:string}){
 const router=useRouter();const[code,setCode]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const verify=async()=>{setBusy(true);setError("");try{const r=await fetch("/api/security/reverify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Verification failed");router.replace(nextPath);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Verification failed");}finally{setBusy(false);}};
 return <div className="verify-form"><label className="secure-field"><span>AUTHENTICATOR / RECOVERY CODE</span><input autoFocus autoCapitalize="characters" autoComplete="one-time-code" maxLength={16} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,16))} placeholder="Enter code" onKeyDown={e=>{if(e.key==="Enter"&&code.length>=6&&!busy)void verify();}}/></label><button className="command-button full" disabled={busy||code.length<6} onClick={()=>void verify()}>{busy?"VERIFYING…":"VERIFY SECURE SESSION"} <span>→</span></button>{error&&<small className="auth-error">{error}</small>}</div>;
}
