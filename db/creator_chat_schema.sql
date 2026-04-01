-- Схема для системы чатов между креаторами и клиентами

-- Таблица чатов
CREATE TABLE IF NOT EXISTS creator_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creator_id, client_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS creator_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES creator_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('creator', 'client')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_creator_chats_creator_id ON creator_chats(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_chats_client_id ON creator_chats(client_id);
CREATE INDEX IF NOT EXISTS idx_creator_chats_last_message_at ON creator_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_chat_id ON creator_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_created_at ON creator_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_creator_chat_messages_recipient_read ON creator_chat_messages(recipient_id, is_read);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_creator_chats_updated_at ON creator_chats;
CREATE TRIGGER update_creator_chats_updated_at
    BEFORE UPDATE ON creator_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления last_message_at при новом сообщении
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE creator_chats
    SET last_message_at = NEW.created_at,
        unread_count = unread_count + 1
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_chat_on_new_message ON creator_chat_messages;
CREATE TRIGGER update_chat_on_new_message
    AFTER INSERT ON creator_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Триггер для сброса счетчика непрочитанных при прочтении
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        UPDATE creator_chats
        SET unread_count = GREATEST(0, unread_count - 1)
        WHERE id = NEW.chat_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS reset_unread_on_read ON creator_chat_messages;
CREATE TRIGGER reset_unread_on_read
    AFTER UPDATE ON creator_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_unread_count();

-- RLS Политики безопасности

-- Включить RLS
ALTER TABLE creator_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_chat_messages ENABLE ROW LEVEL SECURITY;

-- Политики для creator_chats
DROP POLICY IF EXISTS "Users can view their own chats" ON creator_chats;
CREATE POLICY "Users can view their own chats"
    ON creator_chats FOR SELECT
    USING (auth.uid() = creator_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can create chats" ON creator_chats;
CREATE POLICY "Users can create chats"
    ON creator_chats FOR INSERT
    WITH CHECK (auth.uid() = client_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own chats" ON creator_chats;
CREATE POLICY "Users can update their own chats"
    ON creator_chats FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = client_id);

-- Политики для creator_chat_messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON creator_chat_messages;
CREATE POLICY "Users can view messages in their chats"
    ON creator_chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM creator_chats
            WHERE id = creator_chat_messages.chat_id
            AND (creator_id = auth.uid() OR client_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages to their chats" ON creator_chat_messages;
CREATE POLICY "Users can send messages to their chats"
    ON creator_chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM creator_chats
            WHERE id = creator_chat_messages.chat_id
            AND (creator_id = auth.uid() OR client_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON creator_chat_messages;
CREATE POLICY "Recipients can mark messages as read"
    ON creator_chat_messages FOR UPDATE
    USING (recipient_id = auth.uid());
