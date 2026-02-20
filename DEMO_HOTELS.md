# Реалистичные демо-данные отелей

Пока API Ostrovok недоступен, приложение использует реалистичные демо-данные для популярных направлений.

## Доступные направления

| Город | Отелей | Категории |
|-------|--------|-----------|
| 🇷🇺 Москва | 5 | Luxury, Business, Standard, Budget |
| 🇷🇺 Санкт-Петербург | 5 | Luxury, Boutique, Spa, Standard |
| 🇫🇷 Париж | 5 | Palace, Boutique, Standard, Budget |
| 🇹🇷 Стамбул | 4 | Palace, Boutique, Resort, Standard |
| 🇦🇪 Дубай | 4 | Luxury, Resort, Design, Business |
| 🇹🇭 Бангкок | 4 | Luxury, Boutique, Hostel, Standard |

## Примеры отелей

### Москва
- **The Ritz-Carlton Moscow** ⭐⭐⭐⭐⭐ — 45,000 ₽/ночь
- **Moscow Marriott Royal Aurora** ⭐⭐⭐⭐⭐ — 28,000 ₽/ночь  
- **Holiday Inn Moscow Suschevsky** ⭐⭐⭐⭐ — 8,500 ₽/ночь
- **Ibis Moscow Centre** ⭐⭐⭐ — 5,500 ₽/ночь

### Париж
- **Shangri-La Paris** ⭐⭐⭐⭐⭐ — 95,000 ₽/ночь (вид на Эйфелеву башню)
- **Four Seasons Hotel Lion Palace** ⭐⭐⭐⭐⭐ — 55,000 ₽/ночь
- **Mercure Paris Centre Tour Eiffel** ⭐⭐⭐⭐ — 22,000 ₽/ночь

### Дубай
- **Burj Al Arab Jumeirah** ⭐⭐⭐⭐⭐ — 180,000 ₽/ночь
- **Atlantis, The Palm** ⭐⭐⭐⭐⭐ — 75,000 ₽/ночь

## Особенности

- ✅ Реалистичные названия и цены
- ✅ Фотографии из Unsplash
- ✅ Описания на русском языке
- ✅ Адреса и рейтинги
- ✅ Удобства (Wi-Fi, бассейн, спа и т.д.)
- ✅ Расстояние до центра

## Тестовые отели (для API)

Когда API заработает, доступны тестовые отели:
- `test_hotel` (hid: 1)
- `test_hotel_do_not_book` (hid: 2)

⚠️ **Важно:** Тестовые бронирования нужно отменять!

## Как это работает

```
Пользователь запрашивает отели в "Париже"
         ↓
API Ostrovok недоступен (401/403)
         ↓
Используем демо-данные для Парижа
         ↓
Показываем 5 реалистичных отелей с фото и ценами
```

## Переключение на реальный API

Когда API заработает:

1. Получите от поддержки:
   - Доступ к `api.worldota.net` (production)
   - Или sandbox credentials

2. Обновите `.env`:
```env
OSTROVOK_KEY_ID=12984
OSTROVOK_API_TOKEN=8be7ae21-...
OSTROVOK_API_URL=https://api.worldota.net
```

3. Приложение автоматически начнёт использовать реальные данные

## Fallback логика

```typescript
if (API_KEY && !API_ERROR) {
  // Используем реальный API Ostrovok
  hotels = await searchOstrovokAPI(destination);
} else {
  // Fallback: используем демо-данные
  hotels = getDemoHotels(destination);
}
```
