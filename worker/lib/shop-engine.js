/* Shop engine storage glue (D1 `shop_designs`, `shop_sales_lines`, `shop_clicks`).
 * Everything is a no-op unless env.DB exists AND env.SHOP_ENGINE_ENABLED === 'true', so the existing shop
 * behaves exactly as before until the founder switches the engine on. Rules live in shop-engine-core.js. */
import { LIMITS, istDay, lifecycle, mergeCatalogue, popularity, salesStats } from './shop-engine-core.js';
import { SHOP_ENGINE_BLANKS } from './shop-engine-blanks.js';

export const enabled = (env) => !!(env && env.DB && env.SHOP_ENGINE_ENABLED === 'true');

const CACHE_MS = 60 * 1000;
let cache = {};

async function designs(env, nowMs, all) {
  const key = all ? 'all' : 'live';
  const hit = cache[key];
  if (hit && nowMs - hit.at < CACHE_MS) return hit.rows;
  const sql = all
    ? "SELECT * FROM shop_designs WHERE status IN ('live','retired') ORDER BY live_at DESC LIMIT 500"
    : "SELECT * FROM shop_designs WHERE status = 'live' ORDER BY live_at DESC LIMIT " + LIMITS.maxLive;
  const r = await env.DB.prepare(sql).all();
  const rows = (r && r.results) || [];
  cache[key] = { at: nowMs, rows };
  return rows;
}

/* The catalogue checkout uses. includeRetired keeps old designs resolvable for fulfilment of paid orders. */
export async function catalogueFor(env, base, opts = {}) {
  if (!enabled(env)) return base;
  try {
    const rows = await designs(env, (opts.now || Date.now)(), !!opts.includeRetired);
    return mergeCatalogue(base, rows, opts.blanks || SHOP_ENGINE_BLANKS, { includeRetired: !!opts.includeRetired });
  } catch (_) {
    return base; // D1 trouble never breaks the static shop
  }
}

/* Called once an order has been accepted by the supplier. Idempotent per (order, product). */
export async function recordShippedOrder(env, order, nowMs = Date.now()) {
  if (!env || !env.DB || !order || !Array.isArray(order.lines)) return false;
  try {
    const day = istDay(nowMs);
    const stmts = order.lines.map((l) => env.DB
      .prepare('INSERT OR IGNORE INTO shop_sales_lines (order_id, product_id, units, revenue_paise, day) VALUES (?, ?, ?, ?, ?)')
      .bind(String(order.orderId), String(l.id), Number(l.qty) || 0, Number(l.linePaise) || 0, day));
    if (stmts.length) await env.DB.batch(stmts);
    return true;
  } catch (_) { return false; }
}

/* Daily cron: promote reviewed designs (autopublish), retire unsold ones. */
export async function runShopEngineCron(env, base, nowMs = Date.now(), blanks = SHOP_ENGINE_BLANKS) {
  if (!enabled(env)) return { skipped: 'engine_off' };
  const all = ((await env.DB.prepare('SELECT * FROM shop_designs ORDER BY created_at DESC LIMIT 1000').all()) || {}).results || [];
  const since = istDay(nowMs - 365 * 86400000);
  const lines = ((await env.DB.prepare('SELECT product_id, units, revenue_paise, day FROM shop_sales_lines WHERE day >= ?').bind(since).all()) || {}).results || [];
  const decision = lifecycle(all, salesStats(lines, nowMs), nowMs, { autopublish: env.SHOP_ENGINE_AUTOPUBLISH === 'true', blanks });
  const at = new Date(nowMs).toISOString().replace('T', ' ').slice(0, 19);
  const stmts = [
    ...decision.promote.map((id) => env.DB.prepare("UPDATE shop_designs SET status = 'live', live_at = ? WHERE id = ? AND status = 'review'").bind(at, id)),
    ...decision.retire.map((r) => env.DB.prepare("UPDATE shop_designs SET status = 'retired', retired_at = ?, retire_reason = ? WHERE id = ? AND status = 'live'").bind(at, r.reason, r.id)),
  ];
  if (stmts.length) await env.DB.batch(stmts);
  cache = {};
  return { promoted: decision.promote.length, retired: decision.retire.length };
}

/* "Popular now" on the shop page: product ids ranked by on-site clicks and purchases (cached 5 min). */
export async function popularFor(env, nowMs = Date.now()) {
  if (!enabled(env)) return [];
  const hit = cache.popular;
  if (hit && nowMs - hit.at < 5 * 60 * 1000) return hit.ids;
  try {
    const since = istDay(nowMs - 30 * 86400000);
    const clicks = ((await env.DB.prepare('SELECT product_id, day, clicks FROM shop_clicks WHERE day >= ?').bind(since).all()) || {}).results || [];
    const lines = ((await env.DB.prepare('SELECT product_id, units, revenue_paise, day FROM shop_sales_lines WHERE day >= ?').bind(since).all()) || {}).results || [];
    const ids = popularity(clicks, salesStats(lines, nowMs), nowMs);
    cache.popular = { at: nowMs, ids };
    return ids;
  } catch (_) { return []; }
}

const PRODUCT_ID = /^[a-z0-9-]{1,60}$/;
/* POST /shop/click {id}: one anonymous click on a product card / Buy now. Counts only real catalogue ids;
 * a per-visitor speed bump stops floods. Stores nothing about the visitor. Always 204. */
export async function handleShopClick(request, env, base, deps = {}) {
  const done = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  if (!enabled(env)) return done();
  let body = null;
  try { body = await request.json(); } catch (_) { return done(); }
  const id = body && typeof body.id === 'string' ? body.id : '';
  if (!PRODUCT_ID.test(id)) return done();
  try {
    const cat = await catalogueFor(env, base);
    if (!cat.products.some((p) => p.id === id)) return done();
    const ip = request.headers.get('cf-connecting-ip') || 'anon';
    const limited = deps.overLimit ? await deps.overLimit('shopclick', (await deps.hash(ip + ':' + id)), 3, 3600) : false;
    if (limited) return done();
    await env.DB.prepare('INSERT INTO shop_clicks (product_id, day, clicks) VALUES (?, ?, 1) ON CONFLICT(product_id, day) DO UPDATE SET clicks = clicks + 1')
      .bind(id, istDay((deps.now || Date.now)())).run();
  } catch (_) { /* best effort */ }
  return done();
}

export const _test = { reset: () => { cache = {}; } };
