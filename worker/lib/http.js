/* ============================================================================
   worker/lib/http.js — shared HTTP helpers for the RoamWise Worker.
   ============================================================================
   Plain named exports only (no `export default`). This is what makes the
   route-separation split in worker/handlers/ safe: Cloudflare Workers require
   exactly ONE file with ONE `export default { fetch, scheduled }` (that's
   worker/worker.js). Every other file in this tree — this one included —
   must stick to named exports of functions/constants that worker.js and the
   handlers import. See the header comment in worker/worker.js for the full
   story of the bug this constraint guards against.
   ========================================================================= */

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const json = (o, s = 200) =>
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
export const EDGE = {
  events: 3600,   /* 1 hour  — refreshed weekly, so an hour is very safe   */
  news:   1800,   /* 30 min  — refreshed daily                             */
  health: 60      /* 1 min   — cheap, but no reason to hammer it           */
};

/* Serve from the edge cache if we can; otherwise run `build`, cache, return. */
export async function cached(request, ctx, seconds, build){
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
