/* Shop engine: pure rules for auto-designed print-on-demand products. No network, no storage.
 *
 * Flow: the daily design workflow (tools/shop-engine/design.py) writes design rows to D1 `shop_designs`.
 * A row is sellable only when it is `live`, the engine is enabled and its product type has Qikink blank
 * SKUs configured. Prices come ONLY from PRODUCT_TYPES below (server side), never from the design row or
 * the browser. The daily cron scores products on real shipped sales, retires designs that never sold and
 * writes a promotion plan that the social/ads autopilot follows.
 *
 * Founder decisions encoded here (change in a reviewed PR): retail prices per type, how many auto
 * designs may be live at once, when an unsold design retires, and the rule that ads never spend more than
 * the daily cap set in the Worker variable SHOP_ADS_DAILY_CAP_INR (default 0 = no paid ads). */

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
  promoPosts: 2,          // products featured per day in organic posts
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
  const live = designs.filter((d) => d.status === 'live');
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
    const queue = designs.filter((d) => d.status === 'review' && qcPassed(d)).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
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

/* Score = recent revenue first, then lifetime, then freshness (new drops get a launch window). */
export function rankProducts(products, stats, designsById, nowMs) {
  return products.map((p) => {
    const s = stats[p.id] || { units: 0, revenuePaise: 0, recentUnits: 0, recentRevenuePaise: 0 };
    const d = designsById[p.id];
    const fresh = d ? Math.max(0, 7 - ageDays(d.live_at || d.created_at, nowMs)) : 0;
    const score = s.recentRevenuePaise / 100 + s.revenuePaise / 1000 + fresh * 150;
    return { id: p.id, score: Math.round(score), recentUnits: s.recentUnits, units: s.units, isNew: fresh > 0 };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/* Paid ads follow sales: only products that already sell get budget, never more than the daily cap. */
export function adsPlan(ranked, capInr) {
  const cap = Math.max(0, Math.floor(Number(capInr) || 0));
  if (!cap) return { dailyCapInr: 0, boosts: [], note: 'Paid ads are off (SHOP_ADS_DAILY_CAP_INR is 0).' };
  const sellers = ranked.filter((r) => r.recentUnits >= 2).slice(0, 3);
  if (!sellers.length) return { dailyCapInr: cap, boosts: [], note: 'No product has 2+ sales in 14 days yet; organic posts only.' };
  const weights = sellers.map((s, i) => [0.5, 0.3, 0.2][i]);
  const total = weights.reduce((a, b) => a + b, 0);
  return {
    dailyCapInr: cap,
    boosts: sellers.map((s, i) => ({ id: s.id, dailyInr: Math.floor((cap * weights[i]) / total) })),
    rules: 'Pause a boost after 3 days with return on ad spend under 1.0; never raise the total above the cap.',
  };
}

/* The public promotion plan (no counts or revenue: ranks and links only). */
export function promotionPlan(catalogue, ranked, nowMs, capInr, siteBase = 'https://roamwise.co.in') {
  const byId = Object.fromEntries(catalogue.products.map((p) => [p.id, p]));
  const card = (r) => {
    const p = byId[r.id];
    return p && { id: p.id, name: p.name, image: p.image, url: siteBase + '/shop/?buy=' + encodeURIComponent(p.id), priceInr: Math.round(p.pricePaise / 100), isNew: r.isNew, collection: p.collection || null };
  };
  const featured = ranked.slice(0, LIMITS.promoPosts).map(card).filter(Boolean);
  const ads = adsPlan(ranked, capInr);
  return {
    schemaVersion: 1,
    day: istDay(nowMs),
    featured,
    newDrops: ranked.filter((r) => r.isNew).map(card).filter(Boolean).slice(0, 6),
    ads: { ...ads, boosts: ads.boosts.map((b) => ({ ...b, product: card(ranked.find((r) => r.id === b.id)) })) },
  };
}
