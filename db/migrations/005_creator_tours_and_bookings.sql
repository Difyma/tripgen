CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS creator_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  duration TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days > 0),
  group_size TEXT DEFAULT '',
  min_group_size INTEGER DEFAULT 1 CHECK (min_group_size >= 0),
  max_group_size INTEGER DEFAULT 1 CHECK (max_group_size >= 0),
  price TEXT NOT NULL,
  price_value INTEGER NOT NULL DEFAULT 0 CHECK (price_value >= 0),
  category TEXT NOT NULL DEFAULT 'nature',
  category_name TEXT NOT NULL DEFAULT 'Природа',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  excludes JSONB NOT NULL DEFAULT '[]'::jsonb,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  accommodation JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_time TEXT DEFAULT '',
  spots_left INTEGER NOT NULL DEFAULT 0 CHECK (spots_left >= 0),
  start_date DATE,
  end_date DATE,
  guide_info JSONB,
  payment_method_title TEXT DEFAULT 'Оплата напрямую организатору',
  payment_instructions TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_tours_creator_id ON creator_tours (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_tours_status ON creator_tours (status, created_at DESC);

CREATE TABLE IF NOT EXISTS tour_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES creator_tours(id) ON DELETE SET NULL,
  source_tour_id TEXT,
  tour_name TEXT NOT NULL,
  client_user_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0),
  preferred_date DATE,
  comments TEXT DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_method_title TEXT DEFAULT 'Оплата напрямую организатору',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_booking_requests_creator_id ON tour_booking_requests (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tour_booking_requests_tour_id ON tour_booking_requests (tour_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tour_booking_requests_status ON tour_booking_requests (status, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_creator_tours_updated_at ON creator_tours;
CREATE TRIGGER set_creator_tours_updated_at
BEFORE UPDATE ON creator_tours
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_tour_booking_requests_updated_at ON tour_booking_requests;
CREATE TRIGGER set_tour_booking_requests_updated_at
BEFORE UPDATE ON tour_booking_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
