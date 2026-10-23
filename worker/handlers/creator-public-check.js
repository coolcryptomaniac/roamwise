/* ============================================================================
   worker/handlers/creator-public-check.js — POST /admin/creator/public-check
   ============================================================================
   Admin-only. Body { name, handle, youtube }. Checks a creator against PUBLIC sources when Instagram's own API is
   not switched on:
     - YouTube Data API v3 (official): subscribers, median views and engagement of the last videos.   Secret: YT_API_KEY
     - Web footprint: a web search of the creator's name and handle, returned as links a person reads. Secret: FIRECRAWL_API_KEY
   Instagram pages are never scraped (against Instagram's terms). Each source is optional: it answers what it can and
   says which are not configured. Results are cached 24 hours per creator. Nothing is written here; the admin page saves. */
import { json } from '../lib/http.js';
import { requireAdmin } from './push.js';
import { parseServiceAccount } from '../lib/service-account.js';
import { youtubeRef, analyzeYoutube, summarizeFootprint, searchQuery } from '../../creators/public-check-core.mjs';

const YT = 'https://www.googleapis.com/youtube/v3/';

async function youtubeCheck(ref, key, f) {
  const q = ref.by === 'id' ? 'id=' + encodeURIComponent(ref.value) : ref.by === 'handle' ? 'forHandle=' + encodeURIComponent(ref.value) : 'forUsername=' + encodeURIComponent(ref.value);
  const ch = await (await f(`${YT}channels?part=snippet,statistics,contentDetails&${q}&key=${encodeURIComponent(key)}`)).json();
  const item = ch && ch.items && ch.items[0];
  if (!item) return { error: (ch && ch.error && ch.error.message) || 'Channel not found' };
  const uploads = item.contentDetails && item.contentDetails.relatedPlaylists && item.contentDetails.relatedPlaylists.uploads;
  let videos = [];
  if (uploads) {
    const pl = await (await f(`${YT}playlistItems?part=contentDetails&maxResults=12&playlistId=${encodeURIComponent(uploads)}&key=${encodeURIComponent(key)}`)).json();
    const ids = ((pl && pl.items) || []).map((i) => i.contentDetails && i.contentDetails.videoId).filter(Boolean);
    if (ids.length) videos = ((await (await f(`${YT}videos?part=statistics,snippet&id=${ids.join(',')}&key=${encodeURIComponent(key)}`)).json()).items) || [];
  }
  return analyzeYoutube(item, videos);
}

async function webCheck(who, key, f) {
  const res = await f('https://api.firecrawl.dev/v1/search', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ query: searchQuery(who), limit: 10 }) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) return { error: 'Web search failed: HTTP ' + res.status };
  return summarizeFootprint((out.data || out.results || []).map((r) => ({ title: r.title, url: r.url })), who);
}

export async function handleCreatorPublicCheck(request, env, deps = {}) {
  const f = deps.fetch || fetch;
  let admin;
  if (deps.requireAdmin) admin = await deps.requireAdmin(request);
  else {
    let sa;
    try { sa = parseServiceAccount(env); } catch (e) { return json({ error: 'not_configured', message: e.message }, 501); }
    admin = await requireAdmin(request, env, sa.project_id);
  }
  if (admin.error) return admin.error;
  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: 'invalid JSON body' }, 400); }
  const who = { name: String(body.name || '').slice(0, 80), handle: String(body.handle || '').slice(0, 200) };
  const ref = youtubeRef(body.youtube);
  const configured = { youtube: !!env.YT_API_KEY, web: !!env.FIRECRAWL_API_KEY };
  if (!configured.youtube && !configured.web) return json({ configured, error: 'Public checks are not set up yet. Add YT_API_KEY and/or FIRECRAWL_API_KEY as Worker secrets.' }, 503);
  const out = { configured, checkedAt: new Date().toISOString() };
  try { if (configured.youtube && ref) out.youtube = await youtubeCheck(ref, env.YT_API_KEY, f); } catch (e) { out.youtube = { error: 'YouTube check failed' }; }
  try { if (configured.web && (who.name || who.handle)) out.footprint = await webCheck(who, env.FIRECRAWL_API_KEY, f); } catch (e) { out.footprint = { error: 'Web check failed' }; }
  return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=86400' } });
}
