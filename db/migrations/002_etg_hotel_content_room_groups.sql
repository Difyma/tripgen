-- Raw hotel/info (Content API) — обновляется отдельно от поиска (cron ~ weekly).
CREATE TABLE IF NOT EXISTS etg_hotel_info (
  hid TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Группы номеров с rg_ext для матчинга с динамикой поиска.
CREATE TABLE IF NOT EXISTS etg_room_groups (
  hid TEXT NOT NULL,
  rg_ext_key TEXT NOT NULL,
  rg_ext JSONB NOT NULL,
  name TEXT,
  room_amenities JSONB,
  images JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (hid, rg_ext_key)
);

CREATE INDEX IF NOT EXISTS idx_etg_room_groups_hid ON etg_room_groups (hid);
