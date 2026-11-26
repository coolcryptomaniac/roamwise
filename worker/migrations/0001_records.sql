-- Long-term records (D1). KV keeps caches and short-lived state; R2 keeps the files.
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,          -- YYYY-MM, India time
  paid_at TEXT NOT NULL,
  total REAL,
  json TEXT NOT NULL,
  stored_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS sales_month ON sales(month);
CREATE TABLE IF NOT EXISTS archive_log (
  key TEXT PRIMARY KEY,         -- R2 object key
  kind TEXT NOT NULL,           -- books | sale | kv-backup
  bytes INTEGER,
  stored_at TEXT NOT NULL DEFAULT (datetime('now'))
);
