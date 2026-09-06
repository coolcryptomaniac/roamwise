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
    const body = await request.json();
    const prompt = String(body.prompt || '').slice(0, 6000);
    if(!prompt) return json({ error: 'no prompt' }, 400);
    if(!env.GROQ_API_KEY) return json({ error: 'AI not configured on this Worker' }, 501);

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: body.model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(body.max_tokens || 700, 1500),
      }),
    });
    const d = await r.json();
    return json({ text: d?.choices?.[0]?.message?.content || '' });
  }catch(e){
    return json({ error: 'ai failed' }, 500);
  }
}
