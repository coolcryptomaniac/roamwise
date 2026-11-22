-- RoamWise public knowledge library v1.
-- Source of truth for CURATED travel knowledge only. Do not store user profiles,
-- authentication credentials, Cashfree orders or financial entitlements here.
CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  region TEXT,
  latitude REAL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL CHECK(longitude BETWEEN -180 AND 180),
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','published','archived')),
  last_reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_destinations_country_status ON destinations(country,status);
CREATE TABLE IF NOT EXISTS destination_aliases (
  alias TEXT PRIMARY KEY COLLATE NOCASE,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en'
);
CREATE INDEX IF NOT EXISTS idx_alias_dest ON destination_aliases(destination_id);
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  publisher TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  retrieved_at TEXT NOT NULL,
  reviewed_at TEXT,
  trust_level TEXT NOT NULL DEFAULT 'unverified'
    CHECK(trust_level IN ('unverified','editorial','official')),
  content_hash TEXT
);
CREATE TABLE IF NOT EXISTS destination_facts (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  fact TEXT NOT NULL,
  source_id TEXT REFERENCES knowledge_sources(id),
  valid_until TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_facts_destination_category ON destination_facts(destination_id,category,status);
CREATE TABLE IF NOT EXISTS destination_faq (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_id TEXT REFERENCES knowledge_sources(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_faq_dest ON destination_faq(destination_id,status);
CREATE TABLE IF NOT EXISTS itinerary_templates (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 60),
  itinerary_json TEXT NOT NULL CHECK(json_valid(itinerary_json)),
  source_id TEXT REFERENCES knowledge_sources(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_itinerary_dest_days ON itinerary_templates(destination_id,days,status);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  destination_id TEXT,
  r2_key TEXT UNIQUE,
  public_path TEXT,
  mime_type TEXT NOT NULL,
  width INTEGER CHECK(width IS NULL OR width>0),
  height INTEGER CHECK(height IS NULL OR height>0),
  alt_text TEXT NOT NULL,
  attribution TEXT NOT NULL DEFAULT '',
  rights_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(rights_status IN ('owned','licensed','public-domain','pending','rejected')),
  license_proof TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','reviewed','published','archived')),
  checksum_sha256 TEXT,
  uploaded_at TEXT,
  FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_media_destination ON media_assets(destination_id,status,rights_status);
CREATE TABLE IF NOT EXISTS public_listing_destinations (
  listing_id TEXT NOT NULL,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  listing_kind TEXT NOT NULL,
  verified_at TEXT,
  public_url TEXT NOT NULL,
  PRIMARY KEY(listing_id,destination_id)
);
-- Never infer payment readiness from rows in this library. Real-time room
-- inventory, order/charge status and prices are controlled by existing
-- trusted Firestore/Worker payment backends.
