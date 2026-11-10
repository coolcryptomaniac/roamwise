/* ============================================================================
   worker/handlers/home-daily.js — GET /home/daily, plus refreshHomeDaily()
   for the daily cron
   ============================================================================
   Keeps the home page fresh every day with no deploy and no manual edit:
   the daily cron stores a small snapshot of two curated site files in KV, and
   GET /home/daily turns it into today's feed (India date) at request time, so
   the page changes at midnight IST rather than when the cron happens to run.

   Selection only, never generation: see worker/lib/home-daily-core.js.
   KV is written ONLY by the cron (once a day). The GET is edge-cached, so the
   Worker is invoked a few times an hour at most. If KV is empty (first deploy,
   before the first cron), the GET reads the site files once and serves from the
   edge cache. Named exports only (see worker/lib/http.js). */
import { json, cached } from '../lib/http.js';
import { snapshot, buildFeed, indiaDate } from '../lib/home-daily-core.js';

const KEY = 'home-daily-src';
const EDGE_SECONDS = 900;

async function readSite(env, fetchImpl) {
  const origin = String(env.SITE_ORIGIN || 'https://roamwise.co.in').replace(/\/+$/, '');
  const get = async (p) => {
    const r = await (fetchImpl || fetch)(origin + p, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return r.json();
  };
  const [promo, conditions] = await Promise.all([get('/data/home-promo.json'), get('/data/conditions.json')]);
  return snapshot(promo, conditions, new Date().toISOString());
}

/* Daily cron. A failed fetch keeps yesterday's snapshot rather than blanking the page. */
export async function refreshHomeDaily(env, fetchImpl) {
  if (!env.RW_KV) return { skipped: 'no KV bound' };
  try {
    const snap = await readSite(env, fetchImpl);
    if (!snap.stays.length && !snap.advisories.length) return { skipped: 'site files were empty' };
    await env.RW_KV.put(KEY, JSON.stringify(snap), { expirationTtl: 86400 * 7 });
    return { stays: snap.stays.length, advisories: snap.advisories.length };
  } catch (e) { return { error: 'home daily refresh failed' }; }
}

export async function handleHomeDaily(request, env, ctx, fetchImpl, now) {
  if (request.method !== 'GET') return json({ error: 'not found' }, 404);
  const build = async () => {
    let snap = env.RW_KV ? await env.RW_KV.get(KEY, 'json') : null;
    if (!snap) { try { snap = await readSite(env, fetchImpl); } catch (e) { snap = null; } }
    return json(buildFeed(snap, indiaDate(now ? now() : new Date())));
  };
  return cached(request, ctx, EDGE_SECONDS, build);
}
