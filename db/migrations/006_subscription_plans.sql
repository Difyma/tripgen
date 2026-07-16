CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  eyebrow TEXT NOT NULL DEFAULT '',
  price_monthly_rub INTEGER NOT NULL DEFAULT 0 CHECK (price_monthly_rub >= 0),
  audience TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta TEXT NOT NULL DEFAULT '',
  ai_token_limit INTEGER NOT NULL DEFAULT 100000 CHECK (ai_token_limit > 0),
  trip_limit INTEGER CHECK (trip_limit IS NULL OR trip_limit >= 0),
  can_export_route BOOLEAN NOT NULL DEFAULT FALSE,
  can_share_trip BOOLEAN NOT NULL DEFAULT FALSE,
  priority_generation BOOLEAN NOT NULL DEFAULT FALSE,
  early_access BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_sort
  ON subscription_plans (is_active, sort_order, price_monthly_rub);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_plans_public_read ON subscription_plans;
CREATE POLICY subscription_plans_public_read
  ON subscription_plans
  FOR SELECT
  USING (is_active = TRUE);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY,
  plan_slug TEXT NOT NULL REFERENCES subscription_plans(slug),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  provider TEXT DEFAULT '',
  provider_subscription_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_status
  ON user_subscriptions (plan_slug, status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER set_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER set_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO subscription_plans (
  slug,
  name,
  eyebrow,
  price_monthly_rub,
  audience,
  description,
  intro,
  features,
  cta,
  ai_token_limit,
  trip_limit,
  can_export_route,
  can_share_trip,
  priority_generation,
  early_access,
  is_featured,
  is_active,
  sort_order
) VALUES
  (
    'free',
    'Free',
    'Для старта',
    0,
    'Попробовать сервис',
    'Базовый набор для первого маршрута.',
    '',
    '["AI-планировщик путешествий", "Ограниченный дневной лимит", "Сохранение до 3 поездок", "Базовые рекомендации"]'::jsonb,
    'Начать бесплатно',
    100000,
    3,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    10
  ),
  (
    'plus',
    'Plus',
    'Больше свободы',
    490,
    'Путешествует несколько раз в год',
    'Для регулярного планирования и сохранения маршрутов.',
    '',
    '["В 10 раз больше AI-лимита", "Неограниченное количество поездок", "Сохранение всех маршрутов", "Экспорт маршрута", "Совместный доступ к поездке", "Приоритетная скорость генерации"]'::jsonb,
    'Выбрать Plus',
    1000000,
    NULL,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    20
  ),
  (
    'pro',
    'Pro',
    'Максимум персонализации',
    990,
    'Частые путешественники',
    'Для сложных поездок и нескольких сценариев.',
    'Плюс ко всему:',
    '["Максимальный AI-лимит", "Расширенные маршруты", "Несколько вариантов поездки одновременно", "AI-консьерж", "Глубокая персонализация", "Доступ к новым функциям раньше остальных"]'::jsonb,
    'Выбрать Pro',
    3000000,
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    30
  ),
  (
    'premium',
    'Premium',
    'Для профессионалов',
    1990,
    'Digital nomads, тревел-блогеры, турагенты',
    'Для тех, кто планирует поездки постоянно или для клиентов.',
    'Все возможности Pro, плюс:',
    '["Расширенный AI-консьерж", "Глубокая персонализация профилей", "Приоритетный доступ к новым функциям", "Сценарии для клиентов и команд", "Больше вариантов маршрута одновременно", "Усиленная скорость генерации"]'::jsonb,
    'Выбрать Premium',
    8000000,
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    40
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  eyebrow = EXCLUDED.eyebrow,
  price_monthly_rub = EXCLUDED.price_monthly_rub,
  audience = EXCLUDED.audience,
  description = EXCLUDED.description,
  intro = EXCLUDED.intro,
  features = EXCLUDED.features,
  cta = EXCLUDED.cta,
  ai_token_limit = EXCLUDED.ai_token_limit,
  trip_limit = EXCLUDED.trip_limit,
  can_export_route = EXCLUDED.can_export_route,
  can_share_trip = EXCLUDED.can_share_trip,
  priority_generation = EXCLUDED.priority_generation,
  early_access = EXCLUDED.early_access,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
