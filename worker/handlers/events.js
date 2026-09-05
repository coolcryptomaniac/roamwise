/* ============================================================================
   worker/handlers/events.js — GET /events, GET /events/refresh, plus
   refreshEvents() for the cron
   ============================================================================
   Named exports only — see worker/lib/http.js header for why. `refreshEvents`
   is imported into worker/worker.js's scheduled() handler (Mondays only); it
   is NOT its own entry point and does NOT export a default — that distinction
   is exactly what the prior worker.js + events-refresh.js split got wrong
   (see worker/worker.js header): that version made events-refresh.js its own
   `export default { fetch, scheduled }`, which Cloudflare silently ignored
   because wrangler.toml's `main` only points at worker.js.
   ========================================================================= */
import { json, cached, EDGE } from '../lib/http.js';

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

export async function refreshEvents(env){
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

export async function handleEvents(request, env, ctx){
  return cached(request, ctx, EDGE.events, async () => {
    const c = env.RW_KV ? await env.RW_KV.get('events', 'json') : null;
    return json(c || { updated: null, count: 0, events: [],
      note: 'No cached events yet. The weekly cron fills this, or call /events/refresh?token=…' });
  });
}

export async function handleEventsRefresh(request, env){
  const url = new URL(request.url);
  if(env.REFRESH_TOKEN && url.searchParams.get('token') !== env.REFRESH_TOKEN)
    return json({ error: 'unauthorised' }, 401);
  return json(await refreshEvents(env));
}
