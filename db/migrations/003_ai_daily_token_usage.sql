CREATE TABLE IF NOT EXISTS ai_daily_token_usage (
  subject_key TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_token_limit INTEGER NOT NULL DEFAULT 100000 CHECK (daily_token_limit > 0),
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subject_key, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_token_usage_date
  ON ai_daily_token_usage (usage_date DESC);

