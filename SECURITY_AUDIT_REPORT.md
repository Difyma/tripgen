# 🔒 Отчёт по аудиту безопасности

**Дата:** 2026-03-30  
**Уровень риска:** КРИТИЧЕСКИЙ ⚠️

---

## 🚨 Критические проблемы (требуют немедленного исправления)

### 1. .env файлы в Git истории
- **Файлы:** `.env`, `server/.env`, `uploads/.env`
- **Проблема:** Файлы с секретами были закоммичены в Git
- **Риск:** Все API ключи доступны в истории Git
- **Доказательство:**
  ```
  ee753d4 refs/heads/main fix creator form telegram and tour chats sidebar
  77521cf refs/heads/main feat: update components...
  ```

**Решение:**
```bash
# 1. Добавить в .gitignore
echo ".env" >> .gitignore
echo "server/.env" >> .gitignore
echo "uploads/.env" >> .gitignore

# 2. Удалить из Git истории (требуется BFG Repo-Cleaner или git-filter-repo)
git filter-repo --path .env --path server/.env --path uploads/.env --invert-paths

# 3. Принудительно обновить remote
git push origin --force --all
```

### 2. Жестко закодированный API ключ
- **Файл:** `server/src/gptProxy.ts:50`
- **Код:**
  ```typescript
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
  ```
- **Риск:** Ключ в открытом виде в коде

**Решение:**
```typescript
// Заменить на:
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is required');
}
```

### 3. Реальные API ключи в переменных окружения

Найдены следующие ключи:
- `OPENAI_API_KEY` - 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
- `OPENROUTER_API_KEY` - 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
- `TELEGRAM_BOT_TOKEN` - 8163677396:AAFbE7b1Y-iV6fP6Pa8sWKGRUdunio_UuHI
- `OSTROVOK_API_TOKEN` - 8be7ae21-6759-4c42-ae09-aa8c958d8c54
- `SUPABASE_ANON_KEY` - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

---

## ⚠️ Высокие риски

### 4. Небезопасная CORS конфигурация
- **Файлы:** 
  - `server/src/gptProxy.ts:40` - `origin: '*'`
  - `server/index.ts:37` - `origin: '*'`
  - `server/index.js:22` - `origin: '*'`
  - `server/proxy.js:9` - `origin: 'http://localhost:5173'`
  - `server.js:35` - `app.use(cors())`

- **Проблема:** Разрешены запросы с любых доменов
- **Риск:** CSRF атаки, API может быть использовано третьими лицами

**Решение:**
```typescript
// Для production
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Локальная разработка
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 5. Логи содержат чувствительные данные
- **Файлы:** `server.log`, `dev.log`
- **Проблема:** В логах видны запросы с данными пользователей

**Решение:**
```javascript
// Не логировать тело запроса с чувствительными данными
console.log('Request:', {
  method: req.method,
  path: req.path,
  // НЕ включаем body если там могут быть персональные данные
  userAgent: req.headers['user-agent']
});
```

---

## ⚡ Средние риски

### 6. Отсутствие Rate Limiting
- **Риск:** DDoS атаки, брутфорс API ключей

**Решение:**
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // лимит на IP
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);
```

### 7. Отсутствие Input Validation
- **Риск:** SQL Injection, XSS, NoSQL Injection

**Решение:**
```bash
npm install zod
```

```typescript
import { z } from 'zod';

const searchSchema = z.object({
  destination: z.string().min(1).max(100),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().min(1).max(10)
});

// В route
app.post('/api/search', (req, res) => {
  const result = searchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  // ...
});
```

### 8. Отсутствие Helmet (HTTP заголовки безопасности)

**Решение:**
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## 📋 Немедленные действия

### Шаг 1: Ротация ключей (СЕЙЧАС!)
1. **OpenAI** - https://platform.openai.com/api-keys
2. **OpenRouter** - https://openrouter.ai/keys
3. **Telegram Bot** - @BotFather → /revoke
4. **Ostrovok (ETG)** - Связаться с поддержкой
5. **Supabase** - Project Settings → API → Regenerate anon key

### Шаг 2: Очистка Git истории
```bash
# Установить git-filter-repo
brew install git-filter-repo  # macOS
# или
pip install git-filter-repo   # Linux/Windows

# Удалить .env файлы из истории
git filter-repo --path .env --path server/.env --path uploads/.env --invert-paths

# Принудительный push
git push origin --force --all
```

### Шаг 3: Обновить .gitignore
```bash
cat >> .gitignore << 'EOF'

# Environment files
.env
.env.local
.env.*.local
server/.env
uploads/.env

# Logs
*.log
logs/

# Temporary files
*.tmp
.cache/
EOF
```

### Шаг 4: Исправить код
1. Убрать жестко закодированный ключ из `server/src/gptProxy.ts:50`
2. Настроить CORS только для разрешённых доменов
3. Добавить rate limiting
4. Добавить input validation
5. Добавить helmet

---

## 🔍 Файлы с потенциальными утечками

```
.env
server/.env
uploads/.env
server/src/gptProxy.ts
server/test_ostrovok_debug.mjs
server/test_auth.js
server/test_auth_secret.mjs
server/support_request.md
server/test_auth.mjs
server/test_final.mjs
server.log
dev.log
```

---

## ✅ Чек-лист исправлений

- [ ] Ротировать ВСЕ API ключи
- [ ] Очистить Git историю от .env файлов
- [ ] Добавить .env в .gitignore
- [ ] Убрать жестко закодированные ключи из кода
- [ ] Настроить CORS правильно
- [ ] Добавить Rate Limiting
- [ ] Добавить Input Validation
- [ ] Добавить Helmet
- [ ] Очистить логи
- [ ] Настроить автоматическое сканирование (GitGuardian или TruffleHog)

---

## 📞 Рекомендации

1. **GitGuardian** - автоматическое сканирование коммитов на утечки
2. **TruffleHog** - поиск секретов в коде
3. **Snyk** - сканирование зависимостей
4. **OWASP ZAP** - тестирование API на проникновение

---

**Важно:** Все действия должны быть выполнены в течение 24 часов!
