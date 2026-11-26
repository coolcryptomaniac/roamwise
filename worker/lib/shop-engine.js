/* Shop engine storage glue (D1 `shop_designs`, `shop_sales_lines`; R2 MEDIA for the promotion plan).
 * Everything is a no-op unless env.DB exists AND env.SHOP_ENGINE_ENABLED === 'true', so the existing shop
 * behaves exactly as before until the founder switches the engine on. Rules live in shop-engine-core.js. */
import { LIMITS, istDay, lifecycle, mergeCatalogue, promotionPlan, rankProducts, salesStats } from './shop-engine-core.js';
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

/* Daily cron: promote reviewed designs (autopublish), retire unsold ones, write the promotion plan. */
export async function runShopEngineCron(env, base, nowMs = Date.now()) {
  if (!enabled(env)) return { skipped: 'engine_off' };
  const all = ((await env.DB.prepare('SELECT * FROM shop_designs ORDER BY created_at DESC LIMIT 1000').all()) || {}).results || [];
  const since = istDay(nowMs - 365 * 86400000);
  const lines = ((await env.DB.prepare('SELECT product_id, units, revenue_paise, day FROM shop_sales_lines WHERE day >= ?').bind(since).all()) || {}).results || [];
  const stats = salesStats(lines, nowMs);
  const decision = lifecycle(all, stats, nowMs, { autopublish: env.SHOP_ENGINE_AUTOPUBLISH === 'true' });
  const at = new Date(nowMs).toISOString().replace('T', ' ').slice(0, 19);
  const stmts = [
    ...decision.promote.map((id) => env.DB.prepare("UPDATE shop_designs SET status = 'live', live_at = ? WHERE id = ? AND status = 'review'").bind(at, id)),
    ...decision.retire.map((r) => env.DB.prepare("UPDATE shop_designs SET status = 'retired', retired_at = ?, retire_reason = ? WHERE id = ? AND status = 'live'").bind(at, r.reason, r.id)),
  ];
  if (stmts.length) await env.DB.batch(stmts);
  cache = {};
  const catalogue = await catalogueFor(env, base, { now: () => nowMs });
  const byId = Object.fromEntries(all.map((d) => [d.id, d]));
  const ranked = rankProducts(catalogue.products, stats, byId, nowMs);
  const plan = promotionPlan(catalogue, ranked, nowMs, env.SHOP_ADS_DAILY_CAP_INR);
  if (env.MEDIA) {
    try { await env.MEDIA.put('shop/engine/promo.json', JSON.stringify(plan, null, 1), { httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=300' } }); } catch (_) { /* next run */ }
  }
  return { promoted: decision.promote.length, retired: decision.retire.length, featured: plan.featured.map((f) => f.id) };
}

export const _test = { reset: () => { cache = {}; } };
