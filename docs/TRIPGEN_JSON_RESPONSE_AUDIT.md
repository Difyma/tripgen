# TripGen: аудит и план миграции на структурированный JSON-ответ

## Шаг 1. Аудит проекта

### 1. Где ожидается текстовый ответ модели

| Место | Файл | Что происходит |
|-------|------|----------------|
| Backend (non-stream) | `server/src/gptProxy.ts` | `assistantMessage = response.data.choices?.[0]?.message?.content` (строка), затем `res.json({ text: assistantMessage, hotels })`. |
| Backend (Vercel) | `api/openai.ts` | То же: чтение `response.data.choices?.[0]?.message?.content`, возврат `{ text: assistantMessage, hotels }`. |
| Frontend | `src/components/Chat.tsx` | Ожидает тело ответа с полем `text` или `response`; использует `responseText = data.response \|\| data.text` и опционально `data.hotels`. |

Streaming: при `stream: true` ответ стримится по кускам; накопленный текст показывается как раньше. JSON-парсинг в первой итерации применяем только к **нестриминговому** пути.

### 2. Какой формат ответа ждёт UI

- **Контракт ответа API:** `{ text?: string; response?: string; hotels?: AssistantHotel[]; error?: string; message?: string }`.
- **Использование:** `message.text` — строка (markdown), рендерится через `formatMessage(message.text)` (markdown → HTML). Опционально `message.hotels` для карточек отелей.
- **Тип сообщения:** `Message = { id, text: string, isUser, role?, hotels? }`. Менять контракт не требуется: UI по-прежнему получает `text` (строка) и при желании `hotels`.

### 3. Где безопасно вставить слой JSON → markdown

- **Точка вставки:** сразу после получения `assistantMessage` (сырой текст от OpenRouter) и **до** отправки `res.json({ text: ..., hotels })`.
- **Логика:**
  1. Попытка распарсить `assistantMessage` как JSON (TripPlanResponse).
  2. Если парсинг успешен → вызвать formatter → подставить результат в `text`.
  3. Если парсинг неудачен → оставить `text = assistantMessage` (fallback).
  4. Поле `hotels` можно по-прежнему брать из текущего контекста (Ostrovok) или при желании собирать из `hotelRecommendations` в том же формате AssistantHotel — контракт не меняется.

### 4. Существующие типы для сообщений чата

- В `Chat.tsx`: `Message` с полями `id`, `text`, `isUser`, `role?`, `hotels?`; `AssistantHotel` — `id`, `name`, `stars`, `rating?`, `address`, `price`, `currency`, `images?`, `bookingUrl?`, `distanceToCenter?`.
- Отдельных типов для «ответа планировщика» в проекте нет — добавляем новые в `src/types/tripPlan.ts`.

### 5. Где разместить новые артефакты

| Артефакт | Размещение | Примечание |
|----------|------------|------------|
| Типы | `src/types/tripPlan.ts` | TripPlanResponse, TripPlanArea, TripPlanHotel, TripPlanDay. |
| Системный промпт (JSON) | `src/prompts/travelJsonSystemPrompt.ts` | Экспорт `TRAVEL_JSON_SYSTEM_PROMPT`. |
| Parser | `src/lib/parseTripPlanResponse.ts` | Принимает raw string, возвращает TripPlanResponse \| null. |
| Formatter | `src/lib/formatTripPlanToMarkdown.ts` | TripPlanResponse → markdown строка для чата. |

**Парсинг ответа модели:** в двух местах — в `server/src/gptProxy.ts` (нестриминговый ответ) и в `api/openai.ts` (нестриминговый ответ). Стриминг пока не трогаем: там по-прежнему возвращается накопленный текст.

**Сборка:** сервер собирается отдельно (`tsc -p server/tsconfig.json`), в include только `server/**/*`. Чтобы не менять конфиг, логику парсера/форматтера и промпт дублируем под `server/src/` (например `server/src/lib/`, `server/src/prompts/`, `server/src/types/`) и используем в `gptProxy.ts`. В `api/openai.ts` импорты из `../src/` допустимы (Vercel собирает из корня).

---

## Шаг 2. Безопасная архитектура

1. **Типизированная схема** — `TripPlanResponse` и вложенные типы в `src/types/tripPlan.ts`.
2. **Formatter** — один модуль: `TripPlanResponse` → markdown (обзор, отели, маршрут по дням, советы и т.д.), без падений при отсутствии полей, без битых ссылок.
3. **Parser** — из сырой строки извлечь JSON (в т.ч. из обёртки типа \`\`\`json ... \`\`\` или текста до/после), нормализовать, вернуть объект или `null`.
4. **Fallback:** при `null` от парсера использовать исходный `assistantMessage` как `text` и текущий `hotels`; чат не ломается.

---

## Файлы, которые будут затронуты

| Действие | Файл |
|----------|------|
| **Новые** | `src/types/tripPlan.ts` |
| **Новые** | `src/prompts/travelJsonSystemPrompt.ts` |
| **Новые** | `src/lib/parseTripPlanResponse.ts` |
| **Новые** | `src/lib/formatTripPlanToMarkdown.ts` |
| **Новые (копии для server)** | `server/src/types/tripPlan.ts`, `server/src/prompts/travelJsonSystemPrompt.ts`, `server/src/lib/parseTripPlanResponse.ts`, `server/src/lib/formatTripPlanToMarkdown.ts` |
| **Изменения** | `server/src/gptProxy.ts` — подмена SYSTEM_PROMPT на JSON-промпт для нестрима, после получения ответа: parse → format или raw. |
| **Изменения** | `api/openai.ts` — то же: новый промпт, parse → format или raw. |

`src/components/Chat.tsx` не меняем: контракт ответа остаётся `{ text, hotels? }`.

---

## Обратная совместимость

- Ответ API по-прежнему: `{ text: string, hotels?: ... }`.
- При невалидном/не-JSON ответе `text` = исходный ответ модели.
- Стриминг не меняется (остаётся текстовый поток).
- bookingUrl и список отелей не теряются: либо из текущего контекста, либо при желании маппинг из `hotelRecommendations` в тот же формат.

После утверждения этого плана выполняется реализация (типы, промпт, parser, formatter, интеграция, fallback, проверки).

---

## Отчёт о реализации (выполнено)

### Изменённые файлы
- `server/src/gptProxy.ts` — подключены JSON-промпт, парсер и formatter; для нестримингового ответа используется `TRAVEL_JSON_SYSTEM_PROMPT`, после ответа: parse → format или raw; стриминг без изменений.
- `api/openai.ts` — то же: для нестрима JSON-промпт, parse → format или raw; контракт ответа `{ text, hotels }` сохранён.

### Новые файлы
- `src/types/tripPlan.ts` — типы TripPlanResponse, TripPlanArea, TripPlanHotel, TripPlanDay.
- `src/prompts/travelJsonSystemPrompt.ts` — русский системный промпт под JSON.
- `src/lib/parseTripPlanResponse.ts` — извлечение и нормализация JSON из сырого ответа.
- `src/lib/formatTripPlanToMarkdown.ts` — преобразование TripPlanResponse в markdown для чата.
- `server/src/types/tripPlan.ts`, `server/src/prompts/travelJsonSystemPrompt.ts`, `server/src/lib/parseTripPlanResponse.ts`, `server/src/lib/formatTripPlanToMarkdown.ts` — копии для сборки сервера (без доступа к корневому `src/`).

### Почему это безопасно
- Контракт API не менялся: клиент по-прежнему получает `{ text: string, hotels? }`.
- При невалидном/не-JSON ответе в `text` уходит исходный ответ модели (fallback).
- Стриминг не трогали: используется старый SYSTEM_PROMPT и сырой текст.
- `Chat.tsx` не менялся; формат сообщений и отображение markdown те же.

### Что проверить вручную
1. Отправить сообщение в чат (нестриминговый режим) и убедиться, что приходит читаемый ответ (markdown).
2. Убедиться, что отели и ссылки бронирования отображаются и не теряются.
3. При необходимости проверить fallback: временно подставить не-JSON ответ — в чате должен показаться сырой текст.
4. Сборка сервера: `npm run server:build` — проходит. Основной `npm run build` может падать из-за уже существующих ошибок в других файлах (Chat, HotelTestPage, ostrovokApi и др.); добавленный код от этого не зависит.

---

## Техдолг: дублирование src/ и server/src/

Сейчас одна и та же логика (типы, промпт, parser, formatter, merge) живёт в двух местах: `src/` и `server/src/`. Это временный компромисс из-за отдельной сборки сервера (`tsc -p server/tsconfig.json`), который не включает корневой `src/`.

**Проблема:** при изменениях легко забыть синхронизировать — через несколько итераций версии разойдутся.

**Рекомендуемые варианты (на будущее):**
- Вынести общее в `shared/` и подключать в обе сборки (Vite + server).
- Либо поправить server build так, чтобы он компилировал/подтягивал модули из `../src` (например, через project references или copy).
- Либо оформить как отдельный пакет `packages/trip-core` / `packages/shared-prompts`.

Пока дублирование оставлено как есть; при любом изменении parser/formatter/prompt/merge нужно править оба места (или скриптом синхронизировать).

---

## Follow-up: усиление безопасности (реализовано)

- **Явный normalizer:** этапы `extractJsonFromText` → `safeParseJson` → `normalizeTripPlanResponse`; учтены: itinerary как объект, morning/daytime/evening как строка, stars/rating как number/string/null, пустой bookingUrl, отсутствующие поля.
- **Whitelist отелей:** `mergeHotelRecommendationsWithSource(plan, sourceHotels)` — в ответ попадают только отели из контекста; чувствительные поля (name, bookingUrl, photoUrl, price, rating, stars, address, distanceToCenter, description) берутся из источника, от модели только `whyThisHotel` и порядок.
- **Defensive formatter:** экранирование спецсимволов в тексте (`escapeMarkdownText`), пустые блоки/секции не рендерятся, пустые/невалидные URL не вставляются, дни без активностей не выводятся.
- **Фикстуры:** `src/lib/__fixtures__/tripPlanResponses.ts` — кейсы: valid json, json in code fence, text+json, invalid json, broken json, missing fields, empty itinerary, itinerary as object, morning/evening as string, hotel types variations, no hotelRecommendations.
