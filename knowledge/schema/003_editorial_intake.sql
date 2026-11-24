-- Private candidate/review queue. Never queried by the public reader.
CREATE TABLE IF NOT EXISTS public_editorial_intake (
 id TEXT PRIMARY KEY,
 destination_id TEXT NOT NULL REFERENCES public_destination(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('source','translation','image','video')),
 locale TEXT NOT NULL DEFAULT 'en-IN',
 candidate_json TEXT NOT NULL CHECK(json_valid(candidate_json)),
 status TEXT NOT NULL DEFAULT 'needs_review' CHECK(status IN ('needs_review','approved','rejected')),
 created_at TEXT NOT NULL,
 reviewed_at TEXT,
 reviewer TEXT,
 CHECK(status!='approved' OR (reviewed_at IS NOT NULL AND reviewer IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_editorial_intake_review ON public_editorial_intake(status,kind);
