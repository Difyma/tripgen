# Ostrovok Link Builder

Модуль для генерации корректных партнерских ссылок Ostrovok (Emerging Travel Group).

## Подтверждение поддержки Ostrovok (интеграция B2B)

- **HP (страница отеля):** в URL используется **слаг отеля (id)**, не `hid`. Пример: у hid 7497440 слаг `aqua_aloha_surf_waikiki` → ссылка `https://www.ostrovok.ru/rooms/aqua_aloha_surf_waikiki/?...`
- **Параметры:** везде используется `partner_slug` (не `partner_id`), плюс `utm_medium=partners`, `utm_source`, при необходимости `dates`, `guests`, `cur`, `lang`, `partner_extra`.
- **SERP:** `https://www.ostrovok.ru/hotels/?q={region_id}&...` — список регионов: [Retrieve regions dump](https://docs.emergingtravel.com/docs/affiliate-api/static-content/retrieve-regions-dump/), автоподбор: [Suggest](https://docs.emergingtravel.com/docs/affiliate-api/hotel-search/suggest-hotel-and-region/).
- **Тестовые отели:** идентификаторы по документации — строковые: `test_hotel` (РФ), `test_hotel_do_not_book` (международный). В поиске по API передавать `ids: ['test_hotel', 'test_hotel_do_not_book']`.

## Ключевые правила

### Идентификаторы
- `hid` (число) — используется в API, но **НЕ используется** в URL сайта
- `hotel_slug` / `id` (строка) — используется для ссылок на страницу отеля (`/rooms/{id}/`)
- `region_id` (число) — используется для SERP (поисковой выдачи)

### Партнерская атрибуция (обязательно!)
Каждая ссылка должна содержать:
- `partner_slug=<PARTNER_SLUG>` (например, `270392.affiliate.a0bd`)
- `utm_medium=partners`
- `utm_source=<PARTNER_SLUG>`

Опционально:
- `partner_extra` — идентификатор пользователя/сессии/канала

## Использование

### Базовый импорт

```typescript
import { 
  buildHotelPageLink,  // Страница отеля (HP)
  buildSerpLink,       // Поисковая выдача (SERP)
  buildBestOstrovokLink, // Автоматический выбор
  encodeGuests,        // Кодирование гостей
  validateAttribution, // Валидация ссылки
  TEST_HOTELS          // Тестовые отели
} from '@/lib/ostrovok';
```

### 1. Страница отеля (Hotel Page)

Используется когда известен `hotel_slug` (строка!):

```typescript
const url = buildHotelPageLink('test_hotel', {
  partnerSlug: '270392.affiliate.a0bd',
  checkIn: '2026-03-01',
  checkOut: '2026-03-03',
  rooms: [{ adults: 2 }],
  currency: 'RUB',
  lang: 'ru',
  partnerExtra: 'user_12345', // опционально
});
// Результат: https://www.ostrovok.ru/rooms/test_hotel/?partner_slug=...&utm_medium=partners&...
```

⚠️ **Важно**: Если передать число (hid) вместо slug — будет ошибка!

### 2. SERP (Поиск по региону)

Используется когда известен только `region_id`:

```typescript
const url = buildSerpLink(12345, {
  partnerSlug: '270392.affiliate.a0bd',
  checkIn: '2026-03-01',
  checkOut: '2026-03-03',
  rooms: [
    { adults: 2, childrenAges: [9, 12] },
    { adults: 1 }
  ],
});
// Результат: https://www.ostrovok.ru/hotels/?q=12345&partner_slug=...&...
```

### 3. Автоматический выбор

```typescript
const url = buildBestOstrovokLink({
  hotelSlug: hotel.slug,  // если null/undefined — будет SERP
  regionId: region.id,    // используется если нет hotelSlug
  params: {
    partnerSlug: '270392.affiliate.a0bd',
    checkIn: '2026-03-01',
    checkOut: '2026-03-03',
    rooms: [{ adults: 2 }],
  }
});
```

### Формат guests

```typescript
// 2 взрослых в 1 номере
[{ adults: 2 }] // → "2"

// 4 взрослых в 2 номерах
[{ adults: 2 }, { adults: 2 }] // → "2-2"

// 2 взрослых + ребенок 9 лет
[{ adults: 2, childrenAges: [9] }] // → "2and9"

// 2 взрослых + дети 9 и 12
[{ adults: 2, childrenAges: [9, 12] }] // → "2and9.12"

// 2 комнаты: первая 2+2детей, вторая 1 взрослый
[{ adults: 2, childrenAges: [9, 12] }, { adults: 1 }] // → "2and9.12-1"
```

### Валидация ссылки

```typescript
const result = validateAttribution(url);
console.log(result);
// {
//   valid: true/false,
//   errors: [], // или список ошибок
//   isHP: true/false,
//   isSERP: true/false
// }
```

### Тестовые отели

```typescript
import { TEST_HOTELS, createTestLink } from '@/lib/ostrovok';

// Тестовые отели
TEST_HOTELS.RU;              // 'test_hotel'
TEST_HOTELS.INTERNATIONAL;   // 'test_hotel_do_not_book'

// Быстрое создание тестовой ссылки
const testUrl = createTestLink();
```

## Алгоритм выбора типа ссылки

```
Если есть hotel_slug (строка, не число)
  → Hotel Page (HP)
Иначе если есть region_id
  → SERP
Иначе
  → Ошибка (нужен suggest для получения region_id)
```

## Архитектура интеграции

```
A. OstrovokApiClient     → HTTP запросы к API
B. Normalizer/Mapper     → Приведение ответа к модели
C. LinkBuilder (этот модуль) → Генерация ссылок
D. AttributionGuard      → Валидация параметров
E. Agent Tools           → Инструменты для агента
```

## Чеклист перед продакшеном

- [ ] Все ссылки только через LinkBuilder (никаких ручных конкатенаций)
- [ ] `partner_slug` + `utm_medium=partners` + `utm_source` всегда присутствуют
- [ ] `partner_extra` прокидывается как userId/sessionId
- [ ] Для теста используются `test_hotel` и `test_hotel_do_not_book`
- [ ] Никогда не используется hid в URL (только hotel_slug)

## Примеры URL

### Hotel Page (HP)
```
https://www.ostrovok.ru/rooms/test_hotel/
  ?partner_slug=270392.affiliate.a0bd
  &utm_medium=partners
  &utm_source=270392.affiliate.a0bd
  &dates=01.03.2026-03.03.2026
  &guests=2
  &cur=RUB
  &lang=ru
```

### SERP
```
https://www.ostrovok.ru/hotels/
  ?q=12345
  &partner_slug=270392.affiliate.a0bd
  &utm_medium=partners
  &utm_source=270392.affiliate.a0bd
  &dates=01.03.2026-03.03.2026
  &guests=2and9
```
