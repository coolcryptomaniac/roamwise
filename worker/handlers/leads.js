/* ============================================================================
   worker/handlers/leads.js — GET /leads (rw-v91 partner lead finder)
   ============================================================================
   Named export only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.

   Finds candidate properties in a target town and returns them for a HUMAN
   to review and contact. Deliberately built on OpenStreetMap, which is
   open data licensed for exactly this — not on scraping Google or
   Booking.com, which would breach their terms and get us blocked.

   It does NOT auto-email anyone. Cold-emailing scraped contacts is how you
   get your domain blacklisted and, under Indian and EU rules, is often
   unlawful. It hands your team a qualified list; a person makes contact.
   ========================================================================= */
import { json, cached } from '../lib/http.js';

export async function handleLeads(request, env, ctx){
  const url = new URL(request.url);
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
