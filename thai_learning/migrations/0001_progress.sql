CREATE TABLE IF NOT EXISTS progress (
  account TEXT PRIMARY KEY CHECK (account IN ('a', 'b')),
  revision INTEGER NOT NULL,
  snapshot TEXT NOT NULL
);
