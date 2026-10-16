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
import { managedAILimit, managedAIRequest, peekManagedAI, reserveManagedAI, reserveProviderRequest } from '../lib/ai-entitlements.js';
import { chargeSpend, estimateCostPaise, planRoutes, readBudget } from '../lib/spend-governor.js';
import { answerCacheKey, getCachedAnswer, getCachedLimit, putCachedAnswer, putCachedLimit } from '../lib/ai-cache.js';

const SYSTEM='You are Ailon Tusk, RoamWise travel copilot. Treat the user\'s explicitly named city/locality as the destination; never replace it with the enclosing state or country. Treat next month, October and similar phrases as dates, never places. Use supplied RoamWise facts as authoritative. If inventory, price, weather or opening status is not verified, say so and ask one precise question. Never claim a booking or payment succeeded unless the server-confirmed record says so.';
/* Older Workers AI models answer {response}; newer ones (Gemma 4) answer in the
   OpenAI shape {choices:[{message:{content}}]}. Accept both. */
export function workersAIText(out){
  const t=(out&&out.response)||(out&&out.choices&&out.choices[0]&&out.choices[0].message&&out.choices[0].message.content)||'';
  return String(t).trim();
}
async function cloudflareAI(policy,env){
  if(!env.AI||typeof env.AI.run!=='function')throw new Error('workers_ai_unavailable');
  const model=String(env.WORKERS_AI_MODEL||'@cf/google/gemma-4-26b-a4b-it');
  const out=await env.AI.run(model,{messages:[{role:'system',content:SYSTEM},{role:'user',content:policy.prompt}],max_tokens:policy.maxTokens});
  const text=workersAIText(out);if(!text)throw new Error('workers_ai_empty');return {text,provider:'workers-ai',model};
}
async function sarvamAI(policy,env){
  if(!env.SARVAM_API_KEY)throw new Error('sarvam_unavailable');
  const r=await fetch('https://api.sarvam.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.SARVAM_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:String(env.SARVAM_MODEL||'sarvam-105b-conversations'),messages:[{role:'system',content:SYSTEM},{role:'user',content:policy.prompt}],max_tokens:policy.maxTokens})});
  const d=await r.json();if(!r.ok)throw new Error('sarvam_failed');return {text:String(d?.choices?.[0]?.message?.content||'').trim(),provider:'sarvam',model:String(env.SARVAM_MODEL||'sarvam-105b-conversations')};
}
async function claudeAI(policy,env){
  if(!env.ANTHROPIC_API_KEY)throw new Error('claude_unavailable');
  const model=String(env.CLAUDE_MODEL||'claude-haiku-5-5');
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens:policy.maxTokens,system:SYSTEM,messages:[{role:'user',content:policy.prompt}]})});
  const d=await r.json();if(!r.ok)throw new Error('claude_failed');
  const text=(Array.isArray(d?.content)?d.content:[]).map(function(b){return b&&b.type==='text'?b.text:'';}).join('').trim();
  if(!text)throw new Error('claude_empty');
  return {text,provider:'claude',model,usage:d?.usage||null};
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

/* Indian-language routing: Sarvam is built for Indic and code-mixed chat, so
   Hindi/Indic scripts, Hinglish, or an explicit lang hint go to Sarvam first. */
const INDIC_RE=/[\u0900-\u0D7F]/g;
const HINGLISH_RE=/\b(kya|hai|hain|mujhe|mujhko|chahiye|kahan|kaise|kitna|kitne|batao|bataiye|karo|karna|ghumne|jana|jaana|accha|achha|nahi|nahin|aur|mera|meri|humare|dikhao|sasta|saste|yatra|kaun|konsa|kab)\b/gi;
export function prefersSarvam(prompt,lang){
  if(/^(hi|hin|bn|mr|gu|pa|ta|te|kn|ml|or|ur|as|ne)(-|_|$)/i.test(String(lang||'').trim()))return true;
  const t=String(prompt||'');
  const indic=(t.match(INDIC_RE)||[]).length;
  if(indic>=3&&indic/Math.max(t.length,1)>0.1)return true;
  return (t.match(HINGLISH_RE)||[]).length>=2;
}

/* Route order + metadata. Default: Workers AI (free allowance, then cheap),
   Sarvam, Groq (free tier). Hindi/Indic prompts put Sarvam first. Paying
   Pro/Elite users may get Claude first when AI_PREMIUM_ENABLED is "true"
   and the budget has plenty of headroom (planRoutes enforces that). */
function buildRoutes(policy, env, limit, body){
  const chars = policy.prompt.length, mt = policy.maxTokens;
  const mk = (name, run, extra) => Object.assign({ name, run, est:estimateCostPaise(name, chars, mt, env) }, extra || {});
  const cf = mk('workers-ai', cloudflareAI);
  const sv = mk('sarvam', sarvamAI);
  const gq = mk('groq', groqAI, { freeTier:String(env.GROQ_FREE_TIER||'true').toLowerCase() !== 'false' });
  cf.ok = !!(env.AI && typeof env.AI.run === 'function'); sv.ok = !!env.SARVAM_API_KEY; gq.ok = !!(env.GROQ_API_KEY && env.GROQ_MODEL);
  const list = (prefersSarvam(policy.prompt, body && body.lang) ? [sv, cf, gq] : [cf, sv, gq]).filter(r => r.ok);
  if(String(env.AI_PREMIUM_ENABLED||'').toLowerCase()==='true' && env.ANTHROPIC_API_KEY && limit >= 40){
    list.unshift(mk('claude', claudeAI, { premium:true }));
  }
  return list;
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
    // Allowance comes from a short KV cache; Firestore is read only on a miss.
    let limit = await getCachedLimit(env, claims.uid);
    if(limit === null){
      const accessToken = await getServiceAccountAccessToken(env);
      const userDoc = await getDoc(env, accessToken, sa.project_id, `users/${claims.uid}`);
      limit = managedAILimit(userDoc);
      await putCachedLimit(env, claims.uid, limit, userDoc);
    }
    // A repeated question is answered from cache and does not use up allowance.
    // The user must still have allowance left, so the free tier gets nothing.
    const cacheKey = await answerCacheKey(policy, env);
    const peek = await peekManagedAI(env, claims.uid, limit);
    if(peek.ok){
      const hit = await getCachedAnswer(env, cacheKey);
      if(hit) return json({text:hit.text,remaining:peek.remaining,limit:peek.limit,route:hit.provider,model:hit.model,usage:null,cached:true});
    }
    // Revenue-gated routing (see lib/spend-governor.js): cache first, then the
    // free allowances, then paid routes only while spend stays under the
    // revenue-derived budget. Checked BEFORE the user's allowance is used up.
    const routes = buildRoutes(policy, env, limit, body);
    const budget = await readBudget(env);
    const plan = planRoutes(routes, budget, { premiumMaxSpendRatio:env.AI_PREMIUM_MAX_SPEND_RATIO });
    if(!plan.length){
      return json({ error:'budget_guard', message:'Ailon Tusk is temporarily using its on-device planner.' }, 503);
    }
    const reserved = await reserveManagedAI(env, claims.uid, limit);
    if(!reserved.ok){
      const status = reserved.reason === 'meter_not_configured' ? 501 : 429;
      return json({ error:reserved.reason, message:reserved.reason === 'meter_not_configured'
        ? 'Managed AI is unavailable until secure usage metering is configured.'
        : 'This month\u2019s included managed-AI allowance is used. The on-device planner still works.',
        used:reserved.used, limit:reserved.limit }, status);
    }
    let answer=null,last='provider_error',used=null;
    for(const r of plan){try{answer=await r.run(policy,env);if(answer&&answer.text){used=r;break;}}catch(e){last=String(e&&e.message||e)}}
    if(!answer||!answer.text)return json({error:'provider_error',message:'Ailon Tusk is temporarily using its on-device planner.',remaining:reserved.remaining,code:last},502);
    try{await chargeSpend(env,used.name,used.est,used.freeTier);}catch(e){/* accounting is best-effort */}
    await putCachedAnswer(env, cacheKey, answer);
    return json({text:answer.text,remaining:reserved.remaining,limit:reserved.limit,route:answer.provider,model:answer.model,usage:answer.usage||null});
  }catch(e){
    return json({ error: 'ai failed' }, 500);
  }
}
