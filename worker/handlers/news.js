/* ============================================================================
   worker/handlers/news.js — GET /news, plus refreshNews() for the cron
   ============================================================================
   Named exports only — see worker/lib/http.js header for why. `refreshNews`
   is imported into worker/worker.js's scheduled() handler (daily); it is NOT
   its own entry point and does NOT export a default — that distinction is
   exactly what the prior worker.js + events-refresh.js split got wrong (see
   worker/worker.js header).
   ========================================================================= */
import { json, cached, EDGE } from '../lib/http.js';

export async function refreshNews(env){
  if(!env.RW_KV) return { skipped: 'no KV bound' };
  try{
    const r = await fetch('https://hnrss.org/newest?q=travel+AI&count=10');
    const xml = await r.text();
    const items = [...xml.matchAll(/<title>(.*?)<\/title>\s*<link>(.*?)<\/link>/g)]
      .slice(1, 11).map(m => ({ title: m[1], url: m[2] }));
    await env.RW_KV.put('news', JSON.stringify(items), { expirationTtl: 86400 });
    return { count: items.length };
  }catch(e){ return { error: 'news fetch failed' }; }
}

export async function handleNews(request, env, ctx){
  return cached(request, ctx, EDGE.news, async () => {
    const c = env.RW_KV ? await env.RW_KV.get('news', 'json') : null;
    return json({ items: c || [], cached: !!c });
  });
}
