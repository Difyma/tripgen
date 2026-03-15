/**
 * Фикстуры сырых ответов модели для тестов парсера и formatter.
 * Кейсы: valid json, json in code fence, text+json, invalid json, missing fields, empty itinerary.
 */

export const FIXTURE_VALID_JSON = `{
  "tripSummary": "Короткая поездка в Рим на выходные.",
  "assumptions": ["Бюджет средний"],
  "recommendedAreas": [{"name": "Центр", "reason": "Удобно пешком"}],
  "hotelRecommendations": [
    {
      "name": "Test Hotel",
      "whyThisHotel": "Хорошее соотношение цены и качества",
      "bookingUrl": "https://ostrovok.ru/room/test_hotel/",
      "photoUrl": "https://example.com/photo.jpg",
      "price": "5000",
      "stars": "4",
      "rating": "8",
      "address": "ул. Тестовая 1",
      "distanceToCenter": "1 км",
      "description": "Уютный отель"
    }
  ],
  "itinerary": [
    {"day": 1, "title": "Прилёт", "morning": ["Завтрак"], "daytime": ["Колизей"], "evening": ["Ужин"]}
  ],
  "highlights": ["Колизей"],
  "foodRecommendations": ["Траторию"],
  "practicalTips": ["Бронируйте билеты заранее"],
  "followUpQuestion": "Нужна ли виза?"
}`;

export const FIXTURE_JSON_IN_CODE_FENCE = `Вот ваш план:
\`\`\`json
{
  "tripSummary": "План на день.",
  "assumptions": [],
  "recommendedAreas": [],
  "hotelRecommendations": [],
  "itinerary": [{"day": 1, "title": "День 1", "morning": ["Утро"], "daytime": [], "evening": []}],
  "highlights": [],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}
\`\`\`
Готово.`;

export const FIXTURE_TEXT_BEFORE_AND_AFTER_JSON = `Конечно, вот структурированный план:
{"tripSummary":"Мини-путешествие.","assumptions":[],"recommendedAreas":[],"hotelRecommendations":[],"itinerary":[],"highlights":[],"foodRecommendations":[],"practicalTips":[],"followUpQuestion":""}
Надеюсь, поможет!`;

export const FIXTURE_INVALID_JSON = `Это не JSON вообще, просто текст от модели. Никаких структур.`;

export const FIXTURE_BROKEN_JSON = `{"tripSummary": "без закрывающей скобки`;

export const FIXTURE_MISSING_FIELDS = `{
  "tripSummary": "Только обзор"
}`;

export const FIXTURE_EMPTY_ITINERARY = `{
  "tripSummary": "Обзор",
  "assumptions": [],
  "recommendedAreas": [],
  "hotelRecommendations": [],
  "itinerary": [],
  "highlights": [],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}`;

/** itinerary как объект вместо массива (модель "гуляет"). */
export const FIXTURE_ITINERARY_AS_OBJECT = `{
  "tripSummary": "Один день",
  "assumptions": [],
  "recommendedAreas": [],
  "hotelRecommendations": [],
  "itinerary": {"day": 1, "title": "День 1", "morning": ["Завтрак"], "daytime": [], "evening": []},
  "highlights": [],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}`;

/** morning/daytime/evening как строка вместо массива. */
export const FIXTURE_ITINERARY_STRINGS = `{
  "tripSummary": "План",
  "assumptions": [],
  "recommendedAreas": [],
  "hotelRecommendations": [],
  "itinerary": [{"day": 1, "title": "День 1", "morning": "Завтрак в кафе", "daytime": [], "evening": "Прогулка"}],
  "highlights": [],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}`;

/** stars как number, rating как number, пустой bookingUrl. */
export const FIXTURE_HOTEL_TYPES_VARIATIONS = `{
  "tripSummary": "Обзор",
  "assumptions": [],
  "recommendedAreas": [],
  "hotelRecommendations": [
    {
      "name": "Отель А",
      "whyThisHotel": "Рекомендую",
      "bookingUrl": "",
      "photoUrl": "https://example.com/a.jpg",
      "price": 7000,
      "stars": 4,
      "rating": 8.5,
      "address": "ул. А",
      "distanceToCenter": "2 км",
      "description": ""
    }
  ],
  "itinerary": [],
  "highlights": [],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}`;

export const FIXTURE_NO_HOTEL_RECOMMENDATIONS = `{
  "tripSummary": "Маршрут без отелей.",
  "assumptions": [],
  "recommendedAreas": [{"name": "Центр", "reason": "Удобно"}],
  "hotelRecommendations": [],
  "itinerary": [{"day": 1, "title": "День 1", "morning": ["Утро"], "daytime": [], "evening": []}],
  "highlights": ["Музей"],
  "foodRecommendations": [],
  "practicalTips": [],
  "followUpQuestion": ""
}`;
