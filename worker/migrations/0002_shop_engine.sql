-- Shop engine (auto-designed print-on-demand products). Applied by the deploy workflow like 0001.
-- A design row becomes a checkout product only when status = 'live', SHOP_ENGINE_ENABLED = 'true'
-- and its product type has Qikink blank SKUs configured in worker/lib/shop-engine-blanks.js.
CREATE TABLE IF NOT EXISTS shop_designs (
  id TEXT PRIMARY KEY,              -- auto-YYYYMMDD-slug (a-z 0-9 -), also the product id
  product_type TEXT NOT NULL,       -- key of PRODUCT_TYPES in shop-engine-core.js
  title TEXT NOT NULL,              -- product name shown to buyers
  tagline TEXT NOT NULL DEFAULT '',
  collection TEXT NOT NULL DEFAULT 'drops', -- rave | kumaon | trend | travel | drops
  print_url TEXT NOT NULL,          -- print-ready PNG (public R2 media URL)
  mockup_url TEXT NOT NULL,         -- garment mockup shown on the shop
  placement TEXT NOT NULL DEFAULT 'back', -- front | back
  print_w_in REAL NOT NULL DEFAULT 12,
  print_h_in REAL NOT NULL DEFAULT 14,
  status TEXT NOT NULL DEFAULT 'review',  -- review | live | retired | rejected
  source TEXT NOT NULL DEFAULT '',  -- how the art was made (model, generator)
  qc_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  live_at TEXT,
  retired_at TEXT,
  retire_reason TEXT
);
CREATE INDEX IF NOT EXISTS shop_designs_status ON shop_designs(status);

-- One row per shipped order line (written when the order is submitted to the supplier). Idempotent.
CREATE TABLE IF NOT EXISTS shop_sales_lines (
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  units INTEGER NOT NULL,
  revenue_paise INTEGER NOT NULL,
  day TEXT NOT NULL,                -- YYYY-MM-DD, India time
  PRIMARY KEY (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS shop_sales_lines_product ON shop_sales_lines(product_id, day);
