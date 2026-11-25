import { json } from '../lib/http.js';
import { parseServiceAccount } from '../lib/service-account.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { matchFacts, factsBlock, directFactAnswer, guardAnswer } from '../lib/tusk-facts.js';
import { workersAIText } from './ai.js';
import { BASIC_AI_MODEL, BASIC_AI_OUTPUT_TOKENS, BASIC_AI_SYSTEM, basicAIAccount,
  basicAIConfig, basicAIReservation, basicAIActualUsage } from '../lib/basic-ai-policy.js';

const MESSAGES={
  daily_limit:'Today\'s included AI answers are used. Search and saved guides still work. The allowance resets at 05:30 IST.',
  shared_budget:'Today\'s shared AI pool is used. Search and saved guides still work. Please try again after 05:30 IST.',
  slow_down:'Please wait a minute before asking Ailon again.',
  busy:'Ailon is busy. Please try again in a minute.',
  retry_limit:'Several AI attempts failed today. Please use search and saved guides until the allowance resets.',
};
function reply(data,status=200){const r=json(data,status);r.headers.set('Cache-Control','private, no-store');return r;}
async function hash(value){
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
}
async function readBody(request){
  const reader=request.body?.getReader();if(!reader)return {};
  const chunks=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
    if(length>12000){await reader.cancel();throw new Error('request_too_large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
function publicQuota(q){return {remaining:q.remaining,limit:q.limit,used:q.used,period:q.period,resetsAt:q.resetsAt};}

export async function handleBasicAI(request,env,deps={}){
  const cfg=basicAIConfig(env);
  if(!cfg.enabled) return reply({error:'basic_ai_disabled',message:'Included AI is not enabled yet. Search and guides still work.'},503);
  if(!env.AI?.run||!env.BASIC_AI_QUOTA?.idFromName||!env.BASIC_AI_QUOTA?.get)
    return reply({error:'basic_ai_unconfigured',message:'Included AI is being configured. Search and guides still work.'},503);
  let claims;
  try{
    const token=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')||'')?.[1];
    if(!token) return reply({error:'sign_in_required',message:'Sign in to use your included daily AI answers. No API key is needed.'},401);
    const sa=parseServiceAccount(env);
    claims=await (deps.verify||verifyFirebaseIdToken)(token,sa.project_id);
  }catch(e){return reply({error:'unauthorized',message:'Please sign in again.'},401);}
  if(!basicAIAccount(claims)) return reply({error:'verified_account_required',message:'Use a verified email or phone account for included AI answers.'},403);
  const uid=await hash(claims.uid), day=new Date().toISOString().slice(0,10);
  const meter=env.BASIC_AI_QUOTA.get(env.BASIC_AI_QUOTA.idFromName('basic-v1:'+day));
  const quota=async data=>{
    const r=await meter.fetch('https://quota.internal/',{method:'POST',body:JSON.stringify({uid,...data})});
    if(!r.ok) throw new Error('quota_unavailable');return r.json();
  };
  try{
    if(request.method==='GET'){
      const q=await quota({op:'status'});return reply({...publicQuota(q),model:BASIC_AI_MODEL,sharedPool:true});
    }
    if(request.method!=='POST') return reply({error:'method_not_allowed'},405);
    let body;
    try{body=await readBody(request);}catch(e){return reply({error:e.message==='request_too_large'?'request_too_large':'invalid_json'},e.message==='request_too_large'?413:400);}
    const prompt=typeof body?.prompt==='string'?body.prompt.trim():'';
    if(!prompt||prompt.length>4000) return reply({error:'invalid_prompt',message:'Please keep your question and context within 4,000 characters.'},400);
    const facts=matchFacts(prompt), direct=directFactAnswer(prompt,facts);
    if(direct) return reply({text:direct.text,route:'verified-facts',cached:true,period:'day'});
    const messages=[{role:'system',content:BASIC_AI_SYSTEM},{role:'user',content:
      (facts.length?factsBlock(facts).slice(0,2000)+'\n\n':'')+prompt}];
    // Exact, per-user cache only: personal trip prompts never become another
    // traveller's answers. No prompt, token or raw UID in a cache URL or log.
    const cache=deps.cache||(typeof caches!=='undefined'?caches.default:null);
    const cacheKey=new Request('https://basic-ai-cache.invalid/'+await hash(uid+'|'+BASIC_AI_MODEL+'|v1|'+JSON.stringify(messages)));
    try{const hit=cache&&await cache.match(cacheKey);if(hit)return reply({...await hit.json(),cached:true,period:'day'});}catch(e){/* optional cache */}
    const id=crypto.randomUUID(), reserved=await quota({op:'reserve',id,estimate:basicAIReservation(messages)});
    if(!reserved.ok) return reply({error:reserved.reason,message:MESSAGES[reserved.reason]||'Included AI is temporarily unavailable.',...publicQuota(reserved)},429);
    let out,text,deadline;
    try{
      out=await Promise.race([
        env.AI.run(BASIC_AI_MODEL,{messages,max_completion_tokens:BASIC_AI_OUTPUT_TOKENS,stream:false}),
        new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('timeout')),12000);})
      ]);
      text=workersAIText(out);if(!text)throw new Error('empty');
    }catch(e){
      let restored=reserved;
      try{restored=await quota({op:'settle',id,success:false});}catch(ignore){/* keep reserved on meter failure */}
      return reply({error:'provider_unavailable',message:'Ailon could not generate an answer. Search and saved guides still work.',...publicQuota(restored)},503);
    }finally{clearTimeout(deadline);}
    let settled=reserved;
    try{settled=await quota({op:'settle',id,success:true,actual:basicAIActualUsage(out)});}catch(e){/* reservation remains charged */}
    const answer={text:guardAnswer(text),route:'workers-ai-basic',model:BASIC_AI_MODEL};
    try{if(cache)await cache.put(cacheKey,new Response(JSON.stringify(answer),{headers:{'Cache-Control':'public, max-age=3600','Content-Type':'application/json'}}));}catch(e){/* optional cache */}
    return reply({...answer,...publicQuota(settled),cached:false});
  }catch(e){return reply({error:'quota_unavailable',message:'Included AI is temporarily unavailable. Search and guides still work.'},503);}
}
