# Настройка Ostrovok (ETG) API

## Текущий статус

✅ **API настроен и работает!**

## Ответ поддержки

> Для вашего тестового ключа актуален раздел **Affiliate API** и эндпоинты **без приставки sandbox**: https://docs.emergingtravel.com/docs/affiliate-api/
>
> Например: https://api.worldota.net/api/b2b/v3/overview/
>
> Так случилось, что в sandbox пока доступен не весь функционал AFF API, поэтому нами был создан тестовый ключ в продакшн среде. Он ограничен и позволяет бронировать только тестовый отель, а в остальном безопасен и при этом полноценен.
>
> Больше никаких дополнительных действий не требуется, мы используем базовую авторизацию.

## Что сделано

### 1. Исправлена авторизация ✅

Используется **Basic Auth** (Key ID + API Token):
- **Username (Key ID):** `12984`
- **Password (API Token):** `8be7ae21-...`

### 2. Исправлен endpoint ✅

- ✅ **Production:** `https://api.worldota.net` (используем этот)
- ❌ Sandbox: `https://api-sandbox.worldota.net` (не используем)

### 3. Исправлены параметры запроса ✅

- Используем `hids` (числовые ID) вместо устаревшего `ids`
- `test_hotel` → `hids: [1]`
- `test_hotel_do_not_book` → `hids: [2]`

### 4. Обновлены файлы ✅

- `server/dist/gptProxy.js` - основной прокси
- `server/dist/routes/hotels-full.js` - полная интеграция
- `server/dist/routes/hotels.js` - поиск отелей
- `server/dist/src/gptProxy.js` - исходник прокси
- `server/dist/src/routes/hotels.js` - исходник роутов

## Конфигурация

## Конфигурация

### .env файл

```env
# Production (после добавления в белый список)
OSTROVOK_KEY_ID=12984
OSTROVOK_API_TOKEN=8be7ae21-6759-4c42-ae09-aa8c958d8c54
OSTROVOK_API_URL=https://api.worldota.net

# Sandbox (если поддержка даст отдельные credentials)
# OSTROVOK_KEY_ID=xxx
# OSTROVOK_API_TOKEN=yyy
# OSTROVOK_API_URL=https://api-sandbox.worldota.net
```

## Тестирование

```bash
# Запустить тест
node server/test_final.mjs

# Или curl напрямую
curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/hotels/" \
  -H "Authorization: Basic MTI5ODQ6OGJlN2FlMjEtNjc1OS00YzQyLWFlMDktYWE4Yzk1OGQ4YzU0" \
  -H "Content-Type: application/json" \
  -d '{"hids":[1],"checkin":"2026-03-25","checkout":"2026-03-26","guests":[{"adults":2,"children":[]}]}'
```

## Fallback (резервный вариант)

Если API недоступен, приложение автоматически использует **демо-данные** (тестовые отели с mock-данными).

Это позволяет продолжать разработку и тестирование UI без рабочего API.

## Ссылки

- [Документация ETG API](https://docs.emergingtravel.com)
- [Postman коллекция](https://www.postman.com/ostrovok/emerging-travel-group-s-public-workspace)
