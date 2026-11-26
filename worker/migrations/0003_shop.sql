-- Shop catalogue managed from the founder screen (D1). Code-defined products in lib/shop-catalogue.js stay;
-- these are added on top. status: draft (hidden) | vote (shown as "I'd buy this", no checkout) | live (buyable).
CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'wear', image TEXT NOT NULL, price_paise INTEGER NOT NULL, max_qty INTEGER NOT NULL DEFAULT 5,
  provider TEXT NOT NULL DEFAULT 'qikink',   -- qikink | printrove | manual
  status TEXT NOT NULL DEFAULT 'draft', collection TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS shop_variants (
  product_id TEXT NOT NULL, id TEXT NOT NULL, label TEXT NOT NULL, sku TEXT,   -- provider SKU, server-only
  PRIMARY KEY (product_id, id)
);
CREATE TABLE IF NOT EXISTS shop_votes (
  product_id TEXT NOT NULL, voter TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (product_id, voter)
);
