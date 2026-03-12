-- Сделать пользователя fyrfadima@gmail.com креатором
-- Дата: 2026-03-02

-- Найти user_id по email и создать запись креатора
INSERT INTO creators (user_id, status, email, full_name, created_at, updated_at)
SELECT 
    id as user_id,
    'approved' as status,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users
WHERE email = 'fyrfadima@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET 
    status = 'approved',
    updated_at = NOW();

-- Проверка результата
SELECT 
    c.id as creator_id,
    c.user_id,
    c.email,
    c.status,
    c.created_at,
    c.updated_at
FROM creators c
WHERE c.email = 'fyrfadima@gmail.com';
