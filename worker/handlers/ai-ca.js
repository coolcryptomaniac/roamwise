/* ============================================================================
   worker/handlers/ai-ca.js — POST /admin/ai-ca/review
   Admin-only compliance review. The browser sends a redacted deterministic
   summary, never raw statements or identity documents. Provider secrets remain
   Worker secrets.
   ========================================================================= */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc } from '../lib/firestore-rest.js';

const MAX_SUMMARY=11000,MAX_QUESTION=1200;
const SYSTEM=[
  'You are the RoamWise Finance & Compliance Copilot (AI CA).',
  'You are an internal research assistant, not a chartered accountant, auditor, lawyer, bank officer or government authority.',
  'Use the deterministic facts supplied by RoamWise as the source of truth. Do not infer missing turnover, registration, tax rates, entity status or filings.',
  'For Indian GST/income-tax claims, prefer current official Government of India sources (CBIC/GST Portal/Income Tax Department) and include the URL or say verify with CA if uncertain.',
  'Separate RoamWise own revenue from hotel booking GMV, taxes collected for government, refundable deposits and amounts belonging to properties.',
  'Never recommend hiding turnover, splitting transactions to avoid registration, backdating documents, fake invoices, fabricated expenses, using personal accounts to conceal business activity, or collecting GST without valid registration.',
  'Do not file, submit, sign, pay tax or change bank/payment settings.',
  'Produce: current operating mode; hard stops; evidence missing; tax/accounting questions for a part-time CA; exact next actions in priority order; official-source links to re-check.',
  'Keep the answer concise and explicitly identify any issue that depends on transaction-specific facts.'
].join('\n');

async function requireAdmin(request,env){
  let sa;
  try{sa=parseServiceAccount(env);}catch(e){return{error:json({error:'not_configured',message:'Firebase service-account secret is required.'},501)}}
  const auth=request.headers.get('authorization')||'';
  const m=/^Bearer\s+(.+)$/i.exec(auth);
  if(!m)return{error:json({error:'unauthorized',message:'Sign in to RoamWise Admin.'},401)};
  let claims;
  try{claims=await verifyFirebaseIdToken(m[1],sa.project_id);}catch(e){return{error:json({error:'unauthorized',message:'Admin sign-in expired.'},401)}}
  const accessToken=await getServiceAccountAccessToken(env);
  const admin=await getDoc(env,accessToken,sa.project_id,'admins/'+claims.uid);
  if(!admin)return{error:json({error:'forbidden',message:'Founder/admin access required.'},403)};
  return{uid:claims.uid};
}
function validate(body){
  if(!body||typeof body!=='object')return'Missing JSON body.';
  if(typeof body.summary!=='string'||!body.summary.trim()||body.summary.length>MAX_SUMMARY)return'summary must be 1-'+MAX_SUMMARY+' characters';
  if(body.question!=null&&(typeof body.question!=='string'||body.question.length>MAX_QUESTION))return'question must be under '+MAX_QUESTION+' characters';
  return null;
}
async function rateLimited(uid){
  try{
    const bucket=Math.floor(Date.now()/600000);
    const key=new Request('https://rl.invalid/ai-ca/'+uid+'/'+bucket);
    const cache=caches.default;
    const old=await cache.match(key);
    const used=old?Number(await old.text())||0:0;
    if(used>=6)return true;
    await cache.put(key,new Response(String(used+1),{headers:{'Cache-Control':'max-age=600'}}));
    return false;
  }catch(e){return false}
}
function prompt(body){
  return body.summary+'\n\nAdditional founder question: '+String(body.question||'Review the current compliance position and next actions.').slice(0,MAX_QUESTION);
}
function extractOpenAI(data){
  if(data&&typeof data.output_text==='string')return data.output_text.trim();
  const out=(data&&data.output)||[];
  let text='';
  out.forEach(function(item){(item&&item.content||[]).forEach(function(c){if(c&&typeof c.text==='string')text+=c.text;});});
  return text.trim();
}
async function callOpenAI(env,input){
  if(!env.OPENAI_API_KEY||!env.OPENAI_MODEL)return null;
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:env.OPENAI_MODEL,instructions:SYSTEM,input:input,max_output_tokens:1400})
  });
  const d=await r.json().catch(function(){return{};});
  if(!r.ok)throw new Error('OpenAI review failed: '+((d&&d.error&&d.error.message)||r.status));
  return{text:extractOpenAI(d),provider:'openai',model:env.OPENAI_MODEL};
}
async function callAnthropic(env,input){
  if(!env.ANTHROPIC_API_KEY||!env.ANTHROPIC_MODEL)return null;
  const r=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
    body:JSON.stringify({model:env.ANTHROPIC_MODEL,max_tokens:1400,system:SYSTEM,messages:[{role:'user',content:input}]})
  });
  const d=await r.json().catch(function(){return{};});
  if(!r.ok)throw new Error('Anthropic review failed: '+((d&&d.error&&d.error.message)||r.status));
  return{text:(d.content||[]).filter(function(x){return x.type==='text';}).map(function(x){return x.text;}).join('\n').trim(),provider:'anthropic',model:env.ANTHROPIC_MODEL};
}
async function callGroq(env,input){
  if(!env.GROQ_API_KEY||!env.GROQ_MODEL)return null;
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Authorization':'Bearer '+env.GROQ_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:env.GROQ_MODEL,max_tokens:1400,messages:[{role:'system',content:SYSTEM},{role:'user',content:input}]})
  });
  const d=await r.json().catch(function(){return{};});
  if(!r.ok)throw new Error('Managed AI review failed: '+((d&&d.error&&d.error.message)||r.status));
  return{text:((((d||{}).choices||[])[0]||{}).message||{}).content?.trim()||'',provider:'groq',model:env.GROQ_MODEL};
}
async function review(env,input,preferred){
  const order=preferred==='anthropic'?['anthropic','openai','groq']:preferred==='groq'?['groq','openai','anthropic']:['openai','anthropic','groq'];
  let last=null;
  for(const p of order){
    try{
      const r=p==='openai'?await callOpenAI(env,input):p==='anthropic'?await callAnthropic(env,input):await callGroq(env,input);
      if(r&&r.text)return r;
    }catch(e){last=e;}
  }
  if(last)throw last;
  throw new Error('No AI CA provider is configured. Set a Worker secret/model for OpenAI, Anthropic or Groq.');
}
export async function handleAICAReview(request,env){
  const auth=await requireAdmin(request,env);
  if(auth.error)return auth.error;
  if(await rateLimited(auth.uid))return json({error:'rate_limited',message:'AI CA review limit reached for this 10-minute window.'},429);
  let body;
  try{body=await request.json();}catch(e){return json({error:'bad_request',message:'Invalid JSON body.'},400)}
  const err=validate(body);
  if(err)return json({error:'bad_request',message:err},400);
  try{
    const out=await review(env,prompt(body),String(env.AI_CA_PROVIDER||'auto').toLowerCase());
    return json({ok:true,text:out.text,provider:out.provider,model:out.model,advisory:true});
  }catch(e){
    return json({error:'ai_ca_unavailable',message:String(e.message||e).slice(0,240)},503);
  }
}
