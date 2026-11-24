-- Source-attributed geographic identities only, not approved tourist guides.
CREATE TABLE IF NOT EXISTS public_place_index (
  source_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  country_iso TEXT NOT NULL,
  admin_region TEXT NOT NULL DEFAULT '',
  latitude REAL,
  longitude REAL,
  feature_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  attribution TEXT NOT NULL,
  source_date TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  CHECK(length(name) BETWEEN 1 AND 200),
  CHECK(length(name_key) BETWEEN 1 AND 200)
);
CREATE INDEX IF NOT EXISTS idx_public_place_name ON public_place_index(name_key,country_iso);
