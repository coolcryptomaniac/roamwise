/* Cloudflare runtime for Creator Autopilot.
 * Uses KV for a bounded, privacy-safe heartbeat. No Gmail/Firestore secrets,
 * no customer content in KV, no sending or payments.
 */
import {triageInbox,maintenanceReport} from '../lib/creator-inbox-triage.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const prefix='creator-autopilot:';
function authorized(request,env){
 const token=request.headers.get('authorization')||'';
 return !!env.AGENTMAIL_ADMIN_TOKEN && token==='Bearer '+env.AGENTMAIL_ADMIN_TOKEN;
}
export async function runCreatorAutopilot(env,now=new Date()){
 if(!env.RW_KV)return {ok:false,error:'kv_not_configured'};
 if(env.CREATOR_AUTOPILOT_ENABLED!=='true')return {ok:false,error:'disabled'};
 const report={version:1,mode:'observe_only',runAt:now.toISOString(),
  integrations:{cloudflareKV:true,gmail:false,agentmailSender:false,firebase:false,github:false},
  inbox:{processed:0},maintenance:{},outreach:{sent:0,proposals:0},
  safeguards:{humanApproval:true,autonomousPayments:false,autonomousSends:false}};
 // No source connectors are silently assumed. The report explicitly reflects missing integrations.
 await env.RW_KV.put(prefix+'last-report',JSON.stringify(report),{expirationTtl:60*60*24*14});
 return {ok:true,report};
}
export async function handleCreatorAutopilot(request,env){
 if(!authorized(request,env))return reply({error:'unauthorized'},401);
 if(!env.RW_KV)return reply({error:'kv_not_configured'},503);
 if(request.method==='GET'){
   const last=await env.RW_KV.get(prefix+'last-report','json');
   return reply({enabled:env.CREATOR_AUTOPILOT_ENABLED==='true',report:last||null});
 }
 if(request.method==='POST'){
   // Manual run is an observe-only report. No sends, database changes or AI calls.
   const result=await runCreatorAutopilot(env);
   return reply(result,result.ok?200:503);
 }
 return reply({error:'method_not_allowed'},405);
}
