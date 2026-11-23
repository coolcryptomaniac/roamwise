-- Optional RoamWise public-knowledge extension, not a production migration yet.
-- Apply ONLY to a dedicated new D1 database AFTER
-- knowledge/schema/001_public_destination_d1.sql and explicit acceptance.
-- Never mix with existing Firebase Auth/Firestore order/payment tables.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS public_destination_media (
  id TEXT PRIMARY KEY,
  destination_id TEXT REFERENCES public_destination(id) ON DELETE SET NULL,
  r2_key TEXT UNIQUE,
  public_url TEXT,
  mime_type TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  attribution TEXT NOT NULL DEFAULT '',
  rights_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(rights_status IN ('owned','licensed','public-domain','pending','rejected')),
  license_proof TEXT,
  checksum_sha256 TEXT,
  size_bytes INTEGER CHECK(size_bytes IS NULL OR size_bytes>=0),
  width INTEGER CHECK(width IS NULL OR width>0),
  height INTEGER CHECK(height IS NULL OR height>0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','reviewed','published','archived')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT,
  CHECK((status!='published') OR
        (rights_status IN ('owned','licensed','public-domain')
         AND license_proof IS NOT NULL
         AND length(trim(license_proof))>=12
         AND reviewed_at IS NOT NULL
         AND published_at IS NOT NULL
         AND size_bytes BETWEEN 1 AND 4194304
         AND mime_type IN ('image/avif','image/webp','image/jpeg','image/png')
         AND public_url IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_public_destination_media
  ON public_destination_media(destination_id,status,rights_status);
CREATE TABLE IF NOT EXISTS public_destination_faq (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES public_destination(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_id TEXT,
  reviewed_at TEXT,
  valid_until TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','reviewed','published','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_public_destination_faq
  ON public_destination_faq(destination_id,status);
CREATE TABLE IF NOT EXISTS public_destination_itinerary (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES public_destination(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 60),
  itinerary_json TEXT NOT NULL CHECK(json_valid(itinerary_json)),
  source_id TEXT,
  approved_by TEXT,
  approved_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','reviewed','published','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(status!='published' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_public_destination_itinerary
  ON public_destination_itinerary(destination_id,days,status);
-- Listing prices, availability, payment events and user profiles remain ONLY
-- in the existing authorised Worker / Firestore; never duplicate them here.
