-- Миграция для создания таблицы креаторов
-- Дата: 2026-03-02

-- Создаём таблицу креаторов
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  full_name TEXT,
  email TEXT NOT NULL,
  social_media TEXT,
  portfolio TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ограничение: один пользователь = один креатор
  CONSTRAINT unique_user_creator UNIQUE (user_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);
CREATE INDEX IF NOT EXISTS idx_creators_email ON creators(email);

-- Row Level Security (RLS)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Политики для креаторов
-- Креатор может видеть только свою запись
CREATE POLICY "Creators can view own record"
  ON creators FOR SELECT
  USING (auth.uid() = user_id);

-- Админы могут видеть все записи (пример с проверкой email)
CREATE POLICY "Admins can view all creators"
  ON creators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@tripgen.ru'
    )
  );

-- Пользователи могут создавать заявку на креатора
CREATE POLICY "Users can create creator application"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Креатор может обновлять свою запись
CREATE POLICY "Creators can update own record"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE creators IS 'Таблица креаторов и их заявок';
COMMENT ON COLUMN creators.status IS 'Статус: pending (на рассмотрении), approved (одобрен), rejected (отклонен)';
COMMENT ON COLUMN creators.user_id IS 'Ссылка на пользователя в auth.users';

-- Уведомление о перезагрузке схемы
notify pgrst, 'reload schema';
