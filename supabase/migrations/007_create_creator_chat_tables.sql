-- Таблицы для чата между креаторами и клиентами
-- Дата: 2026-03-02

-- Таблица чатов креатор-клиент
CREATE TABLE IF NOT EXISTS creator_client_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'closed', 'archived')) DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Уникальный чат для пары креатор-клиент
  CONSTRAINT unique_creator_client_chat UNIQUE (creator_id, client_id)
);

-- Таблица сообщений в чатах креатор-клиент
CREATE TABLE IF NOT EXISTS creator_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES creator_client_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('creator', 'client')) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_creator_client_chats_creator ON creator_client_chats(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_client_chats_client ON creator_client_chats(client_id);
CREATE INDEX IF NOT EXISTS idx_creator_client_chats_status ON creator_client_chats(status);
CREATE INDEX IF NOT EXISTS idx_creator_client_chats_last_message ON creator_client_chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_chat ON creator_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_sender ON creator_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_created ON creator_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_unread ON creator_chat_messages(chat_id, is_read) WHERE is_read = FALSE;

-- Row Level Security
ALTER TABLE creator_client_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_chat_messages ENABLE ROW LEVEL SECURITY;

-- Политики для creator_client_chats
-- Креатор видит свои чаты
CREATE POLICY "Creators can view their chats"
  ON creator_client_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = creator_client_chats.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Клиент видит свои чаты
CREATE POLICY "Clients can view their chats"
  ON creator_client_chats FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Креатор может создавать чаты
CREATE POLICY "Creators can create chats"
  ON creator_client_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = creator_client_chats.creator_id 
      AND creators.user_id = auth.uid()
      AND creators.status = 'approved'
    )
  );

-- Креатор может обновлять свои чаты
CREATE POLICY "Creators can update their chats"
  ON creator_client_chats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = creator_client_chats.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Политики для creator_chat_messages
-- Участники чата видят сообщения
CREATE POLICY "Chat participants can view messages"
  ON creator_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creator_client_chats 
      WHERE creator_client_chats.id = creator_chat_messages.chat_id
      AND (
        creator_client_chats.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM creators 
          WHERE creators.id = creator_client_chats.creator_id 
          AND creators.user_id = auth.uid()
        )
      )
    )
  );

-- Участники чата могут отправлять сообщения
CREATE POLICY "Chat participants can insert messages"
  ON creator_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM creator_client_chats 
      WHERE creator_client_chats.id = creator_chat_messages.chat_id
      AND (
        creator_client_chats.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM creators 
          WHERE creators.id = creator_client_chats.creator_id 
          AND creators.user_id = auth.uid()
        )
      )
    )
  );

-- Отправитель может обновлять свои сообщения (для пометки прочитанным)
CREATE POLICY "Participants can update messages"
  ON creator_chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creator_client_chats 
      WHERE creator_client_chats.id = creator_chat_messages.chat_id
      AND (
        creator_client_chats.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM creators 
          WHERE creators.id = creator_client_chats.creator_id 
          AND creators.user_id = auth.uid()
        )
      )
    )
  );

-- Функция для обновления last_message_at
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_client_chats
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления last_message_at
DROP TRIGGER IF EXISTS trg_update_chat_last_message ON creator_chat_messages;
CREATE TRIGGER trg_update_chat_last_message
  AFTER INSERT ON creator_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();

-- Функция для получения или создания чата
CREATE OR REPLACE FUNCTION get_or_create_creator_chat(
  p_creator_id UUID,
  p_client_id UUID
) RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_creator_exists BOOLEAN;
BEGIN
  -- Проверяем существование креатора
  SELECT EXISTS(
    SELECT 1 FROM creators WHERE id = p_creator_id AND status = 'approved'
  ) INTO v_creator_exists;
  
  IF NOT v_creator_exists THEN
    RAISE EXCEPTION 'Creator not found or not approved';
  END IF;

  -- Ищем существующий чат
  SELECT id INTO v_chat_id
  FROM creator_client_chats
  WHERE creator_id = p_creator_id AND client_id = p_client_id;

  -- Если нет - создаем
  IF v_chat_id IS NULL THEN
    INSERT INTO creator_client_chats (creator_id, client_id)
    VALUES (p_creator_id, p_client_id)
    RETURNING id INTO v_chat_id;
  END IF;

  RETURN v_chat_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Представление для получения чатов с информацией о собеседнике
CREATE OR REPLACE VIEW creator_chats_with_users AS
SELECT 
  c.id as chat_id,
  c.creator_id,
  c.client_id,
  c.status,
  c.last_message_at,
  c.created_at,
  cr.user_id as creator_user_id,
  cr.full_name as creator_name,
  cr.email as creator_email,
  cl.email as client_email,
  COALESCE(cl.raw_user_meta_data->>'full_name', cl.email) as client_name
FROM creator_client_chats c
JOIN creators cr ON cr.id = c.creator_id
JOIN auth.users cl ON cl.id = c.client_id;

-- Комментарии
COMMENT ON TABLE creator_client_chats IS 'Чаты между креаторами и клиентами';
COMMENT ON TABLE creator_chat_messages IS 'Сообщения в чатах креатор-клиент';

-- Уведомление о перезагрузке схемы
notify pgrst, 'reload schema';
