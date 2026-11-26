/* Shop products managed in D1 (migration 0003), merged on top of the code catalogue (lib/shop-catalogue.js).
 * Only status='live' products with at least one variant that has a provider SKU (or provider 'manual') can be
 * bought, and their price still comes only from the server. Code products always win on an id clash. */
const CACHE_MS = 60 * 1000;
let cache = { at: 0, rows: null };

export async function liveProducts(env, nowMs = Date.now()) {
  if (!env || !env.DB) return [];
  if (cache.rows && nowMs - cache.at < CACHE_MS) return cache.rows;
  try {
    const p = await env.DB.prepare("SELECT * FROM shop_products WHERE status = 'live'").all();
    const v = await env.DB.prepare("SELECT v.* FROM shop_variants v JOIN shop_products p ON p.id = v.product_id WHERE p.status = 'live'").all();
    const byP = {};
    for (const x of v.results || []) (byP[x.product_id] = byP[x.product_id] || []).push(x);
    const rows = (p.results || []).map((r) => Object.freeze({
      id: r.id, name: r.name, type: r.type, description: r.description, image: r.image, pricePaise: r.price_paise,
      maxQty: r.max_qty, fulfilment: r.provider, category: r.category, collection: r.collection || '',
      variants: Object.freeze((byP[r.id] || []).filter((x) => x.sku || r.provider === 'manual')
        .map((x) => Object.freeze(r.provider === 'printrove' ? { id: x.id, label: x.label, printroveSku: x.sku } : { id: x.id, label: x.label, qikinkSku: x.sku || null }))),
    })).filter((r) => r.variants.length && Number.isInteger(r.pricePaise) && r.pricePaise >= 100);
    cache = { at: nowMs, rows };
    return rows;
  } catch (e) { return cache.rows || []; }
}

export function mergeCatalogue(base, extra) {
  if (!extra || !extra.length) return base;
  const have = new Set(base.products.map((p) => p.id));
  return Object.freeze({ ...base, products: Object.freeze(base.products.concat(extra.filter((p) => !have.has(p.id)))) });
}

export function _resetCache() { cache = { at: 0, rows: null }; }
