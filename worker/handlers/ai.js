/* ============================================================================
   worker/handlers/ai.js — POST /ai (Groq proxy)
   ============================================================================
   Named exports only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.

   /ai is the ONE route that can cost real money (it calls Groq and cannot be
   cached). Guard it with a per-IP-per-minute limiter built on the cache API —
   free, and crucially uses NO KV writes.
   ========================================================================= */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc } from '../lib/firestore-rest.js';
import { managedAILimit, managedAIRequest, reserveManagedAI, reserveProviderRequest } from '../lib/ai-entitlements.js';

const SYSTEM='You are Ailon Tusk, RoamWise travel copilot. Treat the user\'s explicitly named city/locality as the destination; never replace it with the enclosing state or country. Treat next month, October and similar phrases as dates, never places. Use supplied RoamWise facts as authoritative. If inventory, price, weather or opening status is not verified, say so and ask one precise question. Never claim a booking or payment succeeded unless the server-confirmed record says so.';
function indianLanguage(prompt,locale){return /^(hi|bn|ta|te|mr|gu|kn|ml|pa|od)(-|$)/i.test(locale)||/[\u0900-\u0D7F]/.test(prompt)||/\b(kya|kaise|kitna|chahiye|ghumna|sasta|batao|wala|hai|hain)\b/i.test(prompt)}
async function cloudflareAI(policy,env){
  if(!env.AI||typeof env.AI.run!=='function')throw new Error('workers_ai_unavailable');
  const model=String(env.WORKERS_AI_MODEL||'@cf/qwen/qwen3-30b-a3b-fp8');
  const out=await env.AI.run(model,{messages:[{role:'system',content:SYSTEM},{role:'user',content:policy.prompt}],max_tokens:policy.maxTokens});
  const text=String((out&&out.response)||'').trim();if(!text)throw new Error('workers_ai_empty');return {text,provider:'workers-ai',model};
}
async function sarvamAI(policy,env){
  if(!env.SARVAM_API_KEY)throw new Error('sarvam_unavailable');
  const r=await fetch('https://api.sarvam.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.SARVAM_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:String(env.SARVAM_MODEL||'sarvam-30b'),messages:[{role:'system',content:SYSTEM},{role:'user',content:policy.prompt}],max_tokens:policy.maxTokens})});
  const d=await r.json();if(!r.ok)throw new Error('sarvam_failed');return {text:String(d?.choices?.[0]?.message?.content||'').trim(),provider:'sarvam',model:String(env.SARVAM_MODEL||'sarvam-30b')};
}
async function groqAI(policy,env){
  if(!env.GROQ_API_KEY||!env.GROQ_MODEL)throw new Error('groq_unavailable');
  const cap=await reserveProviderRequest(env,'groq',Number(env.GROQ_MONTHLY_REQUEST_CAP)||12000);if(!cap.ok)throw new Error(cap.reason);
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:policy.model,messages:[{role:'system',content:SYSTEM},{role:'user',content:policy.prompt}],max_tokens:policy.maxTokens})});
  const d=await r.json();if(!r.ok)throw new Error('groq_failed');return {text:String(d?.choices?.[0]?.message?.content||'').trim(),provider:'groq',model:policy.model,usage:d?.usage||null};
}

export async function aiRateLimited(request){
  try{
    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    const minute = Math.floor(Date.now() / 60000);
    const key = new Request(`https://rl.invalid/ai/${ip}/${minute}`);
    const cache = caches.default;
    const seen = await cache.match(key);
    if(seen) return true;                  /* already used this minute */
    await cache.put(key, new Response('1', { headers:{ 'Cache-Control':'max-age=60' } }));
    return false;
  }catch(e){ return false; }              /* never block on limiter failure */
}

export async function handleAI(request, env){
  try{
    if(String(env.MANAGED_AI_ENABLED || '').toLowerCase() !== 'true'){
      return json({ error:'managed_ai_disabled', message:'Ailon Tusk Automatic is temporarily using its on-device planner.' }, 503);
    }
    if(!env.AI&&!env.GROQ_API_KEY&&!env.SARVAM_API_KEY)return json({error:'ai_not_configured',message:'Managed AI has no server route configured.'},501);
    let sa;
    try{ sa = parseServiceAccount(env); }
    catch(e){ return json({ error:'meter_not_configured', message:'Managed AI is unavailable until secure account metering is configured.' }, 501); }
    const auth = request.headers.get('authorization') || '';
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if(!match) return json({ error:'unauthorized', message:'Sign in to use the included managed-AI allowance.' }, 401);
    let claims;
    try{ claims = await verifyFirebaseIdToken(match[1], sa.project_id); }
    catch(e){ return json({ error:'unauthorized', message:'Your sign-in expired. Sign in again.' }, 401); }
    const declaredSize = Number(request.headers.get('content-length') || 0);
    if(declaredSize > 12000) return json({ error:'request_too_large', message:'Managed-AI requests are limited to 12 KB.' }, 413);
    const body = await request.json();
    const policy = managedAIRequest(body, env);
    if(!policy.prompt) return json({ error: 'no prompt' }, 400);
    const accessToken = await getServiceAccountAccessToken(env);
    const userDoc = await getDoc(env, accessToken, sa.project_id, `users/${claims.uid}`);
    const limit = managedAILimit(userDoc);
    const reserved = await reserveManagedAI(env, claims.uid, limit);
    if(!reserved.ok){
      const status = reserved.reason === 'meter_not_configured' ? 501 : 429;
      return json({ error:reserved.reason, message:reserved.reason === 'meter_not_configured'
        ? 'Managed AI is unavailable until secure usage metering is configured.'
        : 'This month\u2019s included managed-AI allowance is used. The on-device planner still works.',
        used:reserved.used, limit:reserved.limit }, status);
    }
    const routes=indianLanguage(policy.prompt,policy.locale)?[sarvamAI,cloudflareAI,groqAI]:[cloudflareAI,groqAI,sarvamAI];
    let answer=null,last='provider_error';
    for(const run of routes){try{answer=await run(policy,env);if(answer&&answer.text)break;}catch(e){last=String(e&&e.message||e)}}
    if(!answer||!answer.text)return json({error:'provider_error',message:'Ailon Tusk is temporarily using its on-device planner.',remaining:reserved.remaining,code:last},502);
    return json({text:answer.text,remaining:reserved.remaining,limit:reserved.limit,route:answer.provider,model:answer.model,usage:answer.usage||null});
  }catch(e){
    return json({ error: 'ai failed' }, 500);
  }
}
