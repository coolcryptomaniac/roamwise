/* ============================================================================
   worker/handlers/geo.js — GET /geo (OpenStreetMap Nominatim proxy)
   ============================================================================
   Named export only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.

   Optional: the app falls back to calling Nominatim directly if this
   Worker isn't deployed. Proxying is better because the edge cache means
   we make far fewer upstream calls, which keeps us inside OSM's usage
   policy no matter how many users we have. Cached 30 days — a place's
   existence does not change.
   ========================================================================= */
import { json, cached } from '../lib/http.js';

export async function handleGeo(request, env, ctx){
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').slice(0, 120);
  if(!q) return json({ error: 'no q' }, 400);
  return cached(request, ctx, 60 * 60 * 24 * 30, async () => {
    const u = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' + encodeURIComponent(q);
    const r = await fetch(u, { headers: { 'User-Agent': 'RoamWise/1.0 (roamwise.co.in; founder@roamwise.co.in)' } });
    const d = await r.json();
    return json(Array.isArray(d) ? d : []);
  });
}
