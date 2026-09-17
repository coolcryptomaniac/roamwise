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
import { managedAILimit, managedAIRequest, reserveManagedAI } from '../lib/ai-entitlements.js';

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
      return json({ error:'managed_ai_disabled', message:'Use Smart Planner or add your own AI key.' }, 503);
    }
    if(!env.GROQ_API_KEY || !env.GROQ_MODEL){
      return json({ error:'ai_not_configured', message:'Managed AI needs a founder-selected model and server key.' }, 501);
    }
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
        : 'This month\u2019s included managed-AI allowance is used. Smart Planner and your own provider key still work.',
        used:reserved.used, limit:reserved.limit }, status);
    }
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: policy.model,
        messages: [{ role: 'user', content: policy.prompt }],
        max_tokens: policy.maxTokens,
      }),
    });
    const d = await r.json();
    if(!r.ok) return json({ error:'provider_error', message:'Managed AI provider failed.', remaining:reserved.remaining }, 502);
    return json({ text: d?.choices?.[0]?.message?.content || '', remaining:reserved.remaining, limit:reserved.limit });
  }catch(e){
    return json({ error: 'ai failed' }, 500);
  }
}
