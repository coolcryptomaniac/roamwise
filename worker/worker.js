/* ============================================================================
   RoamWise Cloudflare Worker — SINGLE entry point.
   ============================================================================
   Cloudflare runs exactly ONE `main` file (see wrangler.toml) with ONE
   `export default` object (fetch + scheduled). That constraint is real and
   this file is the only one in worker/ allowed to have that default export.

   It does NOT mean the route logic all has to live in this one file, though.
   This project's wrangler.toml already points `main` at a file using
   `export default { fetch, scheduled }` — that's Cloudflare's "modules"
   Worker format, which wrangler bundles with esbuild before upload, and that
   format supports real ES `import`/`export` between files same as Node.
   Route handlers live in worker/handlers/*.js (one file per route) and
   shared HTTP helpers live in worker/lib/http.js; this file just wires them
   together — a routing table plus the fetch()/scheduled() dispatch.

   (An earlier version genuinely broke, but not because imports don't work:
   it split cron logic into a *second* file, events-refresh.js, that had its
   *own* `export default { fetch, scheduled }` — a second, competing entry
   point. wrangler.toml's `main` only points at worker.js, so Cloudflare
   never ran that second file's scheduled() at all — silently, no error. The
   fix isn't "never split files", it's "only worker.js may export default";
   every other file — handlers/*.js and lib/http.js — exports plain named
   functions that get imported IN to worker.js's single fetch()/scheduled(),
   never a competing entry point of their own. See worker/handlers/events.js
   for where refreshEvents() now lives as a plain named export.)

   Routes:
     GET  /health              is it alive               -> handlers/health.js
     POST /ai                  AI proxy, keeps key OFF the browser -> handlers/ai.js
     GET  /news                cached travel-tech feed    -> handlers/news.js
     GET  /events               cached events (weekly refreshed) -> handlers/events.js
     GET  /events/refresh      force a refresh (token-protected) -> handlers/events.js
     GET  /geo                 geocoding proxy            -> handlers/geo.js
     GET  /leads                partner lead finder        -> handlers/leads.js
     POST /cashfree/order              create a Cashfree order (secrets stay server-side) -> handlers/cashfree.js
     GET  /cashfree/order/:id/status   confirm order_status with Cashfree     -> handlers/cashfree.js

   Cron: runs daily; refreshes news every run, events once a week (Mondays).

   DEPLOYING THIS IS OPTIONAL. RoamWise works fully without it — rw-config.js
   decides whether the app talks to the Worker at all.
   ========================================================================= */

import { CORS, json } from './lib/http.js';
import { handleHealth } from './handlers/health.js';
import { aiRateLimited, handleAI } from './handlers/ai.js';
import { refreshNews, handleNews } from './handlers/news.js';
import { refreshEvents, handleEvents, handleEventsRefresh } from './handlers/events.js';
import { handleGeo } from './handlers/geo.js';
import { handleLeads } from './handlers/leads.js';
import { handleCashfreeOrder, handleCashfreeOrderStatus } from './handlers/cashfree.js';

/* ------------------------------------------------------------------ router */
export default {
  async fetch(request, env, ctx){
    if(request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');

    if(path === 'health') return handleHealth(env);

    if(path === 'ai' && request.method === 'POST'){
      if(await aiRateLimited(request))
        return json({ error: 'Too many requests — try again in a minute.' }, 429);
      return handleAI(request, env);
    }

    if(path === 'geo') return handleGeo(request, env, ctx);

    if(path === 'leads') return handleLeads(request, env, ctx);

    if(path === 'news') return handleNews(request, env, ctx);

    if(path === 'events') return handleEvents(request, env, ctx);

    if(path === 'events/refresh') return handleEventsRefresh(request, env);

    if(path === 'cashfree/order' && request.method === 'POST') return handleCashfreeOrder(request, env);

    const cfStatus = path.match(/^cashfree\/order\/([^/]+)\/status$/);
    if(cfStatus && request.method === 'GET') return handleCashfreeOrderStatus(env, cfStatus[1]);

    return json({ error: 'not found', try: ['/health', '/ai', '/news', '/events', '/geo', '/leads', '/cashfree/order'] }, 404);
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
