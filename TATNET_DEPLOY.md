# TatNet.ru Deployment Guide

## Настройка деплоя на TatNet.ru

### Инструкция по Git Deploy

1. **Подготовка репозитория**
   - Убедитесь, что проект находится на GitHub
   - Проверьте, что `.gitignore` исключает `.env` и другие секреты
   - Убедитесь, что `.env.example` содержит все необходимые переменные

2. **Создание проекта на TatNet.ru**
   - Зарегистрируйтесь на tatnet.ru
   - Создайте новый проект: "Node.js Application"
   - Выберите опцию "Git Deploy"

3. **Подключение GitHub репозитория**
   - Авторизуйте TatNet.ru в вашем GitHub аккаунте
   - Выберите репозиторий проекта
   - Укажите ветку для деплоя (рекомендуется `main`)

4. **Настройка параметров сборки**

   В панели TatNet.ru установите следующие параметры:

   ```
   Build Command: npm install && npm run build
   Start Command: node server/dist/index.js
   Node Version: 18
   Output Directory: dist
   ```

5. **Настройка переменных окружения**

   Добавьте следующие переменные в панели TatNet.ru:

   **Обязательные:**
   - `NODE_ENV=production`
   - `PORT=3001` (или другой доступный порт)
   - `OPENAI_API_KEY=ваш_ключ`
   - `VITE_SUPABASE_URL=ваш_url_supabase`
   - `VITE_SUPABASE_ANON_KEY=ваш_ключ_supabase`
   - `OSTROVOK_KEY_ID=ваш_key_id`
   - `OSTROVOK_API_TOKEN=ваш_api_token`
   - `OSTROVOK_API_URL=https://api.worldota.net`

   **Опциональные:**
   - `TELEGRAM_BOT_TOKEN=ваш_токен_бота`
   - `TELEGRAM_CHAT_ID=ваш_chat_id`
   - `VITE_GOOGLE_MAPS_API_KEY=ваш_ключ_google_maps`
   - `YANDEX_API_KEY=ваш_ключ_yandex`
   - `YANDEX_FOLDER_ID=ваш_folder_id`

   **База данных:**
   - `PGHOST=хост_postgresql`
   - `PGPORT=порт_postgresql`
   - `PGUSER=пользователь_postgresql`
   - `PGPASSWORD=пароль_postgresql`
   - `PGDATABASE=имя_базы_данных`

6. **Деплой**
   - Нажмите "Deploy" в панели TatNet.ru
   - Следите за логами сборки
   - После успешной сборки проект будет доступен по указанному домену

### Автоматический деплой

После настройки:
- Каждый пуш в указанную ветку GitHub автоматически запускает деплой
- TatNet.ru выполняет: `npm install` → `npm run build` → запуск сервера
- Логи доступны в панели управления

### Мониторинг

- Проверяйте логи в панели TatNet.ru
- Следите за использованием ресурсов
- Мониторьте работоспособность API эндпоинтов

### Решение проблем

**Сборка не проходит:**
- Проверьте версию Node.js
- Убедитесь, что все зависимости в `package.json`
- Посмотрите логи ошибок

**Сервер не запускается:**
- Проверьте `Start Command`
- Убедитесь, что порт доступен
- Проверьте переменные окружения

**API не работает:**
- Проверьте ключи API в переменных окружения
- Убедитесь, что API ключи активны
- Проверьте логи сервера

### Дополнительные ресурсы

- [Документация TatNet.ru](https://tatnet.ru/docs)
- [Git Deploy Guide](https://tatnet.ru/docs/git-deploy)
- [Node.js на TatNet.ru](https://tatnet.ru/docs/nodejs)