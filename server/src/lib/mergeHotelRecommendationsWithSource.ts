/**
 * Whitelist для hotelRecommendations. Синхронизировано с src/lib/mergeHotelRecommendationsWithSource.ts.
 */

import type { TripPlanResponse, TripPlanHotel, SourceHotelForWhitelist } from '../types/tripPlan.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findSourceHotel(modelName: string, sourceHotels: SourceHotelForWhitelist[]): SourceHotelForWhitelist | undefined {
  const normalized = normalizeName(modelName);
  if (!normalized) return undefined;
  const byExact = sourceHotels.find((s) => normalizeName(s.name) === normalized);
  if (byExact) return byExact;
  return sourceHotels.find((s) =>
    normalizeName(s.name).includes(normalized) || normalized.includes(normalizeName(s.name))
  );
}

function toTripPlanHotel(source: SourceHotelForWhitelist, whyThisHotel: string): TripPlanHotel {
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
