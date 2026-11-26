/* Shop engine: pure rules for auto-designed print-on-demand products. No network, no storage.
 *
 * Flow: the daily design workflow (tools/shop-engine/design.py) writes design rows to D1 `shop_designs`.
 * A row is sellable only when it is `live`, the engine is enabled and its product type has Qikink blank
 * SKUs configured. Prices come ONLY from PRODUCT_TYPES below (server side), never from the design row or
 * the browser. The daily cron scores products on real shipped sales, retires designs that never sold and
 * promotes products ON THE SITE ONLY: the shop page features what gets the most clicks and purchases.
 *
 * Founder decisions encoded here (change in a reviewed PR): retail prices per type, how many auto
 * designs may be live at once, when an unsold design retires, and (27 Nov 2026) no paid ads: promotion
 * is in-house on roamwise.co.in, ranked by on-site clicks and purchases. */

export const PRODUCT_TYPES = Object.freeze({
  'oversized-tee': Object.freeze({ label: 'Oversized graphic tee', pricePaise: 89900, maxQty: 5, printW: 12, printH: 14 }),
  'hoodie': Object.freeze({ label: 'Oversized hoodie', pricePaise: 199900, maxQty: 5, printW: 12, printH: 14 }),
  'tote': Object.freeze({ label: 'Everyday tote bag', pricePaise: 59900, maxQty: 5, printW: 10, printH: 10 }),
});

export const LIMITS = Object.freeze({
  maxLive: 24,            // auto designs on sale at once
  maxNewPerDay: 3,        // designs the cron may promote from review to live per day (autopublish mode)
  retireUnsoldDays: 45,   // live this long with zero sales -> retired (kept for fulfilment of old orders)
  retireColdDays: 90,     // had sales but none in this many days -> retired
  popular: 4,             // products featured in "Popular now" on the shop page
});

export const DESIGN_ID = /^auto-\d{8}-[a-z0-9-]{2,40}$/;
const DAY = 86400000;

export function istDay(ms) {
  return new Date(ms + 5.5 * 3600000).toISOString().slice(0, 10);
}

const httpsUrl = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u) && u.length <= 500;

/* A D1 row -> a checkout product, or null when it must not be sold (bad data, type off, no blanks). */
export function productFromDesign(row, blanks, opts = {}) {
  if (!row || !DESIGN_ID.test(String(row.id || ''))) return null;
  const type = PRODUCT_TYPES[row.product_type];
  const typeBlanks = blanks && blanks[row.product_type];
  if (!type || !Array.isArray(typeBlanks) || !typeBlanks.length) return null;
  if (!httpsUrl(row.print_url) || !httpsUrl(row.mockup_url)) return null;
  const sellable = row.status === 'live' || (opts.includeRetired && row.status === 'retired');
  if (!sellable) return null;
  const placement = row.placement === 'front' ? 'front' : 'back';
  const variants = typeBlanks
    .filter((b) => b && /^[a-z0-9-]{1,24}$/.test(b.id || '') && typeof b.sku === 'string' && b.sku.length > 0 && b.sku.length <= 50)
    .map((b) => Object.freeze({
      id: b.id, label: String(b.label || b.id).slice(0, 60), qikinkSku: b.sku,
      design: Object.freeze({
        code: row.id.slice(0, 50), placement, link: row.print_url, mockup: row.mockup_url,
        widthIn: Number(row.print_w_in) || type.printW, heightIn: Number(row.print_h_in) || type.printH,
      }),
    }));
  if (!variants.length) return null;
  return Object.freeze({
    id: row.id,
    name: String(row.title || '').slice(0, 80) + ' · ' + type.label,
    type: type.label,
    description: String(row.tagline || '').slice(0, 240) || 'An original RoamWise design, printed on demand for you.',
    image: row.mockup_url,
    pricePaise: type.pricePaise,
    maxQty: type.maxQty,
    fulfilment: 'qikink',
    auto: true,
    collection: String(row.collection || 'drops').slice(0, 20),
    variants: Object.freeze(variants),
  });
}

/* Static catalogue + engine products. Static ids always win; at most LIMITS.maxLive live auto products. */
export function mergeCatalogue(base, rows, blanks, opts = {}) {
  const ids = new Set(base.products.map((p) => p.id));
  const extra = [];
  for (const r of rows || []) {
    if (ids.has(r && r.id)) continue;
    const p = productFromDesign(r, blanks, opts);
    if (!p) continue;
    if (!opts.includeRetired && extra.length >= LIMITS.maxLive) break;
    ids.add(p.id);
    extra.push(p);
  }
  if (!extra.length) return base;
  return Object.freeze({ ...base, products: Object.freeze([...base.products, ...extra]) });
}

/* Sales lines -> per product {units, revenuePaise, orders, last, recentUnits(14d)}. */
export function salesStats(lines, nowMs) {
  const since14 = istDay(nowMs - 14 * DAY);
  const out = {};
  for (const l of lines || []) {
    const s = out[l.product_id] || (out[l.product_id] = { units: 0, revenuePaise: 0, orders: 0, last: null, recentUnits: 0, recentRevenuePaise: 0 });
    s.units += Number(l.units) || 0;
    s.revenuePaise += Number(l.revenue_paise) || 0;
    s.orders += 1;
    if (!s.last || l.day > s.last) s.last = l.day;
    if (l.day >= since14) { s.recentUnits += Number(l.units) || 0; s.recentRevenuePaise += Number(l.revenue_paise) || 0; }
  }
  return out;
}

const ageDays = (iso, nowMs) => (iso ? (nowMs - Date.parse(String(iso).replace(' ', 'T') + (String(iso).endsWith('Z') ? '' : 'Z'))) / DAY : 0);

/* Daily lifecycle decisions. Returns { promote: [ids], retire: [{id, reason}] }. */
export function lifecycle(designs, stats, nowMs, opts = {}) {
  const sellableType = (t) => !opts.blanks || (Array.isArray(opts.blanks[t]) && opts.blanks[t].length > 0);
  const live = designs.filter((d) => d.status === 'live' && sellableType(d.product_type));
  const retire = [];
  for (const d of live) {
    const s = stats[d.id];
    const age = ageDays(d.live_at || d.created_at, nowMs);
    if (!s && age >= LIMITS.retireUnsoldDays) retire.push({ id: d.id, reason: 'no sales in ' + LIMITS.retireUnsoldDays + ' days' });
    else if (s && s.last && (nowMs - Date.parse(s.last + 'T00:00:00Z')) / DAY >= LIMITS.retireColdDays) retire.push({ id: d.id, reason: 'no sales in ' + LIMITS.retireColdDays + ' days' });
  }
  const promote = [];
  if (opts.autopublish) {
    let room = LIMITS.maxLive - (live.length - retire.length);
    const queue = designs.filter((d) => d.status === 'review' && qcPassed(d) && sellableType(d.product_type)).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    for (const d of queue) {
      if (room <= 0 || promote.length >= LIMITS.maxNewPerDay) break;
      promote.push(d.id); room -= 1;
    }
  }
  return { promote, retire };
}

export function qcPassed(d) {
  try { const q = JSON.parse(d.qc_json || '{}'); return q && q.passed === true; } catch (_) { return false; }
}

/* On-site popularity: purchases count far more than clicks; recent activity (14 days) leads.
 * clicks: [{product_id, day, clicks}] (30 days), stats: salesStats(). Returns ids with score > 0, best first. */
export function popularity(clicks, stats, nowMs, limit = LIMITS.popular) {
  const since14 = istDay(nowMs - 14 * DAY);
  const score = {};
  for (const c of clicks || []) {
    const n = Number(c.clicks) || 0;
    score[c.product_id] = (score[c.product_id] || 0) + (c.day >= since14 ? n : n / 2);
  }
  for (const [id, s] of Object.entries(stats || {})) score[id] = (score[id] || 0) + s.recentUnits * 40 + s.units * 10;
  return Object.entries(score).filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit).map(([id]) => id);
}
