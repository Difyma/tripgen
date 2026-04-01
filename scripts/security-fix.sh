#!/bin/bash

# 🔒 Скрипт исправления критических проблем безопасности
# Запускать из корневой директории проекта

set -e

echo "🔒 Начинаем исправление проблем безопасности..."
echo ""

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: запускать нужно из корневой директории проекта"
    exit 1
fi

echo "📋 Шаг 1: Проверка .env файлов..."
ENV_FILES=".env server/.env uploads/.env"
for file in $ENV_FILES; do
    if [ -f "$file" ]; then
        echo "  ⚠️  Найден: $file"
        # Делаем бэкап
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        echo "  💾 Создан бэкап"
    fi
done
echo ""

echo "🛠️  Шаг 2: Обновление .gitignore..."
cat >> .gitignore << 'EOF'

# 🔒 Security: Environment files
.env
.env.local
.env.*.local
server/.env
uploads/.env
api/.env

# 🔒 Security: Log files (may contain sensitive data)
*.log
logs/
log/

# 🔒 Security: Temporary files
*.tmp
.cache/
temp/
EOF
echo "  ✅ .gitignore обновлён"
echo ""

echo "🛠️  Шаг 3: Удаление жестко закодированного ключа..."
GPTPROXY_FILE="server/src/gptProxy.ts"
if [ -f "$GPTPROXY_FILE" ]; then
    # Проверяем, есть ли жестко закодированный ключ
    if grep -q "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" "$GPTPROXY_FILE"; then
        echo "  ⚠️  Найден жестко закодированный ключ в $GPTPROXY_FILE"
        # Заменяем
        sed -i.bak "s/const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';/const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;\nif (!OPENROUTER_API_KEY) {\n  throw new Error('OPENROUTER_API_KEY is required');\n}/g" "$GPTPROXY_FILE"
        echo "  ✅ Ключ удалён, добавлена проверка"
    else
        echo "  ℹ️  Жестко закодированный ключ не найден"
    fi
fi
echo ""

echo "🛠️  Шаг 4: Создание шаблона .env.example..."
cat > .env.example << 'EOF'
# 🔑 API Keys (заполнить реальными значениями)
OPENAI_API_KEY=your_openai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# 📱 Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# 🗄️ Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 🏨 Ostrovok (ETG) API
OSTROVOK_KEY_ID=your_key_id
OSTROVOK_API_TOKEN=your_api_token
OSTROVOK_API_URL=https://api.worldota.net
OSTROVOK_PARTNER_ID=your_partner_id

# ⚙️ Application
PORT=3001
NODE_ENV=production
EOF
echo "  ✅ Создан .env.example"
echo ""

echo "🛠️  Шаг 5: Очистка логов..."
find . -name "*.log" -type f -not -path "*/node_modules/*" -exec rm -f {} \; 2>/dev/null || true
echo "  ✅ Логи очищены"
echo ""

echo "📋 Шаг 6: Проверка установленных пакетов безопасности..."
echo "  Рекомендуется установить:"
echo "    npm install helmet express-rate-limit zod"
echo ""

echo "📝 Создание конфигурации безопасности..."
mkdir -p server/src/config

cat > server/src/config/security.ts << 'EOF'
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Express } from 'express';

/**
 * 🔒 Security Configuration
 * Configure security middleware for production
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com',
  'https://www.your-production-domain.com',
  // Development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

// CORS options
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in an hour',
  },
});

// Helmet configuration
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.worldota.net', 'https://api.openai.com'],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for some APIs
};

// Apply security middleware
export function applySecurityMiddleware(app: Express) {
  // Helmet for security headers
  app.use(helmet(helmetConfig));
  
  // CORS
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
  
  console.log('🔒 Security middleware applied');
}
EOF
echo "  ✅ Создана конфигурация безопасности: server/src/config/security.ts"
echo ""

echo "=============================================="
echo "✅ Базовые исправления применены!"
echo ""
echo "⚠️  ВАЖНЫЕ СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1. 🔄 РОТИРОВАТЬ ВСЕ API КЛЮЧИ (см. SECURITY_AUDIT_REPORT.md)"
echo "2. 🧹 Очистить Git историю:"
echo "   git filter-repo --path .env --path server/.env --invert-paths"
echo "   git push origin --force --all"
echo "3. 📦 Установить пакеты: npm install helmet express-rate-limit zod"
echo "4. 🔧 Обновить ALLOWED_ORIGINS в server/src/config/security.ts"
echo "5. 🧪 Протестировать приложение"
echo ""
echo "📄 Подробная инструкция в SECURITY_AUDIT_REPORT.md"
echo "=============================================="
