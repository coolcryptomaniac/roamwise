-- RoamWise Work: interns and employees from application to exit (D1).
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,                -- random id; uid is filled on first Google sign-in
  uid TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,         -- lower-case, the Google account
  name TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  kind TEXT NOT NULL DEFAULT 'intern',        -- intern | employee
  track TEXT NOT NULL DEFAULT 'general',      -- finance | marketing | ops | partnerships | content | design | engineering | general
  role_title TEXT,
  status TEXT NOT NULL DEFAULT 'applied',     -- applied | offered | onboarding | active | exiting | alumni | declined
  start_date TEXT, end_date TEXT,
  stipend_monthly INTEGER,                    -- rupees; null = unpaid / not set
  stipend_note TEXT,
  manager TEXT,
  upi TEXT,                                   -- payout UPI id, entered by the member
  offer_accepted_at TEXT, nda_accepted_at TEXT, policy_accepted_at TEXT,
  exit_reason TEXT, last_day TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS team_members_status ON team_members(status);
CREATE TABLE IF NOT EXISTS team_pay (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- stipend | bonus | incentive | reimbursement
  period TEXT, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'due',   -- due | paid
  utr TEXT, note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), paid_at TEXT
);
CREATE INDEX IF NOT EXISTS team_pay_member ON team_pay(member_id);
CREATE TABLE IF NOT EXISTS team_docs (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- offer | certificate | experience | relieving | other
  title TEXT NOT NULL, url TEXT NOT NULL, issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS team_docs_member ON team_docs(member_id);
CREATE TABLE IF NOT EXISTS team_tasks (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL, title TEXT NOT NULL, detail TEXT, due TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | done
  created_at TEXT NOT NULL DEFAULT (datetime('now')), done_at TEXT
);
CREATE INDEX IF NOT EXISTS team_tasks_member ON team_tasks(member_id);
CREATE TABLE IF NOT EXISTS team_logs (
  member_id TEXT NOT NULL, day TEXT NOT NULL, hours REAL, summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (member_id, day)
);
CREATE TABLE IF NOT EXISTS team_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, what TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS team_events_member ON team_events(member_id);
