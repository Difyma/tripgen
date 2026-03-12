# Исправление партнерских ссылок Ostrovok

## Проблема
Была сгенерирована неправильная ссылка:
```
https://ostrovok.ru/rooms/7494005/?partner_id=270392.affiliate.a0bd&check_in=2026-03-05&check_out=2026-03-12&guests=2
```

Ошибки:
- ❌ `partner_id` вместо `partner_slug`
- ❌ `check_in/check_out` вместо `dates`
- ❌ Числовой `hid` (7494005) в URL вместо `hotel_slug`
- ❌ Нет `utm_medium=partners` и `utm_source`

## Решение

### 1. Создан LinkBuilder модуль
- `src/lib/ostrovok/links.ts` — TypeScript версия для клиента
- `server/lib/ostrovok-links.cjs` — CommonJS версия для сервера

### 2. Правильный формат ссылок

**Hotel Page (HP)** — когда известен `hotel_slug`:
```
https://www.ostrovok.ru/rooms/test_hotel/
  ?partner_slug=270392.affiliate.a0bd
  &utm_medium=partners
  &utm_source=270392.affiliate.a0bd
  &dates=05.03.2026-12.03.2026
  &guests=2
```

**SERP** — когда известен только `region_id`:
```
https://www.ostrovok.ru/hotels/
  ?q=1
  &partner_slug=270392.affiliate.a0bd
  &utm_medium=partners
  &utm_source=270392.affiliate.a0bd
  &dates=05.03.2026-12.03.2026
  &guests=2
```

### 3. Обновленные файлы
- `server/routes/hotels-full.ts` — теперь использует новый LinkBuilder
- `server/src/gptProxy.ts` — теперь использует новый LinkBuilder
- `src/services/ostrovok*.ts` — мигрированы на новый формат

### 4. Ключевые правила

| Что | API | URL сайта |
|-----|-----|-----------|
| Идентификатор | `hid` (число) | `hotel_slug` (строка) |
| Параметры | `checkin/checkout` | `dates` (DD.MM.YYYY-DD.MM.YYYY) |
| Гости | объект | `guests` (например: "2and9.12-2") |
| Атрибуция | — | `partner_slug` + `utm_*` |

### 5. Алгоритм выбора ссылки

```
Если hotel_slug известен и это строка (не число)
  → HP: /rooms/{hotel_slug}/
Иначе если region_id известен
  → SERP: /hotels/?q={region_id}
Иначе
  → Ошибка (нужен suggest)
```

### 6. Валидация

```javascript
const { validateAttribution } = require('./server/lib/ostrovok-links.cjs');

const result = validateAttribution(url);
// { valid: true/false, errors: [], isHP: true/false, isSERP: true/false }
```

## Тестирование

```javascript
// HP ссылка (для test_hotel)
buildHotelPageLink('test_hotel', {
  checkIn: '2026-03-05',
  checkOut: '2026-03-12',
  rooms: [{ adults: 2 }]
});

// SERP ссылка (для Москвы, region_id=1)
buildSerpLink(1, {
  checkIn: '2026-03-05',
  checkOut: '2026-03-12',
  rooms: [{ adults: 2 }]
});
```

## Проверка перед продом

- [ ] Все ссылки через LinkBuilder (нет ручной конкатенации)
- [ ] `partner_slug` присутствует
- [ ] `utm_medium=partners` присутствует
- [ ] `utm_source` присутствует
- [ ] Для HP: путь `/rooms/{slug}/`, где slug — не число
- [ ] Для SERP: параметр `q={region_id}`
