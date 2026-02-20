# Запрос в поддержку Ostrovok - IP whitelist

## Тема
Добавить IP в белый список для ключа 12984 (403 not_allowed_host)

## Информация

**Key ID:** 12984  
**Contract:** 270392.affiliate.a0bd  
**Текущий IP:** 91.184.253.147  
**Domain:** (локальная разработка / тестовый сервер)

## Проблема

API возвращает `403 not_allowed_host` при запросе с IP 91.184.253.147.

Возможно, ключ привязан к другому IP или домену в настройках контракта.

## Варианты решения

### Вариант 1: Добавить текущий IP в белый список
Просьба добавить IP: `91.184.253.147`

### Вариант 2: Убрать ограничение по IP
Разрешить доступ с любого IP для тестирования

### Вариант 3: Привязать к домену
Указать домен для production (например, `ai-travel.vercel.app`)

## Тестовый запрос

```bash
curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/hotels/" \
  -H "Authorization: Basic MTI5ODQ6OGJlN2FlMjEtNjc1OS00YzQyLWFlMDktYWE4Yzk1OGQ4YzU0" \
  -H "Content-Type: application/json" \
  -d '{"hids":[1],"checkin":"2026-02-20","checkout":"2026-02-21","guests":[{"adults":2}]}'
```

**Ответ:**
```json
{
  "status": "error",
  "error": "not_allowed_host"
}
```

## Вопросы

1. Привязан ли ключ 12984 к конкретному IP/домену?
2. Можно ли добавить наш IP в белый список?
3. Или нужно использовать другой endpoint для разработки?

## Контакт
[Ваш email]
