// AgentMail outreach adapter. Never sends without explicit server-side enablement.
// Keep endpoint admin-only; prospective leads must be opted-in or approved after human review.
const API = 'https://api.agentmail.to/v0';
const MAX_DAILY = 20;
const MAX_MONTHLY = 1800;
const allowed = new Set(['properties', 'creators', 'business']);
const emailOk = s => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
const utcDay = () => new Date().toISOString().slice(0,10);
const utcMonth = () => utcDay().slice(0,7);
const reply = (obj, status=200) => new Response(JSON.stringify(obj), {status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function digest(value) {
  const bytes = new TextEncoder().encode(value.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const getCount = async (kv,key) => Number(await kv.get(key)||0);
export async function handleAgentMail(request, env) {
  if (request.method !== 'POST') return reply({error:'method_not_allowed'},405);
  const token = request.headers.get('authorization');
  if (!env.AGENTMAIL_ADMIN_TOKEN || token !== 'Bearer ' + env.AGENTMAIL_ADMIN_TOKEN) return reply({error:'unauthorized'},401);
  if (!env.RW_KV) return reply({error:'kv_required'},503);
  let data;
  try { data = await request.json(); } catch { return reply({error:'invalid_json'},400); }
  const category=String(data.category||'');
  const to=String(data.to||'').trim();
  if (!allowed.has(category) || !emailOk(to) || typeof data.subject!=='string' || typeof data.text!=='string' ||
      data.subject.length>160 || data.text.length>6000 || !data.subject.trim() || !data.text.trim())
    return reply({error:'invalid_request'},400);
  if (data.optIn!==true || data.humanApproved!==true || data.suppressed!==false)
    return reply({error:'recipient_must_be_opted_in_and_human_approved_and_not_suppressed'},403);
  const id=await digest(to);
  if (await env.RW_KV.get('agentmail:suppress:'+id)) return reply({error:'suppressed'},403);
  const inbox = ({properties:env.AGENTMAIL_INBOX_PROPERTIES,creators:env.AGENTMAIL_INBOX_CREATORS,business:env.AGENTMAIL_INBOX_BUSINESS})[category];
  if (!inbox) return reply({error:'inbox_not_configured',category},503);
  const dayKey='agentmail:sent:day:'+utcDay();
  const monthKey='agentmail:sent:month:'+utcMonth();
  const day=await getCount(env.RW_KV,dayKey), month=await getCount(env.RW_KV,monthKey);
  const duplicate=await env.RW_KV.get('agentmail:contact:'+category+':'+id);
  const preview={category,to,subject:data.subject,day,month,willSend: env.AGENTMAIL_SEND_ENABLED==='true' && data.send===true};
  if (duplicate) return reply({error:'already_contacted',preview},409);
  if (!preview.willSend) return reply({mode:'preview',...preview});
  if (!env.AGENTMAIL_API_KEY) return reply({error:'api_key_not_configured'},503);
  if (day>=MAX_DAILY || month>=MAX_MONTHLY) return reply({error:'campaign_limit_reached',day,month},429);
  // Coarse advisory concurrency guard: isolate sending to a single administrative process.
  // Counters in KV are not atomic: do not run concurrent dispatchers. For production volume,
  // replace with a Durable Object coordinator before enabling unattended sends.
  if (env.AGENTMAIL_AUTOMATED_SEND==='true') return reply({error:'unattended_sending_not_supported'},409);
  const response=await fetch(API+'/inboxes/'+encodeURIComponent(inbox)+'/messages/send',{
    method:'POST',headers:{authorization:'Bearer '+env.AGENTMAIL_API_KEY,'content-type':'application/json'},
    body:JSON.stringify({to:[to],subject:data.subject,text:data.text})
  });
  if (!response.ok) return reply({error:'agentmail_send_failed',status:response.status},502);
  await Promise.all([
    env.RW_KV.put(dayKey,String(day+1),{expirationTtl:60*60*24*3}),
    env.RW_KV.put(monthKey,String(month+1),{expirationTtl:60*60*24*40}),
    env.RW_KV.put('agentmail:contact:'+category+':'+id,new Date().toISOString(),{expirationTtl:60*60*24*180})
  ]);
  return reply({sent:true,category,day:day+1,month:month+1});
}
export async function suppressAgentMailRecipient(email, env) {
  if (!emailOk(email)||!env.RW_KV) return false;
  await env.RW_KV.put('agentmail:suppress:'+await digest(email),'true');
  return true;
}
