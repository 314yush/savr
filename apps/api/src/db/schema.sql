CREATE TABLE IF NOT EXISTS profiles (
  wallet_address TEXT PRIMARY KEY,
  email TEXT,
  email_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_metadata (
  goal_id BIGINT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  cover_image TEXT,
  reminder_cadence TEXT NOT NULL DEFAULT 'weekly' CHECK (reminder_cadence IN ('off', 'weekly', 'biweekly', 'monthly')),
  reminder_day INTEGER DEFAULT 1 CHECK (reminder_day BETWEEN 0 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  goal_id BIGINT,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_address, goal_id, notification_type, sent_at::date)
);

CREATE INDEX IF NOT EXISTS idx_goal_metadata_wallet ON goal_metadata(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
