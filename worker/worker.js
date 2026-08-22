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


/* ============================================================================
   STAYING FREE FOREVER — the two settings that matter
   ============================================================================
   1. EDGE CACHE. Cloudflare's CDN sits IN FRONT of the Worker. If a response
      carries Cache-Control, the CDN serves repeat requests itself and the
      Worker is never invoked — so it never counts against the 100k/day.
      One cache MISS per city per hour reaches the Worker; everything else is
      free. This is what lets a million users sit inside the free tier.

   2. NEVER WRITE KV PER REQUEST. KV allows only 1,000 writes/day free (vs
      100,000 reads). This Worker writes ONLY from the cron — twice a day.
      Never add a per-user counter or log to KV; that is the one change that
      would break the free tier overnight.
   ========================================================================= */
const EDGE = {
  events: 3600,   /* 1 hour  — refreshed weekly, so an hour is very safe   */
  news:   1800,   /* 30 min  — refreshed daily                             */
  health: 60      /* 1 min   — cheap, but no reason to hammer it           */
};
/* Serve from the edge cache if we can; otherwise run `build`, cache, return. */
async function cached(request, ctx, seconds, build){
  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), request);
  let hit = await cache.match(key);
  if(hit) return hit;                       /* Worker did no real work      */
  const fresh = await build();
  const res = new Response(fresh.body, fresh);
  res.headers.set('Cache-Control', `public, max-age=${seconds}`);
  res.headers.set('X-RW-Cache', 'MISS');
  /* waitUntil lets us return immediately and store in the background */
  if(ctx && ctx.waitUntil) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}


/* /ai is the ONE route that can cost real money (it calls Groq and cannot be
   cached). Guard it with a per-IP-per-minute limiter built on the cache API —
   free, and crucially uses NO KV writes. */
async function aiRateLimited(request){
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
  async fetch(request, env, ctx){
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
    if(path === 'ai' && request.method === 'POST'){
      if(await aiRateLimited(request))
        return json({ error: 'Too many requests — try again in a minute.' }, 429);
      return handleAI(request, env);
    }


    /* ---- geocoding proxy (OpenStreetMap Nominatim) ----
       Optional: the app falls back to calling Nominatim directly if this
       Worker isn't deployed. Proxying is better because the edge cache means
       we make far fewer upstream calls, which keeps us inside OSM's usage
       policy no matter how many users we have. Cached 30 days — a place's
       existence does not change. */
    if(path === 'geo'){
      const q = (url.searchParams.get('q') || '').slice(0, 120);
      if(!q) return json({ error: 'no q' }, 400);
      return cached(request, ctx, 60 * 60 * 24 * 30, async () => {
        const u = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' + encodeURIComponent(q);
        const r = await fetch(u, { headers: { 'User-Agent': 'RoamWise/1.0 (roamwise.co.in; founder@roamwise.co.in)' } });
        const d = await r.json();
        return json(Array.isArray(d) ? d : []);
      });
    }


    /* ---- PARTNER LEAD FINDER (rw-v91) ----
       Finds candidate properties in a target town and returns them for a HUMAN
       to review and contact. Deliberately built on OpenStreetMap, which is
       open data licensed for exactly this — not on scraping Google or
       Booking.com, which would breach their terms and get us blocked.

       It does NOT auto-email anyone. Cold-emailing scraped contacts is how you
       get your domain blacklisted and, under Indian and EU rules, is often
       unlawful. It hands your team a qualified list; a person makes contact. */
    if(path === 'leads'){
      const town = (url.searchParams.get('town') || '').slice(0, 60);
      if(!town) return json({ error: 'pass ?town=Manali' }, 400);
      if(env.LEADS_TOKEN && url.searchParams.get('token') !== env.LEADS_TOKEN)
        return json({ error: 'unauthorised' }, 401);

      return cached(request, ctx, 60 * 60 * 24 * 7, async () => {
        // 1. resolve the town to a bounding box
        const g = await (await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(town),
          { headers: { 'User-Agent': 'RoamWise/1.0 (roamwise.co.in)' } })).json();
        if(!g || !g[0]) return json({ town, found: 0, leads: [], note: 'Town not found' });
        const bb = g[0].boundingbox; // [south, north, west, east]

        // 2. ask OpenStreetMap for guest houses, homestays and hostels there
        const q = `[out:json][timeout:25];
          (node["tourism"~"guest_house|hostel|chalet|apartment"](${bb[0]},${bb[2]},${bb[1]},${bb[3]});
           way["tourism"~"guest_house|hostel|chalet|apartment"](${bb[0]},${bb[2]},${bb[1]},${bb[3]}););
          out center 60;`;
        const r = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST', body: 'data=' + encodeURIComponent(q),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const d = await r.json();

        const leads = (d.elements || []).map(e => {
          const t = e.tags || {};
          return {
            name: t.name || null,
            kind: t.tourism || '',
            phone: t.phone || t['contact:phone'] || null,
            website: t.website || t['contact:website'] || null,
            email: t.email || t['contact:email'] || null,
            rooms: t.rooms || null,
            lat: e.lat || (e.center && e.center.lat) || null,
            lon: e.lon || (e.center && e.center.lon) || null,
            source: 'OpenStreetMap'
          };
        }).filter(x => x.name);

        // rank: a lead with a phone number is worth far more than one without
        leads.sort((a, b) => (b.phone ? 2 : 0) + (b.website ? 1 : 0) - ((a.phone ? 2 : 0) + (a.website ? 1 : 0)));

        return json({
          town, found: leads.length, leads: leads.slice(0, 40),
          contactable: leads.filter(x => x.phone || x.email).length,
          note: 'Open data from OpenStreetMap. Review before contacting; we do not send anything automatically.'
        });
      });
    }

    if(path === 'news'){
      return cached(request, ctx, EDGE.news, async () => {
        const c = env.RW_KV ? await env.RW_KV.get('news', 'json') : null;
        return json({ items: c || [], cached: !!c });
      });
    }
    if(path === 'events'){
      return cached(request, ctx, EDGE.events, async () => {
        const c = env.RW_KV ? await env.RW_KV.get('events', 'json') : null;
        return json(c || { updated: null, count: 0, events: [],
          note: 'No cached events yet. The weekly cron fills this, or call /events/refresh?token=…' });
      });
    }
    if(path === 'events/refresh'){
      if(env.REFRESH_TOKEN && url.searchParams.get('token') !== env.REFRESH_TOKEN)
        return json({ error: 'unauthorised' }, 401);
      return json(await refreshEvents(env));
    }
    return json({ error: 'not found', try: ['/health', '/ai', '/news', '/events', '/geo', '/leads'] }, 404);
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
