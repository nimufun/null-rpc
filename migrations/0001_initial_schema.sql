-- Migration number: 0001 	 2024-12-28T00:00:00.000Z
CREATE TABLE IF NOT EXISTS users (
  token TEXT PRIMARY KEY,
  plan TEXT DEFAULT 'hobbyist',
  created_at INTEGER NOT NULL,
  
  -- Rate Limiting & Usage (Synced from DO)
  current_month_requests INTEGER DEFAULT 0,
  month_reset_at INTEGER NOT NULL,
  
  -- Metadata
  address TEXT
);

CREATE INDEX IF NOT EXISTS idx_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_address ON users(address);
