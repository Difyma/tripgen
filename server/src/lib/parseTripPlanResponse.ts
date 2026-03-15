/**
 * Парсинг и нормализация ответа модели. Синхронизировано с src/lib/parseTripPlanResponse.ts.
 */

import type { TripPlanResponse, TripPlanArea, TripPlanHotel, TripPlanDay } from '../types/tripPlan.js';

const JSON_START = /^\s*(\{[\s\S]*\})\s*$/;
const CODE_FENCE = /```(?:json)?\s*([\s\S]*?)```/;

export function extractJsonFromText(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const directMatch = trimmed.match(JSON_START);
  if (directMatch) return directMatch[1];
  const fenceMatch = trimmed.match(CODE_FENCE);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return null;
}

export function safeParseJson(jsonString: string | null): unknown {
  if (jsonString == null || typeof jsonString !== 'string') return null;
  try {
    return JSON.parse(jsonString) as unknown;
  } catch {
    return null;
  }
}

function toStrArray(x: unknown): string[] {
  const splitLines = (s: string) => s.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (Array.isArray(x)) {
    return (x as unknown[])
      .filter((e): e is string => typeof e === 'string')
      .flatMap((s) => splitLines(s.trim()));
  }
  if (typeof x === 'string' && x.trim()) return splitLines(x.trim());
  return [];
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return !Number.isNaN(n) ? n : 1;
  }
  return 1;
}

function starsNorm(v: unknown): number | string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  return undefined;
}

function strOrEmpty(s: unknown): string {
  return typeof s === 'string' ? s : '';
}

function strOpt(s: unknown): string | undefined {
  if (s == null) return undefined;
  const t = typeof s === 'string' ? s.trim() : String(s).trim();
  return t === '' ? undefined : t;
}

export function normalizeTripPlanResponse(parsed: unknown): TripPlanResponse | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;

  const tripSummary = strOrEmpty(o.tripSummary);
  const assumptions = toStrArray(o.assumptions);

  const recommendedAreasRaw = o.recommendedAreas;
  let recommendedAreas: TripPlanArea[] = [];
  if (Array.isArray(recommendedAreasRaw)) {
    recommendedAreas = (recommendedAreasRaw as unknown[]).map((a) => {
      const item = a && typeof a === 'object' && !Array.isArray(a) ? (a as Record<string, unknown>) : {};
      return { name: strOrEmpty(item.name), reason: strOrEmpty(item.reason) };
    });
  }

  const hotelRecsRaw = o.hotelRecommendations;
  let hotelRecommendations: TripPlanHotel[] = [];
  if (Array.isArray(hotelRecsRaw)) {
    hotelRecommendations = (hotelRecsRaw as unknown[]).map((h) => {
      const item = h && typeof h === 'object' && !Array.isArray(h) ? (h as Record<string, unknown>) : {};
      const bookingUrl = strOpt(item.bookingUrl);
      return {
        name: strOrEmpty(item.name),
        whyThisHotel: strOrEmpty(item.whyThisHotel),
        bookingUrl: bookingUrl === '' ? undefined : bookingUrl,
        photoUrl: strOpt(item.photoUrl),
        price: item.price != null ? String(item.price) : undefined,
        stars: starsNorm(item.stars),
        rating: item.rating != null ? String(item.rating) : undefined,
        address: strOpt(item.address),
        distanceToCenter: item.distanceToCenter != null ? String(item.distanceToCenter) : undefined,
        description: strOpt(item.description),
      };
    });
  }

  const itineraryRaw = o.itinerary;
  let itinerary: TripPlanDay[] = [];
  if (Array.isArray(itineraryRaw)) {
    itinerary = (itineraryRaw as unknown[]).map((d) => {
      const item = d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, unknown>) : {};
      return {
        day: toNum(item.day),
        title: strOpt(item.title),
        morning: toStrArray(item.morning),
        daytime: toStrArray(item.daytime),
        evening: toStrArray(item.evening),
      };
    });
  } else if (itineraryRaw && typeof itineraryRaw === 'object' && !Array.isArray(itineraryRaw)) {
    const obj = itineraryRaw as Record<string, unknown>;
    itinerary = [{
      day: toNum(obj.day),
      title: strOpt(obj.title),
      morning: toStrArray(obj.morning),
      daytime: toStrArray(obj.daytime),
      evening: toStrArray(obj.evening),
    }];
  }

  const highlights = toStrArray(o.highlights);
  const foodRecommendations = toStrArray(o.foodRecommendations);
  const practicalTips = toStrArray(o.practicalTips);
  const followUpQuestion = strOpt(o.followUpQuestion);

  return {
    tripSummary,
    assumptions,
    recommendedAreas,
    hotelRecommendations,
    itinerary,
    highlights,
    foodRecommendations,
    practicalTips,
    followUpQuestion,
  };
}

export function parseTripPlanResponse(raw: string | null | undefined): TripPlanResponse | null {
  const jsonStr = extractJsonFromText(raw);
  if (jsonStr == null) return null;
  const parsed = safeParseJson(jsonStr);
  if (parsed == null) return null;
  return normalizeTripPlanResponse(parsed);
}
