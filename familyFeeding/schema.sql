CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  milk TEXT NOT NULL CHECK (milk IN ('高纖','補體素','雙卡','一般')),
  status TEXT NOT NULL CHECK (status IN ('in_progress','completed','cancelled','interrupted','voided')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_feeding ON records(status) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS completed_by_finish ON records(finished_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS records_by_start ON records(started_at DESC);
CREATE TABLE IF NOT EXISTS record_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('edit','void')),
  changed_by TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT,
  changed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS changes_by_record ON record_changes(record_id, id DESC);

-- Version 2 keeps the original tables as an archive; the new interface reads only feedings.
CREATE TABLE IF NOT EXISTS feedings (
  id TEXT PRIMARY KEY,
  milk TEXT NOT NULL CHECK (milk IN ('高纖','補體素','雙卡','一般')),
  amount TEXT NOT NULL CHECK (amount IN ('whole','half')),
  fed_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed','voided')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS feedings_by_time ON feedings(fed_at DESC);
CREATE TABLE IF NOT EXISTS feeding_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feeding_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('edit','void')),
  before_json TEXT NOT NULL,
  after_json TEXT,
  changed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feeding_changes_by_id ON feeding_changes(feeding_id, id DESC);
