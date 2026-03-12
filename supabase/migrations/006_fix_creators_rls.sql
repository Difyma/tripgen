-- Исправление RLS политик для таблицы creators
-- Дата: 2026-03-02

-- Удаляем старые политики
DROP POLICY IF EXISTS "Creators can view own record" ON creators;
DROP POLICY IF EXISTS "Admins can view all creators" ON creators;
DROP POLICY IF EXISTS "Users can create creator application" ON creators;
DROP POLICY IF EXISTS "Creators can update own record" ON creators;

-- Включаем RLS (если ещё не включено)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Политика 1: Аутентифицированные пользователи могут видеть свою запись
CREATE POLICY "Users can view own creator record"
  ON creators FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Политика 2: Анонимные пользователи НЕ могут видеть записи
CREATE POLICY "No anonymous access to creators"
  ON creators FOR SELECT
  TO anon
  USING (false);

-- Политика 3: Пользователи могут создавать заявку на креатора (только для себя)
CREATE POLICY "Users can insert own creator application"
  ON creators FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Политика 4: Пользователи могут обновлять свою запись
CREATE POLICY "Users can update own creator record"
  ON creators FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Политика 5: Пользователи могут удалять свою запись
CREATE POLICY "Users can delete own creator record"
  ON creators FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Политика 6: Service role имеет полный доступ (для admin операций)
CREATE POLICY "Service role full access"
  ON creators FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Проверка: все политики должны быть применены к authenticated роли
GRANT SELECT, INSERT, UPDATE, DELETE ON creators TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Уведомление о перезагрузке схемы
notify pgrst, 'reload schema';
