-- Apply via: npx wrangler d1 migrations apply e-sport-community --remote
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'bug', 'experience')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  alias TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'planned', 'in_progress', 'shipped', 'rejected')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_public ON feedback (status, created_at DESC);

-- This stores only salted, rotating daily hashes; never raw IP addresses.
CREATE TABLE IF NOT EXISTS feedback_limits (
  fingerprint TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count BETWEEN 1 AND 3),
  PRIMARY KEY (fingerprint, day)
);
CREATE INDEX IF NOT EXISTS idx_feedback_limits_day ON feedback_limits (day);
