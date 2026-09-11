CREATE TABLE IF NOT EXISTS go_settings (
  id TEXT PRIMARY KEY CHECK(id='control'),
  core_headcount INTEGER NOT NULL DEFAULT 0,
  contractor_count INTEGER NOT NULL DEFAULT 0,
  headcount_cap INTEGER NOT NULL DEFAULT 20,
  owned_asset_count INTEGER NOT NULL DEFAULT 0,
  recurring_workflow_count INTEGER NOT NULL DEFAULT 0,
  monthly_tool_budget_minor INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS go_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('partner','automation','support','compliance')),
  name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  status TEXT NOT NULL CHECK(status IN ('research','pending','active','blocked','resolved','retired')),
  priority TEXT NOT NULL CHECK(priority IN ('low','normal','high','critical')),
  human_gate INTEGER NOT NULL DEFAULT 0,
  monthly_cost_minor INTEGER NOT NULL DEFAULT 0,
  due_at TEXT NOT NULL DEFAULT '',
  evidence_url TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS go_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_uid TEXT NOT NULL,
  item_id TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_go_items_type_status ON go_items(type,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_go_items_due ON go_items(due_at,status);
CREATE INDEX IF NOT EXISTS idx_go_events_item ON go_events(item_id,created_at);
