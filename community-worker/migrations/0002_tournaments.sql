-- Only actual, verified events should be published. No fabricated seed tournaments.
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 8 AND 120),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 20 AND 2000),
  format TEXT NOT NULL,
  venue TEXT NOT NULL,
  organizer TEXT NOT NULL,
  game TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming','registration_open','ongoing','completed','cancelled')),
  starts_at TEXT NOT NULL,
  registration_closes_at TEXT,
  max_teams INTEGER NOT NULL CHECK (max_teams BETWEEN 2 AND 1024),
  prize_pool_mnt INTEGER NOT NULL DEFAULT 0 CHECK (prize_pool_mnt BETWEEN 0 AND 1000000000),
  registration_url TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0,1)),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tournaments_public ON tournaments (published, status, starts_at);
