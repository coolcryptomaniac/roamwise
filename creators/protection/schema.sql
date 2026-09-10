CREATE TABLE IF NOT EXISTS cp_actors (
  uid TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('creator','brand')),
  status TEXT NOT NULL CHECK(status IN ('pending','active','suspended')),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  provider_vendor_id TEXT NOT NULL DEFAULT '',
  minimum_paid_minor INTEGER NOT NULL DEFAULT 0,
  accepts_barter INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cp_campaigns (
  id TEXT PRIMARY KEY,
  brand_uid TEXT NOT NULL,
  creator_uid TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK(kind IN ('paid','hybrid','barter')),
  status TEXT NOT NULL,
  creator_slots INTEGER NOT NULL DEFAULT 1,
  deliverables_json TEXT NOT NULL,
  milestones_json TEXT NOT NULL,
  usage_rights TEXT NOT NULL,
  exclusivity_days INTEGER NOT NULL DEFAULT 0,
  accommodation_nights INTEGER NOT NULL DEFAULT 0,
  meals_included INTEGER NOT NULL DEFAULT 0,
  application_deadline TEXT NOT NULL DEFAULT '',
  travel_start TEXT NOT NULL DEFAULT '',
  creator_minimum_minor INTEGER NOT NULL DEFAULT 0,
  creator_fee_minor INTEGER NOT NULL DEFAULT 0,
  travel_reimbursement_minor INTEGER NOT NULL DEFAULT 0,
  creator_receives_minor INTEGER NOT NULL DEFAULT 0,
  service_fee_minor INTEGER NOT NULL DEFAULT 0,
  service_tax_minor INTEGER NOT NULL DEFAULT 0,
  total_payable_minor INTEGER NOT NULL DEFAULT 0,
  provider TEXT NOT NULL DEFAULT '',
  provider_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(brand_uid) REFERENCES cp_actors(uid)
);

CREATE TABLE IF NOT EXISTS cp_applications (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  creator_uid TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('submitted','accepted','declined','withdrawn')),
  note TEXT NOT NULL DEFAULT '',
  proposed_fee_minor INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(campaign_id, creator_uid),
  FOREIGN KEY(campaign_id) REFERENCES cp_campaigns(id),
  FOREIGN KEY(creator_uid) REFERENCES cp_actors(uid)
);

CREATE TABLE IF NOT EXISTS cp_disputes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open','resolved_creator','resolved_brand','split_resolution')),
  reason TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  resolution_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(campaign_id) REFERENCES cp_campaigns(id)
);

CREATE TABLE IF NOT EXISTS cp_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_uid TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY(campaign_id) REFERENCES cp_campaigns(id)
);

CREATE TABLE IF NOT EXISTS cp_webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  PRIMARY KEY(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_campaign_status ON cp_campaigns(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_cp_campaign_brand ON cp_campaigns(brand_uid, updated_at);
CREATE INDEX IF NOT EXISTS idx_cp_application_creator ON cp_applications(creator_uid, updated_at);
CREATE INDEX IF NOT EXISTS idx_cp_event_campaign ON cp_events(campaign_id, created_at);
