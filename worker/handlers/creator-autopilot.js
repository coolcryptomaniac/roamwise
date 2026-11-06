/* Cloudflare runtime for Creator Autopilot.
 * Uses KV for a bounded, privacy-safe heartbeat. No Gmail/Firestore secrets,
 * no customer content in KV, no sending or payments.
 */
import {triageInbox,maintenanceReport} from '../lib/creator-inbox-triage.mjs';
import {planOutreach} from '../lib/creator-autopilot-core.mjs';
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
   let data={};try{data=await request.json()}catch{return reply({error:'invalid_json'},400)}
   if(data.action==='triage'){
     if(!Array.isArray(data.messages)||data.messages.length>100)return reply({error:'max_100_messages'},400);
     return reply({mode:'read_only',results:triageInbox(data.messages.map(m=>({id:m.id,subject:m.subject,snippet:m.snippet}))),sent:0});
   }
   if(data.action==='plan'){
     if(!Array.isArray(data.creators)||!Array.isArray(data.properties)||data.creators.length>100||data.properties.length>100)return reply({error:'max_100_records_per_type'},400);
     const plan=planOutreach(data.creators,data.properties,Array.isArray(data.history)?data.history.slice(0,500):[]);
     return reply({mode:'draft_only',plan});
   }
   if(data.action==='maintenance'){
     if(!Array.isArray(data.creators)||!Array.isArray(data.properties)||data.creators.length>100||data.properties.length>100)return reply({error:'max_100_records_per_type'},400);
     return reply({mode:'read_only',report:maintenanceReport({creators:data.creators,properties:data.properties,outbox:Array.isArray(data.outbox)?data.outbox.slice(0,100):[]})});
   }
   if(data.action!=='run')return reply({error:'unknown_action'},400);
   const result=await runCreatorAutopilot(env);
   return reply(result,result.ok?200:503);
 }
 return reply({error:'method_not_allowed'},405);
}
