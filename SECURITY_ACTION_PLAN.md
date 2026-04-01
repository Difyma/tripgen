# 🚨 План действий по устранению уязвимостей

## ⚡ НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (в течение 1 часа)

### 1. Ротация API ключей

Срочно смените ВСЕ следующие ключи:

| Сервис | Где сменить |
|--------|-------------|
| OpenAI | https://platform.openai.com/api-keys |
| OpenRouter | https://openrouter.ai/keys |
| Telegram Bot | @BotFather → /revoke |
| Ostrovok (ETG) | Саппорт: affiliate@ostrovok.ru |
| Supabase | Project Settings → API → Regenerate key |

### 2. Удаление .env файлов из Git

```bash
# Установить git-filter-repo (если ещё не установлен)
# macOS:
brew install git-filter-repo

# Linux:
pip install git-filter-repo

# Удалить .env файлы из истории Git
cd /path/to/your/project
git filter-repo --path .env --path server/.env --path uploads/.env --invert-paths

# Принудительный push (⚠️ Это перезапишет историю!)
git push origin --force --all
```

### 3. Бэкап текущих .env файлов

```bash
# Создать бэкапы
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp server/.env server/.env.backup.$(date +%Y%m%d_%H%M%S)
cp uploads/.env uploads/.env.backup.$(date +%Y%m%d_%H%M%S)
```

---

## 🔧 ИСПРАВЛЕНИЯ В КОДЕ (в течение 24 часов)

### Шаг 1: Запустить скрипт исправлений

```bash
./scripts/security-fix.sh
```

Этот скрипт:
- ✅ Добавит .env файлы в .gitignore
- ✅ Удалит жестко закодированный ключ из gptProxy.ts
- ✅ Создаст шаблон .env.example
- ✅ Очистит логи
- ✅ Создаст конфигурацию безопасности

### Шаг 2: Установить пакеты безопасности

```bash
npm install helmet express-rate-limit zod
```

### Шаг 3: Обновить сервер (server/src/index.ts)

```typescript
import { applySecurityMiddleware } from './config/security';

// После создания app
applySecurityMiddleware(app);
```

### Шаг 4: Настроить CORS для production

Отредактируйте `server/src/config/security.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://your-real-domain.com',  // ← Заменить на реальный домен
  'https://www.your-real-domain.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
```

---

## 📋 ЧЕКЛИСТ ПРОВЕРКИ

- [ ] Все API ключи ротированы
- [ ] Git история очищена от .env файлов
- [ ] .env добавлен в .gitignore
- [ ] Жестко закодированные ключи удалены из кода
- [ ] CORS настроен только для разрешённых доменов
- [ ] Rate limiting установлен
- [ ] Helmet установлен
- [ ] Input validation добавлен
- [ ] Логи очищены
- [ ] Приложение протестировано после изменений

---

## 🛡️ ДОПОЛНИТЕЛЬНЫЕ МЕРЫ БЕЗОПАСНОСТИ

### 1. Автоматическое сканирование

Установите GitGuardian или TruffleHog:

```bash
# TruffleHog
pip install truffleHog
trufflehog git file://.

# Или используйте pre-commit hook
pip install pre-commit
```

### 2. Snyk для сканирования зависимостей

```bash
npm install -g snyk
snyk auth
snyk test
snyk monitor
```

### 3. GitHub Secret Scanning

Включите в настройках репозитория:
- Settings → Security → Secret scanning

### 4. Включите 2FA для всех аккаунтов

- GitHub
- OpenAI
- Supabase
- Все остальные сервисы

---

## 🔍 ПРОВЕРКА ПОСЛЕ ИСПРАВЛЕНИЙ

```bash
# 1. Проверить, что .env не отслеживается
git status

# 2. Запустить сканер секретов
./scripts/scan-secrets.sh

# 3. Проверить, что приложение запускается
npm run dev

# 4. Проверить, что API endpoints работают
curl http://localhost:3001/api/test
```

---

## ⚠️ ВАЖНЫЕ ПРЕДУПРЕЖДЕНИЯ

1. **НЕ коммитьте .env файлы никогда!**
2. **НЕ храните ключи в коде!**
3. **ВСЕГДА используйте переменные окружения!**
4. **Регулярно ротируйте ключи (каждые 90 дней)!**
5. **Включите 2FA везде где возможно!**

---

## 📞 Контакты для помощи

- GitHub Security: https://github.com/security
- OpenAI Security: security@openai.com
- Telegram Security: security@telegram.org

---

**Последнее обновление:** 2026-03-30  
**Критичность:** 🔴 КРИТИЧЕСКАЯ
