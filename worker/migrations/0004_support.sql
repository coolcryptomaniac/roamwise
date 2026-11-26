-- Voluntary "Support RoamWise" contributions (D1). Nothing is given in return.
CREATE TABLE IF NOT EXISTS support_contributions (
  id TEXT PRIMARY KEY, amount INTEGER NOT NULL,           -- rupees
  name TEXT, phone TEXT NOT NULL, email TEXT, message TEXT, show_name INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created',                 -- created | paid | failed
  environment TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), paid_at TEXT
);
CREATE INDEX IF NOT EXISTS support_status ON support_contributions(status);
