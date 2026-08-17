/* ============================================================================
   RoamWise Cloudflare Worker — SINGLE entry point.
   ============================================================================
   Everything the Worker does lives here, because Cloudflare runs exactly ONE
   `main` file with ONE default export and ONE scheduled() handler. (An earlier
   version split this across worker.js + events-refresh.js, which meant the
   event refresh silently never ran — merged now.)

   Routes:
     GET  /health              is it alive
     POST /ai                  AI proxy, keeps your key OFF the browser
     GET  /news                cached travel-tech feed
     GET  /events              cached events (weekly refreshed)
     GET  /events/refresh      force a refresh (token-protected)

   Cron: runs daily; refreshes news every run, events once a week (Mondays).

   DEPLOYING THIS IS OPTIONAL. RoamWise works fully without it — rw-config.js
   decides whether the app talks to the Worker at all.
   ========================================================================= */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

/* ---------------------------------------------------------------- AI proxy */
async function handleAI(request, env){
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

/* ------------------------------------------------------------ news refresh */
async function refreshNews(env){
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

/* ----------------------------------------------------------- event refresh */
async function fromTicketmaster(env){
  if(!env.TICKETMASTER_KEY) return [];
  const out = [];
  const jobs = [
    { cc:'IN', cls:'music',  cat:'music'  },
    { cc:'IN', cls:'sports', cat:'sports' },
    { cc:'US', cls:'music',  cat:'music'  },
    { cc:'GB', cls:'music',  cat:'music'  },
  ];
  for(const j of jobs){
    try{
      const u = `https://app.ticketmaster.com/discovery/v2/events.json?countryCode=${j.cc}`
        + `&classificationName=${j.cls}&size=20&sort=date,asc&apikey=${env.TICKETMASTER_KEY}`;
      const d = await (await fetch(u)).json();
      for(const e of d?._embedded?.events || []){
        const v = e._embedded?.venues?.[0];
        out.push({
          id: 'tm_' + e.id, cat: j.cat, name: e.name,
          place: [v?.name, v?.city?.name].filter(Boolean).join(', ') || (v?.city?.name || ''),
          country: v?.country?.name || j.cc,
          start: e.dates?.start?.localDate || null,
          verified: 'confirmed', source: 'ticketmaster',
          url: e.url || null, vibe: e.classifications?.[0]?.genre?.name || '',
        });
      }
    }catch(err){ /* one market failing must not kill the job */ }
  }
  return out;
}

async function refreshEvents(env){
  const fetched = await fromTicketmaster(env);
  const seen = new Set(), merged = [];
  for(const e of fetched){
    const k = (e.name + '|' + (e.start || '')).toLowerCase();
    if(seen.has(k)) continue;
    seen.add(k); merged.push(e);
  }
  const payload = { updated: new Date().toISOString(), count: merged.length, events: merged };
  if(env.RW_KV) await env.RW_KV.put('events', JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 * 30 });
  return payload;
}

/* ------------------------------------------------------------------ router */
export default {
  async fetch(request, env){
    if(request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');

    if(path === 'health'){
      return json({
        ok: true, service: 'roamwise-worker',
        configured: {
          ai:     !!env.GROQ_API_KEY,
          kv:     !!env.RW_KV,
          events: !!env.TICKETMASTER_KEY,
          refreshProtected: !!env.REFRESH_TOKEN,
        },
      });
    }
    if(path === 'ai' && request.method === 'POST') return handleAI(request, env);

    if(path === 'news'){
      const cached = env.RW_KV ? await env.RW_KV.get('news', 'json') : null;
      return json({ items: cached || [], cached: !!cached });
    }
    if(path === 'events'){
      const cached = env.RW_KV ? await env.RW_KV.get('events', 'json') : null;
      return json(cached || { updated: null, count: 0, events: [],
        note: 'No cached events yet. The weekly cron fills this, or call /events/refresh?token=…' });
    }
    if(path === 'events/refresh'){
      if(env.REFRESH_TOKEN && url.searchParams.get('token') !== env.REFRESH_TOKEN)
        return json({ error: 'unauthorised' }, 401);
      return json(await refreshEvents(env));
    }
    return json({ error: 'not found', try: ['/health', '/ai', '/news', '/events'] }, 404);
  },

  /* ONE scheduled handler. News daily; events on Mondays only, to stay well
     inside the Ticketmaster free quota. */
  async scheduled(event, env, ctx){
    try{
      await refreshNews(env);
      if(new Date().getUTCDay() === 1) await refreshEvents(env);
    }catch(e){ /* a cron failure must never take the Worker down */ }
  },
};
