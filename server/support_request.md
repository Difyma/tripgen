# Запрос в поддержку Ostrovok (ETG)

## Тема
Тестовый API ключ 12984 - 401 на sandbox, 403 на production

---

## Информация о ключе
- **Key ID:** 12984
- **API Token:** 8be7ae21-6759-4c42-ae09-aa8c958d8c54
- **Partner ID:** 270392.affiliate.a0bd
- **Тип ключа:** Тестовый (sandbox)

---

## Результаты тестирования

### 1. Production (api.worldota.net)
```bash
curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/hotels/" \
  -H "Authorization: Basic MTI5ODQ6OGJlN2FlMjEtNjc1OS00YzQyLWFlMDktYWE4Yzk1OGQ4YzU0" \
  -H "Content-Type: application/json" \
  -d '{"hids":[1],"checkin":"2026-03-25","checkout":"2026-03-26","guests":[{"adults":2,"children":[]}]}'
```
**Результат:** ❌ 403 not_allowed_host
**Заголовки ответа:**
```
x-api-metric: partner_slug=270389,contract_slug=270392.affiliate.a0bd,api_key_id=12984,...
x-partner-error-slug: not_allowed_host
```
**Вывод:** Авторизация работает, Key ID распознаётся, но endpoint не в белом списке.

---

### 2. Sandbox (api-sandbox.worldota.net)
```bash
curl -X POST "https://api-sandbox.worldota.net/api/b2b/v3/search/serp/hotels/" \
  -H "Authorization: Basic MTI5ODQ6OGJlN2FlMjEtNjc1OS00YzQyLWFlMDktYWE4Yzk1OGQ4YzU0" \
  -H "Content-Type: application/json" \
  -d '{"hids":[1],"checkin":"2026-03-25","checkout":"2026-03-26","guests":[{"adults":2,"children":[]}]}'
```
**Результат:** ❌ 401 incorrect_credentials

**Вывод:** Авторизация не проходит на sandbox.

---

## Вопросы

1. **Какой правильный endpoint для тестового ключа 12984?**
   - `api.worldota.net` (production) - но нужно добавить в белый список?
   - `api-sandbox.worldota.net` - но авторизация не работает?
   - Другой URL?

2. **Для sandbox нужны другие credentials?**
   - Другой Key ID?
   - Другой API Token?

3. **Как включить доступ для тестового ключа?**
   - Добавить в белый список `api.worldota.net`?
   - Или активировать sandbox для этого ключа?

---

## Параметры запроса
```json
{
  "hids": [1],
  "checkin": "2026-03-25",
  "checkout": "2026-03-26",
  "guests": [{"adults": 2, "children": []}],
  "language": "ru",
  "currency": "RUB",
  "residency": "ru"
}
```

**Примечание:** Используем `hids` (числовые ID) вместо устаревшего `ids`.

---

## Ожидаемый результат
Успешный поиск тестовых отелей:
- `test_hotel` (hid: 1)
- `test_hotel_do_not_book` (hid: 2)

---

## Контакт для связи
[Ваш email/телефон]
