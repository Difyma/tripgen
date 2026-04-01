#!/bin/bash

# 🔍 Скрипт для поиска потенциальных секретов в коде
# Использует регулярные выражения для поиска API ключей, токенов и паролей

set -e

echo "🔍 Сканирование кода на наличие потенциальных секретов..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Счетчики
CRITICAL=0
WARNINGS=0

# Функция для проверки
scan_file() {
    local file=$1
    local issues=0
    
    # Проверка на API ключи OpenAI
    if grep -nE "sk-(proj|or-v1)-[a-zA-Z0-9]{20,}" "$file" 2>/dev/null | grep -v "process.env" | grep -v ".env.example" | grep -v "#"; then
        echo -e "${RED}  🚨 CRITICAL: OpenAI/OpenRouter API Key found in $file${NC}"
        issues=$((issues + 1))
        CRITICAL=$((CRITICAL + 1))
    fi
    
    # Проверка на Telegram токены
    if grep -nE "[0-9]{8,10}:[a-zA-Z0-9_-]{35,}" "$file" 2>/dev/null | grep -v "process.env" | grep -v ".env.example" | grep -v "#"; then
        echo -e "${RED}  🚨 CRITICAL: Telegram Bot Token found in $file${NC}"
        issues=$((issues + 1))
        CRITICAL=$((CRITICAL + 1))
    fi
    
    # Проверка на JWT токены
    if grep -nE "eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" "$file" 2>/dev/null | grep -v "process.env" | grep -v ".env.example" | grep -v "#"; then
        echo -e "${YELLOW}  ⚠️  WARNING: Possible JWT Token found in $file${NC}"
        issues=$((issues + 1))
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Проверка на пароли
    if grep -nE "(password|passwd|pwd)\s*=\s*['\"][^'\"]+['\"]" "$file" 2>/dev/null | grep -v "process.env" | grep -v "// " | grep -v "/* " | grep -v "password:" | grep -v "example"; then
        echo -e "${YELLOW}  ⚠️  WARNING: Hardcoded password found in $file${NC}"
        issues=$((issues + 1))
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Проверка на приватные ключи
    if grep -n "BEGIN.*PRIVATE KEY" "$file" 2>/dev/null; then
        echo -e "${RED}  🚨 CRITICAL: Private Key found in $file${NC}"
        issues=$((issues + 1))
        CRITICAL=$((CRITICAL + 1))
    fi
    
    # Проверка на AWS ключи
    if grep -nE "AKIA[0-9A-Z]{16}" "$file" 2>/dev/null; then
        echo -e "${RED}  🚨 CRITICAL: AWS Access Key found in $file${NC}"
        issues=$((issues + 1))
        CRITICAL=$((CRITICAL + 1))
    fi
    
    return $issues
}

# Поиск файлов для сканирования (исключаем node_modules, .git, и т.д.)
echo "📁 Поиск файлов..."
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.vercel/*" 2>/dev/null)

TOTAL_FILES=$(echo "$FILES" | wc -l)
echo "  Найдено файлов для сканирования: $TOTAL_FILES"
echo ""

# Сканирование
for file in $FILES; do
    scan_file "$file"
done

echo ""
echo "=============================================="
echo "📊 Результаты сканирования:"
echo ""

if [ $CRITICAL -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Секретов не обнаружено!${NC}"
else
    echo -e "${RED}🚨 Критических проблем: $CRITICAL${NC}"
    echo -e "${YELLOW}⚠️  Предупреждений: $WARNINGS${NC}"
    echo ""
    echo "📝 Действия:"
    if [ $CRITICAL -gt 0 ]; then
        echo "   1. Немедленно удалите все API ключи из кода"
        echo "   2. Перенесите их в переменные окружения (.env)"
        echo "   3. Ротируйте (смените) все скомпрометированные ключи"
        echo "   4. Добавьте .env в .gitignore"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo "   - Проверьте предупреждения на наличие реальных секретов"
    fi
    exit 1
fi

echo "=============================================="
