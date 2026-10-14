/* ============================================================================
   worker/handlers/creator-rating.js — POST /admin/creator/ig-rating
   ============================================================================
   Admin-only. Body { username }. Reads a public Instagram Business/Creator
   account through Instagram's official Business Discovery API (no scraping)
   and returns the RoamWise rating from creators/ig-rating-core.mjs.

   Off until configured. It needs two Worker secrets:
     IG_BUSINESS_ID   the RoamWise Instagram professional account id
     IG_GRAPH_TOKEN   a long-lived token with instagram_basic,
                      instagram_manage_insights and pages_read_engagement
   Until both exist it answers 503 { configured:false } and the admin page
   falls back to numbers typed in from the creator's Insights screenshot.
   Results are cached for 24 hours per username so a busy day costs a handful
   of Graph calls, not hundreds. */
import { json } from '../lib/http.js';
import { requireAdmin } from './push.js';
import { parseServiceAccount } from '../lib/service-account.js';
import { analyzeDiscovery, igUsername, rateCreator } from '../../creators/ig-rating-core.mjs';

const GRAPH = 'https://graph.facebook.com/v21.0/';
const MEDIA = 'like_count,comments_count,timestamp,media_type,media_product_type,caption';
const fields = (u, views) => `business_discovery.username(${u}){username,followers_count,media_count,media.limit(25){${MEDIA}${views ? ',view_count' : ''}}}`;

export async function handleCreatorRating(request, env, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  let admin;
  if (deps.requireAdmin) admin = await deps.requireAdmin(request);
  else {
    let sa;
    try { sa = parseServiceAccount(env); } catch (e) { return json({ error: 'not_configured', message: e.message }, 501); }
    admin = await requireAdmin(request, env, sa.project_id);
  }
  if (admin.error) return admin.error;
  if (!env.IG_BUSINESS_ID || !env.IG_GRAPH_TOKEN) {
    return json({ configured: false, error: 'Instagram rating is not set up yet. Add IG_BUSINESS_ID and IG_GRAPH_TOKEN as Worker secrets.' }, 503);
  }
  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: 'invalid JSON body' }, 400); }
  const username = igUsername(body.username);
  if (!username) return json({ error: 'give an Instagram username or profile link' }, 400);

  const cache = deps.cache || (typeof caches !== 'undefined' ? caches.default : null);
  const cacheKey = new Request('https://cache.roamwise.internal/ig-rating/' + username);
  if (cache && !body.fresh) { const hit = await cache.match(cacheKey); if (hit) return hit; }

  let data = null, lastError = '';
  for (const views of [true, false]) {           // view_count is newer; retry without it if the API refuses the field
    const url = GRAPH + encodeURIComponent(env.IG_BUSINESS_ID) + '?fields=' + encodeURIComponent(fields(username, views)) + '&access_token=' + encodeURIComponent(env.IG_GRAPH_TOKEN);
    const res = await fetchImpl(url);
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.business_discovery) { data = out.business_discovery; break; }
    lastError = (out.error && out.error.message) || ('HTTP ' + res.status);
    if (!(out.error && out.error.code === 100)) break;
  }
  if (!data) return json({ configured: true, error: 'Instagram did not return this account. It must be a public Business or Creator account. ' + lastError.slice(0, 200) }, 404);

  const analysis = analyzeDiscovery(data);
  const rating = rateCreator(analysis, body.history || {});
  const response = new Response(JSON.stringify({ configured: true, username, analysis, rating }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=86400', 'Access-Control-Allow-Origin': '*' } });
  if (cache) await cache.put(cacheKey, response.clone()).catch(() => {});
  return response;
}
