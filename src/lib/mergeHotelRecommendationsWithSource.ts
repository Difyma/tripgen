/**
 * Whitelist для hotelRecommendations: матчим с исходным списком отелей из контекста.
 * Чувствительные поля (name, bookingUrl, photoUrl, price, rating, stars, address, distanceToCenter, description)
 * берутся только из sourceHotels. От модели используем только whyThisHotel и порядок рекомендаций.
 * Отели, которых нет в sourceHotels, отфильтровываются.
 */

import type { TripPlanResponse, TripPlanHotel, SourceHotelForWhitelist } from '../types/tripPlan';

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findSourceHotel(
  modelName: string,
  sourceHotels: SourceHotelForWhitelist[]
): SourceHotelForWhitelist | undefined {
  const normalized = normalizeName(modelName);
  if (!normalized) return undefined;
  const byExact = sourceHotels.find((s) => normalizeName(s.name) === normalized);
  if (byExact) return byExact;
  const byIncludes = sourceHotels.find((s) =>
    normalizeName(s.name).includes(normalized) || normalized.includes(normalizeName(s.name))
  );
  return byIncludes;
}

function toTripPlanHotel(
  source: SourceHotelForWhitelist,
  whyThisHotel: string
): TripPlanHotel {
  const priceStr = source.price != null
    ? (typeof source.price === 'number' ? source.price.toLocaleString('ru-RU') : String(source.price))
    : undefined;
  const distanceStr = source.distanceToCenter != null
    ? (typeof source.distanceToCenter === 'number'
      ? (source.distanceToCenter < 1000 ? `${source.distanceToCenter} м` : `${(source.distanceToCenter / 1000).toFixed(1)} км`)
      : String(source.distanceToCenter))
    : undefined;
  return {
    name: source.name || 'Отель',
    whyThisHotel: whyThisHotel || '',
    bookingUrl: source.bookingUrl && String(source.bookingUrl).trim() ? String(source.bookingUrl).trim() : undefined,
    photoUrl: source.photoUrl && String(source.photoUrl).trim() ? String(source.photoUrl).trim() : undefined,
    price: priceStr,
    stars: source.stars,
    rating: source.rating != null ? String(source.rating) : undefined,
    address: source.address,
    distanceToCenter: distanceStr,
    description: source.description,
  };
}

/**
 * Заменяет hotelRecommendations в плане на версии, смапленные на sourceHotels.
 * Только отели, найденные в sourceHotels, попадают в результат; данные берутся из источника.
 */
export function mergeHotelRecommendationsWithSource(
  plan: TripPlanResponse,
  sourceHotels: SourceHotelForWhitelist[]
): TripPlanResponse {
  if (!Array.isArray(sourceHotels) || sourceHotels.length === 0) {
    return { ...plan, hotelRecommendations: [] };
  }

  const merged: TripPlanHotel[] = [];
  const used = new Set<number>();

  for (const rec of plan.hotelRecommendations) {
    const source = findSourceHotel(rec.name, sourceHotels);
    if (!source) continue;
    const idx = sourceHotels.indexOf(source);
    if (used.has(idx)) continue;
    used.add(idx);
    merged.push(toTripPlanHotel(source, rec.whyThisHotel));
  }

  return { ...plan, hotelRecommendations: merged };
}
