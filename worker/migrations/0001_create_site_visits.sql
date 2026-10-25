CREATE TABLE IF NOT EXISTS site_visits (
  id TEXT PRIMARY KEY CHECK (id = 'home'),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0)
);

INSERT INTO site_visits (id, total)
VALUES ('home', 0)
ON CONFLICT(id) DO NOTHING;
