-- DESIGN ONLY: do not execute on the existing Worker without provisioned D1,
-- tested backups, migration review and an explicit cost cap.
-- Public editorial metadata, never user accounts, supplier net rates or chats.
CREATE TABLE IF NOT EXISTS public_destination (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 country_iso TEXT NOT NULL,
 region TEXT,
 lat REAL,
 lon REAL,
 aliases_json TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL CHECK(status IN ('candidate','researched','needs_review','approved','published','paused','rejected')),
 indexed INTEGER NOT NULL DEFAULT 0 CHECK(indexed IN (0,1)),
 canonical_url TEXT UNIQUE,
 locale TEXT NOT NULL DEFAULT 'en-IN',
 summary TEXT NOT NULL DEFAULT '',
 content_hash TEXT,
 r2_body_key TEXT,
 human_reviewer TEXT,
 human_approved_at TEXT,
 source_checked_at TEXT,
 next_review_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_destination_region ON public_destination(country_iso,region,status);
CREATE INDEX IF NOT EXISTS idx_destination_review ON public_destination(status,next_review_at);
CREATE INDEX IF NOT EXISTS idx_destination_public ON public_destination(indexed,status,locale);
CREATE TABLE IF NOT EXISTS public_destination_source (
 destination_id TEXT NOT NULL REFERENCES public_destination(id) ON DELETE CASCADE,
 source_id TEXT NOT NULL,
 source_url TEXT NOT NULL,
 supports TEXT NOT NULL,
 checked_at TEXT NOT NULL,
 expires_at TEXT,
 licence TEXT,
 PRIMARY KEY(destination_id,source_id)
);
CREATE TABLE IF NOT EXISTS public_destination_revision (
 destination_id TEXT NOT NULL REFERENCES public_destination(id) ON DELETE CASCADE,
 version INTEGER NOT NULL,
 sha256 TEXT NOT NULL,
 reviewer TEXT,
 changed_at TEXT NOT NULL,
 change_notes TEXT,
 previous_r2_key TEXT,
 PRIMARY KEY(destination_id,version)
);
-- Optional FTS5 table after validation and reversible backup/export plan.
-- D1 supports FTS5, but D1 virtual-table exports require special handling.
-- Do not store personal data or unsanitized external HTML in any column.
