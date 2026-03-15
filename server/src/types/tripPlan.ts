/**
 * Типы для структурированного JSON-ответа AI-планировщика поездок.
 * Синхронизировано с src/types/tripPlan.ts.
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
