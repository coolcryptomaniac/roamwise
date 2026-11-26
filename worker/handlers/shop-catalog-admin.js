/* Shop catalogue management (D1, migration 0003) and demand testing.
 *   GET  /shop/concepts             public: products in 'vote' status with their vote counts
 *   POST /shop/vote                 public: { id, voter }  one vote per device per product
 *   GET  /shop/admin/products       founder: everything incl. drafts, variants with SKUs, vote counts
 *   POST /shop/admin/product        founder: upsert { id, name, type, description, category, image, price_rupees,
 *                                   max_qty, provider, status, collection, variants:[{id,label,sku}] }
 * A product only becomes buyable when it is 'live' AND has a variant with a provider SKU (lib/shop-d1-catalogue.js). */
import { json } from '../lib/http.js';
import { _resetCache } from '../lib/shop-d1-catalogue.js';

const STATUSES = ['draft', 'vote', 'live'];
const PROVIDERS = ['qikink', 'printrove', 'manual'];
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const slug = (v) => str(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function body(request) { try { return await request.json(); } catch (e) { return {}; } }

export async function handleShopCatalog(request, env, path, deps = {}) {
  const db = env.DB;
  if (!db) return json({ error: 'not_configured' }, 503);
  if (path === 'shop/concepts' && request.method === 'GET') {
    const r = await db.prepare(`SELECT p.id, p.name, p.type, p.description, p.image, p.price_paise, p.category, p.collection,
      (SELECT COUNT(*) FROM shop_votes v WHERE v.product_id = p.id) AS votes FROM shop_products p WHERE p.status = 'vote' ORDER BY votes DESC, p.created_at DESC LIMIT 60`).all();
    return json({ concepts: (r.results || []).map((x) => ({ id: x.id, name: x.name, type: x.type, description: x.description, image: x.image, pricePaise: x.price_paise, category: x.category, collection: x.collection || '', votes: x.votes })) },
      200);
  }
  if (path === 'shop/vote' && request.method === 'POST') {
    const b = await body(request), id = slug(b.id), voter = str(b.voter, 64);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(voter)) return json({ error: 'bad_request' }, 400);
    const p = await db.prepare("SELECT id FROM shop_products WHERE id = ? AND status = 'vote'").bind(id).first();
    if (!p) return json({ error: 'not_found' }, 404);
    await db.prepare('INSERT OR IGNORE INTO shop_votes (product_id, voter) VALUES (?, ?)').bind(id, voter).run();
    const c = await db.prepare('SELECT COUNT(*) AS n FROM shop_votes WHERE product_id = ?').bind(id).first();
    return json({ ok: true, votes: c.n });
  }
  if (!path.startsWith('shop/admin/')) return json({ error: 'not_found' }, 404);
  if (!(deps.isAdmin && await deps.isAdmin(request, env))) return json({ error: 'forbidden' }, 403);

  if (path === 'shop/admin/products' && request.method === 'GET') {
    const p = await db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM shop_votes v WHERE v.product_id = p.id) AS votes FROM shop_products p ORDER BY p.status, votes DESC, p.updated_at DESC`).all();
    const v = await db.prepare('SELECT * FROM shop_variants').all();
    const byP = {}; for (const x of v.results || []) (byP[x.product_id] = byP[x.product_id] || []).push({ id: x.id, label: x.label, sku: x.sku || '' });
    return json({ products: (p.results || []).map((x) => ({ ...x, variants: byP[x.id] || [] })) });
  }
  if (path === 'shop/admin/product' && request.method === 'POST') {
    const b = await body(request), id = slug(b.id || b.name), name = str(b.name, 100), image = str(b.image, 500);
    const price = Math.round(Number(b.price_rupees) * 100), status = STATUSES.includes(b.status) ? b.status : 'draft', provider = PROVIDERS.includes(b.provider) ? b.provider : 'qikink';
    if (!id || !name || !/^https:\/\//.test(image) || !(price >= 100)) return json({ error: 'bad_request', message: 'Name, an https image and a price of at least Rs 1 are required.' }, 400);
    const variants = (Array.isArray(b.variants) ? b.variants : []).slice(0, 30).map((x) => ({ id: slug(x.id || x.label), label: str(x.label, 80), sku: str(x.sku, 80) })).filter((x) => x.id && x.label);
    if (status === 'live' && !variants.some((x) => x.sku || provider === 'manual')) return json({ error: 'needs_sku', message: 'Add at least one size/colour with its ' + provider + ' SKU before going live.' }, 400);
    await db.prepare(`INSERT INTO shop_products (id, name, type, description, category, image, price_paise, max_qty, provider, status, collection)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, type = excluded.type, description = excluded.description,
      category = excluded.category, image = excluded.image, price_paise = excluded.price_paise, max_qty = excluded.max_qty, provider = excluded.provider,
      status = excluded.status, collection = excluded.collection, updated_at = datetime('now')`)
      .bind(id, name, str(b.type, 80) || 'T-shirt', str(b.description, 600), str(b.category, 30) || 'wear', image, price,
        Math.max(1, Math.min(20, Math.round(+b.max_qty) || 5)), provider, status, str(b.collection, 60)).run();
    if (Array.isArray(b.variants)) {
      await db.prepare('DELETE FROM shop_variants WHERE product_id = ?').bind(id).run();
      for (const x of variants) await db.prepare('INSERT INTO shop_variants (product_id, id, label, sku) VALUES (?, ?, ?, ?)').bind(id, x.id, x.label, x.sku || null).run();
    }
    _resetCache();
    return json({ ok: true, id });
  }
  return json({ error: 'not_found' }, 404);
}
