# Ai Travel - TripGen

Проект генератора туристических маршрутов с использованием AI-технологий.

## 🏗️ Архитектура проекта

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL + Supabase
- **AI**: OpenAI API, Yandex GPT, OpenRouter
- **Hotel API**: Ostrovok (ETG API)

## 📋 Требования

- Node.js 18+
- npm или yarn
- PostgreSQL (для локальной разработки)

## 🚀 Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и заполните необходимые значения:

```bash
cp .env.example .env
```

Обязательные переменные:
- `OPENAI_API_KEY` - ключ OpenAI API
- `VITE_SUPABASE_URL` - URL Supabase проекта
- `VITE_SUPABASE_ANON_KEY` - анонимный ключ Supabase
- `OSTROVOK_KEY_ID` - ID ключа Ostrovok API
- `OSTROVOK_API_TOKEN` - токен Ostrovok API

### 3. Запуск разработки

```bash
# Запуск фронтенда и бэкенда одновременно
npm run dev

# Или отдельно:
npm run dev:vite        # Фронтенд (Vite)
npm run server:dev      # Бэкенд (Express)
```

### 4. Сборка проекта

```bash
npm run build
```

## 🌐 Деплой на TatNet.ru

### Подготовка проекта к деплою

1. **Убедитесь, что все секреты добавлены в `.gitignore`**
   - `.env` файлы не должны попадать в репозиторий
   - Используйте `.env.example` как шаблон

2. **Проверьте скрипты сборки в `package.json`**
   - `build` - сборка фронтенда
   - `server:build` - сборка бэкенда
   - `server:start` - запуск бэкенда

3. **Настройте переменные окружения на TatNet.ru**
   - Все переменные из `.env.example` должны быть добавлены в панели управления TatNet.ru
   - Особенно важны: `OPENAI_API_KEY`, `OSTROVOK_KEY_ID`, `OSTROVOK_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Варианты деплоя на TatNet.ru

#### Вариант 1: Git Deploy (рекомендуется)

TatNet.ru поддерживает автоматический деплой из Git-репозитория:

1. **Подключите Git-репозиторий**
   - В панели TatNet.ru выберите опцию "Git Deploy"
   - Подключите ваш GitHub репозиторий
   - Укажите ветку для деплоя (обычно `main` или `master`)

2. **Настройте параметры сборки**
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist` (для фронтенда)
   - **Start Command**: `node server/dist/index.js` (для бэкенда)
   - **Node Version**: 18 или выше

3. **Переменные окружения**
   - Добавьте все переменные из `.env.example` в настройки TatNet.ru
   - Установите `NODE_ENV=production`

4. **Автоматический деплой**
   - Каждый пуш в подключенную ветку вызывает автоматический деплой
   - TatNet.ru выполняет: `npm install` → `npm run build` → запуск сервера

#### Вариант 2: Ручной деплой через архив

1. **Соберите проект локально**
   ```bash
   npm install
   npm run build
   npm run server:build
   ```

2. **Создайте архив**
   ```bash
   # Исключите node_modules и .env
   tar -czf project.tar.gz --exclude=node_modules --exclude=.env --exclude=.git .
   ```

3. **Загрузите архив через панель TatNet.ru**
   - Используйте функцию загрузки архива
   - Укажите команду запуска: `node server/dist/index.js`

### Особенности деплоя

- **Фронтенд**: Статические файлы из папки `dist/`
- **Бэкенд**: Express сервер из `server/dist/index.js`
- **База данных**: PostgreSQL должна быть настроена на TatNet.ru или использоваться внешний Supabase
- **API ключи**: Все секреты должны быть настроены в переменных окружения TatNet.ru

## 🔒 Безопасность

- Все секреты хранятся в переменных окружения
- `.env` файлы добавлены в `.gitignore`
- Используйте разные ключи для development и production
- Регулярно обновляйте зависимости: `npm audit fix`

## 📝 Полезные команды

```bash
# Линтинг
npm run lint

# Тестирование бэкенда
npm run test:server

# Синхронизация данных с Ostrovok
npm run sync:hotels:full
npm run sync:hotels:incremental
npm run sync:regions:full

# Применение миграций базы данных
npm run db:migrate:002
npm run db:migrate:003
# и т.д.
```

## 🐛 Решение проблем

### Ошибка сборки на TatNet.ru
- Проверьте версию Node.js в настройках
- Убедитесь, что все зависимости указаны в `package.json`
- Проверьте логи сборки в панели TatNet.ru

### Ошибка подключения к API
- Убедитесь, что все ключи добавлены в переменные окружения
- Проверьте, что ключи активны и имеют лимиты
- Посмотрите логи сервера для детальной информации

### Проблемы с базой данных
- Проверьте настройки подключения к PostgreSQL
- Убедитесь, что миграции применены
- Проверьте права доступа к базе данных

## 📞 Поддержка

Для вопросов и проблем обращайтесь к документации:
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TatNet.ru Documentation](https://tatnet.ru/docs)

## 📄 Лицензия

Private project - All rights reserved