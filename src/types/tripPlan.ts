/**
 * Типы для структурированного JSON-ответа AI-планировщика поездок.
 * Контракт ответа модели (TripPlanResponse) → затем преобразуется в markdown для UI.
 */

export interface TripPlanArea {
  name: string;
  reason: string;
}

export interface TripPlanHotel {
  name: string;
  whyThisHotel: string;
  bookingUrl?: string;
  photoUrl?: string;
  price?: string;
  stars?: number | string;
  rating?: number | string;
  address?: string;
  distanceToCenter?: string;
  description?: string;
}

export interface TripPlanDay {
  day: number;
  title?: string;
  morning?: string[];
  daytime?: string[];
  evening?: string[];
}

export interface TripPlanResponse {
  tripSummary: string;
  assumptions?: string[];
  recommendedAreas: TripPlanArea[];
  hotelRecommendations: TripPlanHotel[];
  itinerary: TripPlanDay[];
  highlights?: string[];
  foodRecommendations?: string[];
  practicalTips?: string[];
  followUpQuestion?: string;
}

/**
 * Минимальный контракт отеля из контекста (Ostrovok/API) для whitelist.
 * Чувствительные поля в markdown берутся только из этих данных.
 */
export interface SourceHotelForWhitelist {
  name: string;
  bookingUrl?: string;
  photoUrl?: string;
  price?: number | string;
  currency?: string;
  rating?: number | string;
  stars?: number | string;
  address?: string;
  distanceToCenter?: number | string;
  description?: string;
}
