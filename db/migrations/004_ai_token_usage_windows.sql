CREATE TABLE IF NOT EXISTS ai_token_usage_windows (
  subject_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL,
  token_limit INTEGER NOT NULL DEFAULT 100000 CHECK (token_limit > 0),
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subject_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_token_usage_windows_subject_latest
  ON ai_token_usage_windows (subject_key, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_ai_token_usage_windows_reset_at
  ON ai_token_usage_windows (reset_at DESC);
