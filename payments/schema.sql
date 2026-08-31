CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_product ON payment_attempts(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_provider ON payment_events(provider, received_at);
