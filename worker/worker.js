/* ============================================================================
   RoamWise Cloudflare Worker — optional backend.
   Deploying this is OPTIONAL and NON-BREAKING: the app only uses it when
   rw-config.js sets backend to 'worker' or 'auto'. Leave it on 'firebase' and
   nothing changes.

   What it unlocks (things a static site genuinely cannot do):
     - hiding AI API keys server-side instead of shipping them to browsers
     - a scheduled job (travel-tech news, refreshing places) via cron
     - server-side verification of Journey Passport claims (anti-cheat)
   ========================================================================= */

const CORS = {
  'Access-Control-Allow-Origin': 'https://www.roamwise.co.in',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');

    // --- health check: the app pings this in 'auto' mode -------------------
    if (path === 'health') return json({ ok: true, service: 'roamwise-worker' });

    // --- AI proxy: keeps your API key OFF the client ------------------------
    if (path === 'ai' && request.method === 'POST') {
      try {
        const body = await request.json();
        const prompt = String(body.prompt || '').slice(0, 6000);
        if (!prompt) return json({ error: 'no prompt' }, 400);
        if (!env.GROQ_API_KEY) return json({ error: 'AI not configured' }, 501);

        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: body.model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(body.max_tokens || 700, 1500),
          }),
        });
        const d = await r.json();
        return json({ text: d?.choices?.[0]?.message?.content || '' });
      } catch (e) {
        return json({ error: 'ai failed' }, 500);
      }
    }

    // --- cached news feed: served from the edge, refreshed by cron ----------
    if (path === 'news') {
      const cached = env.RW_KV ? await env.RW_KV.get('news', 'json') : null;
      return json({ items: cached || [], cached: !!cached });
    }

    return json({ error: 'not found' }, 404);
  },

  // --- scheduled job (set in wrangler.toml). Runs on Cloudflare's clock. ---
  async scheduled(event, env, ctx) {
    if (!env.RW_KV) return;
    try {
      // Example: cache a travel-tech feed so the app loads it instantly.
      // Replace with any source you actually want.
      const r = await fetch('https://hnrss.org/newest?q=travel+AI&count=10');
      const xml = await r.text();
      const items = [...xml.matchAll(/<title>(.*?)<\/title>\s*<link>(.*?)<\/link>/g)]
        .slice(1, 11)
        .map(m => ({ title: m[1], url: m[2] }));
      await env.RW_KV.put('news', JSON.stringify(items), { expirationTtl: 86400 });
    } catch (e) { /* never let a cron failure take anything down */ }
  },
};
