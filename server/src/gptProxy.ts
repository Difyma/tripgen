/**
 * GPT Proxy with OpenRouter API and Ostrovok Hotels Integration
 * 
 * Flow:
 * 1. Receive chat request from client
 * 2. Extract location and dates from filters
 * 3. Search hotels via Ostrovok API
 * 4. Send enriched prompt to OpenRouter API
 * 5. Return GPT response with hotels data to client
 */

import express, { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import { DEMO_HOTELS as REALISTIC_DEMO_HOTELS, TEST_HOTELS, DemoHotel } from './demoHotels.js';
import { 
  buildHotelPageLink, 
  buildSerpLink,
  rewriteOstrovokHybridHotelPathToSerp,
  rewriteOstrovokHotelPathToRooms,
} from '../lib/ostrovok-links.cjs';
import { TRAVEL_JSON_SYSTEM_PROMPT } from './prompts/travelJsonSystemPrompt.js';
import { parseTripPlanResponse } from './lib/parseTripPlanResponse.js';
import { formatTripPlanToMarkdown } from './lib/formatTripPlanToMarkdown.js';
import { mergeHotelRecommendationsWithSource } from './lib/mergeHotelRecommendationsWithSource.js';
import type { SourceHotelForWhitelist, TripPlanDay } from './types/tripPlan.js';
import { ETG_ENABLE_TEST_FALLBACK, FORCE_TEST_HOTELS, hasEtgCredentials } from './config/etg.js';
import { normalizeDestination } from './etg/destinationNormalizer.js';
import { resolveSearchEndpoint } from './etg/endpointResolver.js';
import { searchSerpGeo, searchSerpHotels, searchSerpRegion } from './etg/searchClient.js';
import { createTraceId, logSearchStep, upsertTrace } from './diagnostics/searchLogger.js';
import { formatEtgImageUrlForServer, normalizeHotelPreviewImageUrlForServer } from './lib/etgHotelImageUrl.js';
import { addAiUsageTokens, getAiUsageSnapshot } from './storage/aiUsageRepository.js';
import { formatPlacesForPrompt, searchCuratedPlaces } from './places/curatedPlaces.js';
import {
  extractCancellationDeadlineLine,
  extractCancellationPolicyLine,
  extractCheckInOut,
  extractMealLine,
  extractTaxesLine,
} from './etg/extractCertRateFields.js';
import { hasPgConfig, getRoomGroupByRgExt } from './storage/etgContentRepository.js';

dotenv.config();

// Router setup
const router = express.Router();

// Enable CORS
const corsOptions = {
  origin: '*',
  methods: 'POST, GET',
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions));
router.use(express.json());

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}
// ETG API Configuration
// Key ID (Login) and API Token (Password) from contract settings
const OSTROVOK_KEY_ID = process.env.OSTROVOK_KEY_ID;           // e.g., '12984'
const OSTROVOK_API_TOKEN = process.env.OSTROVOK_API_TOKEN;     // e.g., '8be7ae21-...'
// Fallback for backwards compatibility
const OSTROVOK_API_KEY = process.env.OSTROVOK_API_KEY;
const OSTROVOK_API_SECRET = process.env.OSTROVOK_API_SECRET;
// ETG API Base URL
// Production: https://api.worldota.net
const OSTROVOK_API_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';
const parsedAiDailyTokenLimit = Number(process.env.AI_DAILY_TOKEN_LIMIT || 100000);
const AI_DAILY_TOKEN_LIMIT = Number.isFinite(parsedAiDailyTokenLimit)
  ? Math.max(1000, Math.round(parsedAiDailyTokenLimit))
  : 100000;
const AI_MAX_COMPLETION_TOKENS = 1500;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0].trim();
  if (Array.isArray(forwardedFor)) return String(forwardedFor[0] || '').split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getAiUsageKey(req: Request): string {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const payload = decodeJwtPayload(auth.slice('Bearer '.length).trim());
    const subject = typeof payload?.sub === 'string' ? payload.sub : '';
    if (subject) return `user:${subject}`;
  }
  return `anon:${getClientIp(req)}`;
}

function estimateTokensFromText(text: string): number {
  const clean = String(text || '').trim();
  if (!clean) return 0;
  return Math.ceil(clean.length / 4);
}

function estimateMessagesTokens(messages: Array<{ role?: string; content?: string }>): number {
  return messages.reduce((sum, msg) => sum + 4 + estimateTokensFromText(msg.role || '') + estimateTokensFromText(msg.content || ''), 0);
}

function getOpenRouterTotalTokens(response: any, fallback: number): number {
  const usage = response?.usage;
  const total = Number(usage?.total_tokens);
  if (Number.isFinite(total) && total > 0) return Math.round(total);
  const prompt = Number(usage?.prompt_tokens);
  const completion = Number(usage?.completion_tokens);
  if (Number.isFinite(prompt) || Number.isFinite(completion)) {
    return Math.max(0, Math.round((Number.isFinite(prompt) ? prompt : 0) + (Number.isFinite(completion) ? completion : 0)));
  }
  return Math.max(0, Math.round(fallback));
}

// Interfaces
interface FilterState {
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  durationDays?: number;
  budget: {
    min: number;
    max: number;
  };
  preferences: string[];
  travelers?: number;
  children?: number;
  childrenAges?: number[];
  certificationHotelIds?: string[];
}

interface Hotel {
  id: string;
  hid?: number;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  price: number;
  currency: string;
  images?: any[];
  description?: string;
  hotelType?: string;
  bookingUrl?: string;
  distanceToCenter?: number;
  rates?: OstrovokRate[];
  taxesAndFees?: string;
  mealType?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  checkInTime?: string;
  checkOutTime?: string;
  metapolicyHighlights?: string[];
  roomName?: string;
  roomAmenities?: string[];
  amenities?: string[];
}

interface OstrovokRate {
  match_hash?: string;
  book_hash?: string;
  room_name: string;
  daily_prices: string[];
  amount: number;
  currency: string;
  meal: string;
  meal_data?: {
    value: string;
    breakfast_included: boolean;
  };
}

interface OstrovokHotel {
  id: string;
  hid?: number;
  name: string;
  stars?: number;
  rating?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  hotel_type?: string;
  images_ext?: Array<{
    category: string;
    url: string;
  }>;
  rates?: OstrovokRate[];
  min_price?: number;
  currency?: string;
  description_struct?: Array<{
    text: string;
  }>;
  distance_center?: number;
}

type HotelInfoBrief = {
  name?: string;
  address?: string;
};

const HOTEL_INFO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const HOTEL_INFO_NEGATIVE_TTL_MS = 10 * 60 * 1000;
const HOTEL_INFO_ENRICH_LIMIT = 6;
const hotelInfoCache = new Map<string, { expiresAt: number; value: HotelInfoBrief | null }>();

// Logger
console.log('[GPT Proxy] Environment loaded:', {
  hasOpenRouterKey: !!OPENROUTER_API_KEY,
  hasOstrovokKey: !!OSTROVOK_API_KEY,
  hasOstrovokSecret: !!OSTROVOK_API_SECRET,
  partnerSlug: PARTNER_SLUG
});

// Auth headers for Ostrovok
// ETG B2B API uses Basic Auth: base64(KEY_ID:API_TOKEN)
// Key ID is the numeric ID from contract settings, API Token is the key value
const getOstrovokAuthHeaders = () => {
  // Prefer new format: Key ID + API Token
  const username = OSTROVOK_KEY_ID || OSTROVOK_API_KEY || '';
  const password = OSTROVOK_API_TOKEN || OSTROVOK_API_SECRET || '';
  
  return {
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': `PartnerName/ai-travel; ClientVersion/1.0.0`
  };
};

// City URL slugs for Ostrovok booking links
const CITY_URL_SLUGS: Record<string, string> = {
  'москва': 'russia/moscow',
  'moscow': 'russia/moscow',
  'санкт-петербург': 'russia/saint-petersburg',
  'saint petersburg': 'russia/saint-petersburg',
  'питер': 'russia/saint-petersburg',
  'петербург': 'russia/saint-petersburg',
  'париж': 'france/paris',
  'paris': 'france/paris',
  'лондон': 'united-kingdom/london',
  'london': 'united-kingdom/london',
  'дубай': 'uae/dubai',
  'dubai': 'uae/dubai',
  'стамбул': 'turkey/istanbul',
  'istanbul': 'turkey/istanbul',
  'бангкок': 'thailand/bangkok',
  'bangkok': 'thailand/bangkok',
  'барселона': 'spain/barcelona',
  'barcelona': 'spain/barcelona',
  'рим': 'italy/rome',
  'rome': 'italy/rome',
  'прага': 'czech-republic/prague',
  'prague': 'czech-republic/prague',
  'амстердам': 'netherlands/amsterdam',
  'amsterdam': 'netherlands/amsterdam',
  'берлин': 'germany/berlin',
  'berlin': 'germany/berlin',
  'милан': 'italy/milan',
  'milan': 'italy/milan',
  'вена': 'austria/vienna',
  'vienna': 'austria/vienna',
  'лиссабон': 'portugal/lisbon',
  'lisbon': 'portugal/lisbon',
  'токио': 'japan/tokyo',
  'tokyo': 'japan/tokyo',
  'нью-йорк': 'usa/new-york',
  'new york': 'usa/new-york',
};

// Popular cities coordinates mapping
// ETG API requires coordinates for geo search or region_id for region search
const CITY_COORDINATES: Record<string, { lat: number; lng: number; radius?: number }> = {
  'москва': { lat: 55.7558, lng: 37.6173, radius: 15 },
  'moscow': { lat: 55.7558, lng: 37.6173, radius: 15 },
  'санкт-петербург': { lat: 59.9311, lng: 30.3609, radius: 15 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609, radius: 15 },
  'питер': { lat: 59.9311, lng: 30.3609, radius: 15 },
  'париж': { lat: 48.8566, lng: 2.3522, radius: 12 },
  'paris': { lat: 48.8566, lng: 2.3522, radius: 12 },
  'лондон': { lat: 51.5074, lng: -0.1278, radius: 15 },
  'london': { lat: 51.5074, lng: -0.1278, radius: 15 },
  'дубай': { lat: 25.2048, lng: 55.2708, radius: 20 },
  'dubai': { lat: 25.2048, lng: 55.2708, radius: 20 },
  'стамбул': { lat: 41.0082, lng: 28.9784, radius: 15 },
  'istanbul': { lat: 41.0082, lng: 28.9784, radius: 15 },
  'бангкок': { lat: 13.7563, lng: 100.5018, radius: 15 },
  'bangkok': { lat: 13.7563, lng: 100.5018, radius: 15 },
  'нью-йорк': { lat: 40.7128, lng: -74.0060, radius: 15 },
  'new york': { lat: 40.7128, lng: -74.0060, radius: 15 },
  'барселона': { lat: 41.3851, lng: 2.1734, radius: 12 },
  'barcelona': { lat: 41.3851, lng: 2.1734, radius: 12 },
  'рим': { lat: 41.9028, lng: 12.4964, radius: 12 },
  'rome': { lat: 41.9028, lng: 12.4964, radius: 12 },
  'прага': { lat: 50.0755, lng: 14.4378, radius: 10 },
  'prague': { lat: 50.0755, lng: 14.4378, radius: 10 },
  'амстердам': { lat: 52.3676, lng: 4.9041, radius: 10 },
  'amsterdam': { lat: 52.3676, lng: 4.9041, radius: 10 },
  'берлин': { lat: 52.5200, lng: 13.4050, radius: 12 },
  'berlin': { lat: 52.5200, lng: 13.4050, radius: 12 },
  'милан': { lat: 45.4642, lng: 9.1900, radius: 10 },
  'milan': { lat: 45.4642, lng: 9.1900, radius: 10 },
  'вена': { lat: 48.2082, lng: 16.3738, radius: 10 },
  'vienna': { lat: 48.2082, lng: 16.3738, radius: 10 },
  'лиссабон': { lat: 38.7223, lng: -9.1393, radius: 10 },
  'lisbon': { lat: 38.7223, lng: -9.1393, radius: 10 },
  'токио': { lat: 35.6762, lng: 139.6503, radius: 18 },
  'tokyo': { lat: 35.6762, lng: 139.6503, radius: 18 },
};

function getCityCoordinates(cityName: string): { lat: number; lng: number; radius: number } | null {
  const normalized = cityName.toLowerCase().trim();
  const coords = CITY_COORDINATES[normalized];
  if (coords) {
    return { ...coords, radius: coords.radius || 10 };
  }
  return null;
}

function parseDurationDays(text: string): number | null {
  if (!text) return null;
  const m = text
    .toLowerCase()
    .match(/(?:^|\s)(\d{1,2})\s*(?:дн(?:я|ей)?|дня|дней|д\.?|day|days)(?:\s|$)/i);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n <= 30 ? n : null;
}

function isDurationOnlyMessage(text: string): boolean {
  if (!text) return false;
  return /^\s*\d{1,2}\s*(?:дн(?:я|ей)?|дня|дней|д\.?|day|days)\s*$/i.test(text);
}

const CERT_TEST_HOTEL_IDS = ['test_hotel', 'test_hotel_do_not_book'] as const;

function resolveCertificationHotelIds(input: string): string[] | null {
  const text = String(input || '').toLowerCase();
  if (!text) return null;

  const ids = new Set<string>();
  const hasGenericTestIntent =
    /test[_\s-]?hotel/.test(text) ||
    /тестов\w*\s+отел/.test(text) ||
    /сертификац\w*\s+отел/.test(text) ||
    /do\s*not\s*book/.test(text);

  if (hasGenericTestIntent) {
    ids.add('test_hotel');
    ids.add('test_hotel_do_not_book');
  }
  if (/test[_\s-]?hotel[_\s-]?do[_\s-]?not[_\s-]?book/.test(text) || /do\s*not\s*book/.test(text)) {
    ids.add('test_hotel_do_not_book');
  }
  if (/(?:hid|хид|hotel\s*id|id)\s*[:#№-]?\s*1\b/.test(text)) ids.add('test_hotel');
  if (/(?:hid|хид|hotel\s*id|id)\s*[:#№-]?\s*2\b/.test(text)) ids.add('test_hotel_do_not_book');

  if (ids.size === 0) return null;
  return CERT_TEST_HOTEL_IDS.filter((id) => ids.has(id));
}

function parseIsoDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function diffDaysUtc(start: Date, end: Date): number {
  const diff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
}

function hasItineraryContent(day: TripPlanDay | null | undefined): day is TripPlanDay {
  if (!day) return false;
  const blocks = [day.morning, day.daytime, day.evening];
  return blocks.some((items) => Array.isArray(items) && items.some((item) => String(item || '').trim().length > 0));
}

function normalizeItineraryDays(itinerary: TripPlanDay[] | undefined, targetDays?: number): TripPlanDay[] {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return [];

  const cleaned = itinerary.filter(hasItineraryContent).map((day, idx) => ({
    day: typeof day.day === 'number' && Number.isFinite(day.day) ? day.day : idx + 1,
    title: typeof day.title === 'string' && day.title.trim() ? day.title.trim() : undefined,
    morning: Array.isArray(day.morning) ? day.morning.map((x) => String(x || '').trim()).filter(Boolean) : [],
    daytime: Array.isArray(day.daytime) ? day.daytime.map((x) => String(x || '').trim()).filter(Boolean) : [],
    evening: Array.isArray(day.evening) ? day.evening.map((x) => String(x || '').trim()).filter(Boolean) : [],
  }));

  const safeTarget =
    Number.isFinite(targetDays) && Number(targetDays) > 0
      ? Math.max(1, Math.min(30, Math.round(Number(targetDays))))
      : null;
  const limited = safeTarget ? cleaned.slice(0, safeTarget) : cleaned;

  return limited.map((day, idx) => ({
    ...day,
    day: idx + 1,
    title: day.title || `День ${idx + 1}`,
  }));
}

function hasRouteIntent(text: string): boolean {
  const t = String(text || '').toLowerCase().trim();
  if (!t) return false;
  return /(маршрут|по дням|спланиру|план поездки|itinerary|day by day)/i.test(t);
}

function isWeakItinerary(itinerary: TripPlanDay[] | undefined, targetDays: number): boolean {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return true;
  if (targetDays > 0 && itinerary.length < Math.min(targetDays, 2)) return true;
  if (itinerary.length < 3) return false;
  const signatures = itinerary.map((day) =>
    JSON.stringify({
      morning: (day.morning || []).map((s) => String(s || '').toLowerCase()),
      daytime: (day.daytime || []).map((s) => String(s || '').toLowerCase()),
      evening: (day.evening || []).map((s) => String(s || '').toLowerCase()),
    })
  );
  return new Set(signatures).size <= 1;
}

function buildFallbackItinerary(destination: string, targetDays: number): TripPlanDay[] {
  const city = String(destination || 'городе').trim();
  const templates: Array<{
    title: string;
    morning: string[];
    daytime: string[];
    evening: string[];
  }> = [
    {
      title: 'Знакомство с городом',
      morning: ['Завтрак в отеле', `Прогулка по центральным кварталам ${city}`],
      daytime: ['Посещение ключевых достопримечательностей', 'Обед в локальном ресторане'],
      evening: ['Неспешная прогулка по набережной/историческому району', 'Ужин и отдых'],
    },
    {
      title: 'Культура и музеи',
      morning: ['Завтрак и выезд к музейному району', 'Посещение одного из главных музеев'],
      daytime: ['Обед рядом с музеями', 'Осмотр архитектурных локаций и площадей'],
      evening: ['Культурная программа или вечерняя экскурсия', 'Ужин в районе отеля'],
    },
    {
      title: 'Парки и локальная атмосфера',
      morning: ['Завтрак в отеле', 'Прогулка по паркам и тихим улицам'],
      daytime: ['Обед в авторском кафе', 'Посещение смотровой площадки или знакового места'],
      evening: ['Свободное время для шопинга/кафе', 'Вечерний маршрут по подсвеченным локациям'],
    },
    {
      title: 'Районы и гастрономия',
      morning: ['Поздний завтрак и переезд в новый район', 'Исследование локальных маркетов/улочек'],
      daytime: ['Гастрономический обед', 'Пеший маршрут по главным точкам района'],
      evening: ['Ужин в популярном ресторане', 'Спокойная прогулка и отдых'],
    },
    {
      title: 'Гибкий день',
      morning: ['Завтрак в отеле', 'Свободное время под личные интересы'],
      daytime: ['Точечные посещения оставшихся must-see мест', 'Обед в проверенном месте'],
      evening: ['Покупка сувениров и финальные прогулки', 'Ужин и подготовка к следующему дню'],
    },
  ];

  const days = Math.max(1, Math.min(30, Math.round(targetDays || 1)));
  return Array.from({ length: days }, (_, idx) => {
    const t = templates[idx % templates.length];
    return {
      day: idx + 1,
      title: `День ${idx + 1}: ${t.title}`,
      morning: t.morning,
      daytime: t.daytime,
      evening: t.evening,
    };
  });
}

// Generate partner booking link with correct attribution
// Uses new LinkBuilder: partner_slug + utm_* + dates format
const generatePartnerLink = (hotelId: string | number, params: {
  checkIn: string;
  checkOut: string;
  guests: number;
  childrenAges?: number[];
}, hotelName?: string, city?: string): string => {
  const hotelIdStr = String(hotelId);

  // Для строковых slug (не чисел) — строим HP без подмены на тестовый отель.
  if (!/^\d+$/.test(hotelIdStr)) {
    try {
      return buildHotelPageLink(hotelIdStr, {
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: [{ adults: params.guests, childrenAges: params.childrenAges }],
        currency: 'RUB',
        lang: 'ru',
      });
    } catch (e) {
      // Fall through to SERP link for malformed slug.
    }
  }
  
  // Для числовых hid — используем SERP с region_id
  const cityRegionMap: Record<string, number> = {
    'москва': 1, 'moscow': 1,
    'санкт-петербург': 2, 'saint petersburg': 2, 'питер': 2, 'петербург': 2,
    'париж': 53, 'paris': 53,
    'лондон': 211, 'london': 211,
    'дубай': 1435, 'dubai': 1435,
    'стамбул': 876, 'istanbul': 876,
    'бангкок': 1990, 'bangkok': 1990,
    'барселона': 1189, 'barcelona': 1189,
    'рим': 1187, 'rome': 1187,
    'прага': 1004, 'prague': 1004,
    'амстердам': 1242, 'amsterdam': 1242,
    'берлин': 964, 'berlin': 964,
    'милан': 1188, 'milan': 1188,
    'вена': 1352, 'vienna': 1352,
    'лиссабон': 1461, 'lisbon': 1461,
    'токио': 1987, 'tokyo': 1987,
    'нью-йорк': 163, 'new york': 163,
  };
  
  const regionId = city ? cityRegionMap[city.toLowerCase().trim()] : null;
  
  if (regionId) {
    return buildSerpLink(regionId, {
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      rooms: [{ adults: params.guests, childrenAges: params.childrenAges }],
      currency: 'RUB',
      lang: 'ru',
    });
  }
  
  // Без тестового fallback: дефолтная SERP Москва.
  console.warn(`[generatePartnerLink] Unknown region for hotel=${hotelId}, using SERP fallback`);
  return buildSerpLink(1, {
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: [{ adults: params.guests, childrenAges: params.childrenAges }],
    currency: 'RUB',
    lang: 'ru',
  });
};

// Format image URL (ETG: cdn.worldota.net/t/{size}/…; легаси images.ostrovok.* — см. ETG_* env в .env.example)
const formatImageUrl = (url: string, size: string = '640x400'): string => {
  return formatEtgImageUrlForServer(url, size);
};

const humanizeHotelId = (value: string): string => {
  const cleaned = String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};


// Transform Ostrovok hotel to our format
const transformHotelData = (hotel: OstrovokHotel, searchParams?: {
  checkIn: string;
  checkOut: string;
  guests: number;
  childrenAges?: number[];
}, city?: string): Hotel => {
  const rawId = String(hotel.id || hotel.hid || '').trim();
  const fallbackName =
    rawId === 'test_hotel'
      ? 'Test Hotel'
      : rawId === 'test_hotel_do_not_book'
      ? 'Test Hotel Do Not Book'
      : rawId
      ? humanizeHotelId(rawId)
      : 'Hotel';
  const fallbackAddress = rawId.startsWith('test_hotel') ? 'Test Address' : '';

  const getThumbnail = () => {
    if (hotel.images_ext && hotel.images_ext.length > 0) {
      const exterior = hotel.images_ext.find(img => img.category === 'exterior');
      const hotelFront = hotel.images_ext.find(img => img.category === 'hotel_front');
      const firstImage = hotel.images_ext[0];
      return formatImageUrl((exterior || hotelFront || firstImage).url, '640x400');
    }
    return null;
  };

  const stayNights = (() => {
    if (!searchParams) return 1;
    const start = parseIsoDate(searchParams.checkIn);
    const end = parseIsoDate(searchParams.checkOut);
    if (!start || !end) return 1;
    return diffDaysUtc(start, end);
  })();

  const getMinPrice = () => {
    if (hotel.rates && hotel.rates.length > 0) {
      const prices = hotel.rates
        .map((r: any) => {
          const daily = Array.isArray(r?.daily_prices)
            ? r.daily_prices
                .map((p: unknown) => Number(p))
                .filter((p: number) => Number.isFinite(p) && p > 0)
            : [];
          if (daily.length > 0) return Math.min(...daily);
          const total = Number(
            r?.payment_options?.payment_types?.[0]?.show_amount ??
              r?.payment_options?.payment_types?.[0]?.amount ??
              r?.amount ??
              0
          );
          if (!Number.isFinite(total) || total <= 0) return 0;
          return stayNights > 1 ? total / stayNights : total;
        })
        .filter((p: number) => Number.isFinite(p) && p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }
    return hotel.min_price || 0;
  };

  const firstRate = hotel.rates?.[0];
  const cinout = extractCheckInOut(hotel);
  const directRateBookingLink = hotel.rates
    ?.map((r: any) => r?.payment_options?.payment_types?.[0]?.link)
    .find((link: unknown) => typeof link === 'string' && String(link).trim().length > 0);
  const normalizedRateBookingLink =
    typeof directRateBookingLink === 'string'
      ? rewriteOstrovokHotelPathToRooms(directRateBookingLink.trim()) ||
        rewriteOstrovokHybridHotelPathToSerp(directRateBookingLink.trim()) ||
        directRateBookingLink.trim()
      : undefined;

  return {
    id: rawId,
    hid: hotel.hid,
    name: hotel.name || fallbackName,
    stars: hotel.stars || 0,
    rating: hotel.rating,
    address: hotel.address || fallbackAddress,
    price: Math.round(getMinPrice()),
    currency: hotel.currency || 'RUB',
    images: Array.isArray(hotel.images_ext)
      ? hotel.images_ext
          .map((i: any) => ({
            category: i?.category || 'exterior',
            url: formatImageUrl(String(i?.url || ''), '640x400'),
          }))
          .filter((i: { category: string; url: string }) => Boolean(i.url))
      : undefined,
    description: hotel.description_struct?.map(p => p.text).join('\n\n'),
    hotelType: hotel.hotel_type,
    bookingUrl: normalizedRateBookingLink || (searchParams
      ? generatePartnerLink(hotel.id || hotel.hid || '', {
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          guests: searchParams.guests,
          childrenAges: searchParams.childrenAges,
        }, hotel.name, city)
      : undefined),
    distanceToCenter: hotel.distance_center,
    taxesAndFees: extractTaxesLine(firstRate),
    mealType: extractMealLine(firstRate),
    cancellationPolicy: extractCancellationPolicyLine(firstRate),
    cancellationDeadline: extractCancellationDeadlineLine(firstRate),
    checkInTime: cinout.in,
    checkOutTime: cinout.out,
    metapolicyHighlights: extractMetapolicyHighlights(hotel as any),
    roomName: firstRate?.room_name,
    roomAmenities: extractRoomAmenities(firstRate),
    amenities: extractHotelAmenities(hotel as any),
  };
};

function makeHotelInfoCacheKey(hotel: OstrovokHotel): string {
  const byId = String(hotel?.id || '').trim();
  if (byId) return `id:${byId}`;
  const byHid = String(hotel?.hid ?? '').trim();
  if (byHid) return `hid:${byHid}`;
  return '';
}

async function fetchHotelInfoBrief(hotel: OstrovokHotel): Promise<HotelInfoBrief | null> {
  const cacheKey = makeHotelInfoCacheKey(hotel);
  if (!cacheKey) return null;
  const now = Date.now();
  const cached = hotelInfoCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;

  const id = String(hotel?.id || '').trim();
  const hid = Number(hotel?.hid);
  const payload: Record<string, unknown> = { language: 'ru' };
  if (id) payload.id = id;
  else if (Number.isFinite(hid) && hid > 0) payload.hid = hid;
  else return null;

  try {
    const response = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/hotel/info/`,
      payload,
      {
        headers: getOstrovokAuthHeaders(),
        timeout: 8000,
      }
    );
    const data = response?.data?.data || response?.data || {};
    const value: HotelInfoBrief = {
      name: typeof data?.name === 'string' ? data.name.trim() : undefined,
      address: typeof data?.address === 'string' ? data.address.trim() : undefined,
    };
    const effective = value.name || value.address ? value : null;
    hotelInfoCache.set(cacheKey, {
      value: effective,
      expiresAt: now + (effective ? HOTEL_INFO_CACHE_TTL_MS : HOTEL_INFO_NEGATIVE_TTL_MS),
    });
    return effective;
  } catch (error: any) {
    const reason = error?.response?.data?.error || error?.message || 'hotel_info_failed';
    console.warn('[hotel_info] lookup_failed', { cacheKey, reason });
    hotelInfoCache.set(cacheKey, { value: null, expiresAt: now + HOTEL_INFO_NEGATIVE_TTL_MS });
    return null;
  }
}

async function enrichHotelsWithHotelInfo(hotels: Hotel[], rawHotels: OstrovokHotel[]): Promise<Hotel[]> {
  if (!Array.isArray(hotels) || hotels.length === 0) return hotels;
  const out = [...hotels];
  const candidates: number[] = [];
  for (let i = 0; i < out.length; i += 1) {
    const raw = rawHotels[i];
    const current = out[i];
    const rawName = typeof raw?.name === 'string' ? raw.name.trim() : '';
    const fallbackName = humanizeHotelId(String(raw?.id || raw?.hid || ''));
    const nameLooksSynthetic =
      !rawName || !current?.name || current.name.trim() === fallbackName;
    const addressMissing = !current?.address || current.address.trim() === '' || current.address === 'Test Address';
    if (nameLooksSynthetic || addressMissing) candidates.push(i);
    if (candidates.length >= HOTEL_INFO_ENRICH_LIMIT) break;
  }
  if (candidates.length === 0) return out;

  await Promise.all(
    candidates.map(async (idx) => {
      const raw = rawHotels[idx];
      const info = await fetchHotelInfoBrief(raw);
      if (!info) return;
      out[idx] = {
        ...out[idx],
        name: info.name || out[idx].name,
        address: info.address || out[idx].address,
      };
    })
  );

  return out;
}

async function enrichHotelsWithRoomGroups(hotels: Hotel[], rawHotels: OstrovokHotel[]): Promise<Hotel[]> {
  if (!hasPgConfig()) return hotels;
  const out: Hotel[] = [];
  for (let i = 0; i < hotels.length; i++) {
    const h = hotels[i];
    const raw = rawHotels[i];
    const hid = String(raw?.hid ?? '');
    const rate = raw?.rates?.[0] as any;
    const rgExt = rate?.rg_ext;
    if (!hid || !rgExt || typeof rgExt !== 'object') {
      out.push(h);
      continue;
    }
    try {
      const row = await getRoomGroupByRgExt(hid, rgExt as Record<string, unknown>);
      if (!row) {
        out.push(h);
        continue;
      }
      const staticAmenities = Array.isArray(row.room_amenities)
        ? row.room_amenities.map((x: unknown) => String(x))
        : [];
      const imgs = Array.isArray(row.images) ? row.images : [];
      const roomImages = imgs
        .map((im: any) => {
          if (typeof im === 'string') return im;
          if (im && typeof im === 'object') {
            return typeof im.url === 'string' ? im.url : '';
          }
          return '';
        })
        .filter(Boolean)
        .slice(0, 4)
        .map((u: string) => ({ category: 'room', url: formatImageUrl(String(u), '640x400') }));
      const mergedImages = roomImages.length > 0 ? [...roomImages, ...(h.images || [])] : h.images;
      out.push({
        ...h,
        roomAmenities: staticAmenities.length > 0 ? staticAmenities : h.roomAmenities,
        roomName: typeof row.name === 'string' && row.name.trim() ? row.name : h.roomName,
        images: mergedImages,
      });
    } catch {
      out.push(h);
    }
  }
  return out;
}

// Extract important policy highlights
function extractMetapolicyHighlights(hotel: any): string[] {
  const highlights: string[] = [];
  
  if (!hotel.metapolicy_struct) return highlights;
  
  const policy = hotel.metapolicy_struct;
  
  // Check-in/check-out policies
  if (policy.check_in_check_out?.length > 0) {
    const checkIn = policy.check_in_check_out.find((p: any) => p.type === 'check_in');
    const checkOut = policy.check_in_check_out.find((p: any) => p.type === 'check_out');
    if (checkIn?.inclusion === 'not_included' && checkIn.price > 0) {
      highlights.push(`Ранний заезд: +${checkIn.price} ${checkIn.currency}`);
    }
    if (checkOut?.inclusion === 'not_included' && checkOut.price > 0) {
      highlights.push(`Поздний выезд: +${checkOut.price} ${checkOut.currency}`);
    }
  }
  
  // Children policy
  if (policy.children?.length > 0) {
    const child = policy.children[0];
    if (child.price > 0) {
      highlights.push(`Дети ${child.min_age}-${child.max_age} лет: ${child.price} ${child.currency}`);
    }
  }
  
  // Pets policy
  if (policy.pets?.length > 0) {
    const pet = policy.pets[0];
    if (pet.inclusion === 'not_included' && pet.price > 0) {
      highlights.push(`Проживание с животными: ${pet.price} ${pet.currency}`);
    } else if (pet.inclusion === 'included') {
      highlights.push('Проживание с животными: бесплатно');
    }
  }
  
  // Internet policy
  if (policy.internet?.length > 0) {
    const internet = policy.internet[0];
    if (internet.inclusion === 'included') {
      highlights.push('Wi-Fi: бесплатно');
    } else if (internet.price > 0) {
      highlights.push(`Wi-Fi: ${internet.price} ${internet.currency}`);
    }
  }
  
  // Parking policy
  if (policy.parking?.length > 0) {
    const parking = policy.parking[0];
    if (parking.inclusion === 'included') {
      highlights.push('Парковка: бесплатно');
    } else if (parking.price > 0) {
      highlights.push(`Парковка: ${parking.price} ${parking.currency}`);
    }
  }
  
  return highlights.slice(0, 4); // Limit to 4 items
}

// Extract room amenities from rate
function extractRoomAmenities(rate: any): string[] {
  if (!rate?.room_data) return [];
  
  const amenities: string[] = [];
  const rd = rate.room_data;
  
  if (rd.balcony === 1) amenities.push('Балкон');
  if (rd.bathroom === 2) amenities.push('Санузел в номере');
  if (rd.bedding === 3) amenities.push('Двуспальная кровать');
  if (rd.bedding === 4) amenities.push('2 односпальные кровати');
  if (rd.area && rd.area > 0) amenities.push(`${rd.area} м²`);
  
  return amenities;
}

// Extract hotel amenities
function extractHotelAmenities(hotel: any): string[] {
  if (!Array.isArray(hotel.amenities)) return [];
  
  return hotel.amenities
    .flatMap((group: any) => group?.amenities || [])
    .filter(Boolean)
    .slice(0, 8);
}

// Use realistic demo hotels - they're used when API is unavailable
const DEMO_HOTELS: Record<string, Hotel[]> = Object.entries(REALISTIC_DEMO_HOTELS).reduce(
  (acc, [key, hotelsArray]) => {
    acc[key] = (hotelsArray as DemoHotel[]).map((h: DemoHotel) => ({
      id: h.id,
      hid: h.hid,
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      address: h.address,
      price: h.price,
      currency: h.currency,
      hotelType: h.hotelType,
      bookingUrl: '', // Will be generated dynamically
      distanceToCenter: h.distanceToCenter,
      description: h.description,
      images: h.images
    }));
    return acc;
  },
  {} as Record<string, Hotel[]>
);

// Also add test hotels
DEMO_HOTELS['test_hotel'] = TEST_HOTELS.filter((h: DemoHotel) => h.id === 'test_hotel').map((h: DemoHotel) => ({
  id: h.id,
  hid: h.hid,
  name: h.name,
  stars: h.stars,
  rating: h.rating,
  address: h.address,
  price: h.price,
  currency: h.currency,
  hotelType: h.hotelType,
  bookingUrl: '',
  distanceToCenter: h.distanceToCenter,
  description: h.description,
  images: h.images
}));

DEMO_HOTELS['test_hotel_do_not_book'] = TEST_HOTELS.filter((h: DemoHotel) => h.id === 'test_hotel_do_not_book').map((h: DemoHotel) => ({
  id: h.id,
  hid: h.hid,
  name: h.name,
  stars: h.stars,
  rating: h.rating,
  address: h.address,
  price: h.price,
  currency: h.currency,
  hotelType: h.hotelType,
  bookingUrl: '',
  distanceToCenter: h.distanceToCenter,
  description: h.description,
  images: h.images
}));

// Search hotels via Ostrovok API (with demo fallback)
async function searchOstrovokHotels(filters: FilterState): Promise<Hotel[]> {
  const HOTEL_RESULTS_LIMIT = 10;
  const canUseTestIdFallback = ETG_ENABLE_TEST_FALLBACK && process.env.NODE_ENV !== 'production';
  const checkIn = filters.dates.start || new Date().toISOString().split('T')[0];
  const checkOut = filters.dates.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const guests = filters.travelers || 2;
  const traceId = createTraceId();
  const normalized = normalizeDestination(filters.destination || 'Москва');
  const certificationHotelIds =
    filters.certificationHotelIds?.length
      ? filters.certificationHotelIds
      : resolveCertificationHotelIds(filters.destination || '');
  logSearchStep('info', traceId, 'search_start', {
    destination: filters.destination,
    normalizedDestination: normalized.regionHint,
    checkIn,
    checkOut,
    guests,
  });
  if (certificationHotelIds) {
    logSearchStep('info', traceId, 'certification_test_hotel_requested', {
      ids: certificationHotelIds,
    });
  }
  upsertTrace({ traceId, rawUserQuery: filters.destination, normalizedDestination: normalized.regionHint });

  try {
    if (FORCE_TEST_HOTELS) {
      logSearchStep('warn', traceId, 'cert_mode_test_hotels_enabled');
      return getDemoHotels(filters.destination, checkIn, checkOut, guests);
    }
    if (!hasEtgCredentials()) {
      throw new Error('ETG credentials are not configured');
    }
    const endpoint = resolveSearchEndpoint({ hasCoordinates: Boolean(normalized.latitude && normalized.longitude) });
    upsertTrace({ traceId, endpoint: endpoint.endpoint });
    logSearchStep('info', traceId, 'endpoint_selected', endpoint);

    const childrenAges = Array.isArray(filters.childrenAges)
      ? filters.childrenAges.filter((age) => Number.isFinite(age) && age >= 0 && age <= 17)
      : [];
    let apiHotels: any[] = [];
    const stepErrors: string[] = [];

    if (certificationHotelIds) {
      try {
        apiHotels = await searchSerpHotels(certificationHotelIds, {
          checkIn,
          checkOut,
          adults: guests,
          childrenAges,
        });
        if (apiHotels.length === 0) {
          logSearchStep('warn', traceId, 'certification_test_hotel_empty', { ids: certificationHotelIds });
        }
        upsertTrace({
          traceId,
          requestPayload: {
            endpoint: '/api/b2b/v3/search/serp/hotels/',
            ids: certificationHotelIds,
            checkin: checkIn,
            checkout: checkOut,
            guests: [{ adults: guests, children: childrenAges }],
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'serp_hotels_failed';
        stepErrors.push(`certification_hotels:${msg}`);
        logSearchStep('warn', traceId, 'certification_test_hotel_failed', {
          ids: certificationHotelIds,
          error: msg,
        });
      }
    }

    if (apiHotels.length === 0) try {
      apiHotels = await searchSerpRegion(normalized.regionHint || 'Москва', {
        checkIn,
        checkOut,
        adults: guests,
        childrenAges,
      });
      upsertTrace({
        traceId,
        parsedIntent: {
          destination: filters.destination,
          checkIn,
          checkOut,
          adults: guests,
          children: childrenAges.length,
          childrenAges,
        },
        requestPayload: {
          endpoint: '/api/b2b/v3/search/serp/region/',
          region: normalized.regionHint || 'Москва',
          checkin: checkIn,
          checkout: checkOut,
          guests: [{ adults: guests, children: childrenAges }],
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'serp_region_failed';
      stepErrors.push(`serp_region:${msg}`);
      logSearchStep('warn', traceId, 'serp_region_failed', { error: msg });
    }

    if (apiHotels.length === 0 && normalized.latitude && normalized.longitude) {
      try {
        apiHotels = await searchSerpGeo(normalized.latitude, normalized.longitude, normalized.radiusKm || 10, {
          checkIn,
          checkOut,
          adults: guests,
          childrenAges,
        });
        upsertTrace({
          traceId,
          requestPayload: {
            endpoint: '/api/b2b/v3/search/serp/geo/',
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            radius: normalized.radiusKm || 10,
            checkin: checkIn,
            checkout: checkOut,
            guests: [{ adults: guests, children: childrenAges }],
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'serp_geo_failed';
        stepErrors.push(`serp_geo:${msg}`);
        logSearchStep('warn', traceId, 'serp_geo_failed', { error: msg });
      }
    }
    if (apiHotels.length === 0 && canUseTestIdFallback) {
      const certificationHotelIds = ['test_hotel', 'test_hotel_do_not_book'];
      try {
        logSearchStep('warn', traceId, 'primary_search_empty_use_test_hotel_ids', { certificationHotelIds });
        apiHotels = await searchSerpHotels(certificationHotelIds, {
          checkIn,
          checkOut,
          adults: guests,
          childrenAges,
        });
        upsertTrace({
          traceId,
          requestPayload: {
            endpoint: '/api/b2b/v3/search/serp/hotels/',
            ids: certificationHotelIds,
            checkin: checkIn,
            checkout: checkOut,
            guests: [{ adults: guests, children: childrenAges }],
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'serp_hotels_failed';
        stepErrors.push(`serp_hotels:${msg}`);
        logSearchStep('warn', traceId, 'serp_hotels_failed', { error: msg });
      }
    }
    if (apiHotels.length === 0) {
      throw new Error(
        `No hotels returned from region/geo search${canUseTestIdFallback ? '/test-hotel fallback' : ''}${stepErrors.length ? ` (${stepErrors.join('; ')})` : ''}`
      );
    }
    apiHotels = apiHotels.slice(0, HOTEL_RESULTS_LIMIT);
    let transformed = apiHotels.map((apiHotel: OstrovokHotel) =>
      transformHotelData(apiHotel, { checkIn, checkOut, guests, childrenAges }, filters.destination)
    );
    transformed = await enrichHotelsWithHotelInfo(transformed, apiHotels);
    transformed = await enrichHotelsWithRoomGroups(transformed, apiHotels);
    upsertTrace({
      traceId,
      responseStatus: 200,
      hotelsFound: transformed.length,
      responseTimeMs: Date.now(),
    });
    logSearchStep('info', traceId, 'search_success', { hotelsFound: transformed.length });
    return transformed;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'search_failed';
    upsertTrace({ traceId, responseStatus: 500, hotelsFound: 0, errorReason: reason });
    logSearchStep('error', traceId, 'search_failed', { reason });
    const canUseFallback = FORCE_TEST_HOTELS || canUseTestIdFallback;
    if (canUseFallback) {
      return getDemoHotels(filters.destination, checkIn, checkOut, guests);
    }
    return [];
  }
}

// Get demo hotels for destination
function getDemoHotels(destination: string, checkIn: string, checkOut: string, guests: number): Hotel[] {
  // Find matching demo hotels
  const normalizedDest = destination.toLowerCase();
  let hotels: Hotel[] = [];
  
  for (const [key, value] of Object.entries(DEMO_HOTELS)) {
    if (normalizedDest.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedDest)) {
      hotels = [...hotels, ...value];
    }
  }
  
  // If no specific match, return generic demo hotels
  if (hotels.length === 0) {
    hotels = DEMO_HOTELS['Италия'] || [];
  }
  
  // Dev/test-only fallback URL for demo mode.
  const testHotelUrl = buildSerpLink(1, {
    partnerSlug: PARTNER_SLUG,
    checkIn,
    checkOut,
    rooms: [{ adults: guests }],
    currency: 'RUB',
    lang: 'ru',
  });
  return hotels.map(h => ({
    ...h,
    bookingUrl: testHotelUrl,
    taxesAndFees: h.taxesAndFees || 'Включены в стоимость',
    cancellationPolicy: h.cancellationPolicy || 'Уточняйте политику отмены',
    cancellationDeadline: h.cancellationDeadline,
    checkInTime: h.checkInTime || '15:00',
    checkOutTime: h.checkOutTime || '12:00',
    mealType: h.mealType,
    roomName: h.roomName,
    metapolicyHighlights: h.amenities ? [h.amenities.slice(0, 3).join(', ')] : undefined,
  }));
}

// Format hotels for GPT prompt
function formatHotelsForGPT(hotels: Hotel[]): string {
  if (hotels.length === 0) {
    return '';
  }

  let formatted = '\n\n# 🏨 РекОМЕНДУЕМЫЕ ОТЕЛИ (используй ТОЛЬКО эти отели)\n\n';
  
  hotels.forEach((hotel, index) => {
    const stars = '⭐'.repeat(hotel.stars);
    
    // Get main photo URL
    let photoUrl = '';
    if (hotel.images && hotel.images.length > 0) {
      const mainImage = hotel.images.find((img: any) => 
        img.category === 'exterior' || img.category === 'hotel_front'
      ) || hotel.images[0];
      photoUrl = mainImage.url ? formatEtgImageUrlForServer(mainImage.url, '640x400') : '';
    }
    
    formatted += `### ${index + 1}. ${hotel.name} ${stars}\n\n`;
    
    // Add photo if available (markdown image format)
    if (photoUrl) {
      formatted += `![${hotel.name}](${photoUrl})\n\n`;
    }
    
    formatted += `- **Адрес:** ${hotel.address}\n`;
    
    if (hotel.rating) {
      formatted += `- **Рейтинг:** ${hotel.rating}/10\n`;
    }
    
    formatted += `- **Цена:** от ${hotel.price.toLocaleString('ru-RU')} ${hotel.currency}\n`;
    
    if (hotel.distanceToCenter) {
      const km = hotel.distanceToCenter / 1000;
      formatted += `- **До центра:** ${km < 1 ? `${Math.round(hotel.distanceToCenter)} м` : `${km.toFixed(1)} км`}\n`;
    }
    
    if (hotel.bookingUrl) {
      formatted += `- **Ссылка для бронирования:** ${hotel.bookingUrl}\n`;
      // Add explicit button format for GPT to use
      formatted += `\n[🛎️ Забронировать ${hotel.name}](${hotel.bookingUrl})\n`;
    } else {
      formatted += `- **Бронирование:** Ссылка недоступна. Поищите отель на Ostrovok.ru самостоятельно.\n`;
    }
    
    if (hotel.description) {
      const shortDesc = hotel.description.slice(0, 200);
      formatted += `- **Описание:** ${shortDesc}${hotel.description.length > 200 ? '...' : ''}\n`;
    }
    
    formatted += '\n---\n\n';
  });
  
  formatted += '\n⚠️ **ВАЖНО:** Используй ТОЛЬКО эти отели в своих рекомендациях. Не придумывай другие отели.\n';

  return formatted;
}

// System prompt for GPT
const SYSTEM_PROMPT = `Ты — персональный travel-эксперт сервиса TripGen. Помогаешь планировать путешествия по всему миру для пользователей из России и СНГ.

РАСПОЗНАВАНИЕ НАМЕРЕНИЙ:
Перед ответом определи тип сообщения пользователя:

SMALL_TALK — приветствие, вопрос "что умеешь", "как дела"
→ Отвечай тепло и коротко, в конце мягко предложи помочь с поездкой.

DREAM — размытое желание без деталей: "хочу на море", "устал, хочу уехать"
→ Подхвати эмоцию, предложи 2-3 направления, задай один вопрос.

INFO_REQUEST — вопрос о месте, стране, визах, погоде
→ Ответь на вопрос, потом мягко верни к планированию поездки.

TRIP_PLANNING — явный запрос на маршрут с деталями или без
→ Собирай недостающие данные по одному вопросу за раз.

OFF_TOPIC — вопросы не про путешествия вообще
→ Вежливо объясни свою специализацию и предложи вернуться к теме.

НИКОГДА не называй тип намерения вслух — просто реагируй соответственно.

СТИЛЬ ОБЩЕНИЯ:
- Веди диалог как опытный друг-путешественник, а не как справочник.
- Если данных не хватает — предложи 2-3 варианта на выбор и задай один уточняющий вопрос в конце сообщения.
- Задавай ТОЛЬКО ОДИН вопрос за раз.
- После получения ответа — подтверди выбор и двигайся дальше.
- Не составляй финальный маршрут, пока не знаешь минимум: направление, даты или длительность, бюджет, состав группы.

ПАМЯТЬ КОНТЕКСТА:
- Учитывай всё, что пользователь сказал в этом чате.
- Если он уже называл город, даты, бюджет или состав группы — не спрашивай повторно.
- Если он сменил предпочтение — обнови понимание и учти это.
- В начале финального маршрута напиши: "Исходя из того, что вы рассказали: ..."

ПРАВИЛА МАРШРУТОВ:
- Только реально существующие места с конкретными адресами или районами.
- Учитывай сезонность и реалистичную логистику между точками.
- Для зарубежных поездок предупреждай о визах и особенностях перелётов из России; если данные о рейсах могут быть устаревшими — честно скажи и предложи проверить на Aviasales.
- Бюджет расписывай с разбивкой по категориям, если пользователь просит финальный маршрут.

ПРАВИЛА ОТЕЛЕЙ OSTROVOK:
- Используй ТОЛЬКО отели из переданного списка.
- bookingUrl, фото, цены, рейтинг, налоги, питание, отмену и комнаты бери только из API-контекста.
- Не генерируй ссылки на отели самостоятельно.
- Если bookingUrl отсутствует — не показывай кнопку бронирования.

ПРАВИЛА ССЫЛОК НА МЕСТА:
- Для ключевых достопримечательностей, музеев, парков и ресторанов можно давать ссылку Google Maps.
- Формат: [Название места](https://www.google.com/maps/search/?api=1&query=НАЗВАНИЕ+МЕСТА+ГОРОД).
- Не перегружай ответ: 2-4 ссылки на день достаточно.
- Если в контексте есть блок "Проверенные места и заведения", в первую очередь используй эти места и объясняй, почему они подходят под интересы, бюджет и состав группы.

В конце КАЖДОГО текстового ответа добавляй скрытый блок, который система вырежет перед показом пользователю:
<context_update>
{
  "intent": "SMALL_TALK | DREAM | INFO_REQUEST | TRIP_PLANNING | OFF_TOPIC",
  "destination": "",
  "dates": "",
  "budget": "",
  "group": "",
  "interests": [],
  "restrictions": [],
  "citizenship": "RU",
  "missing": []
}
</context_update>

ЯЗЫК: всегда русский.`

// Middleware to check environment variables
const checkEnvVariables = (req: Request, res: Response, next: NextFunction) => {
  if (!OPENROUTER_API_KEY) {
    console.error('[GPT Proxy] ERROR: OpenRouter API key not configured');
    return res.status(500).json({ 
      error: 'OpenRouter API key not configured',
      details: 'Please set OPENROUTER_API_KEY environment variable'
    });
  }
  next();
};

// Async handler wrapper to catch errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'GPT Proxy with OpenRouter is working!',
    openrouterConfigured: !!OPENROUTER_API_KEY,
    ostrovokConfigured: !!OSTROVOK_API_KEY,
    ostrovokMode: OSTROVOK_API_SECRET ? 'production' : 'test',
    ostrovokApiUrl: OSTROVOK_API_URL
  });
});

// Test Ostrovok API connection
router.get('/test/ostrovok', async (req: Request, res: Response) => {
  try {
    console.log('[Test] Testing Ostrovok API connection...');
    console.log('[Test] API URL:', OSTROVOK_API_URL);
    console.log('[Test] API Key exists:', !!OSTROVOK_API_KEY);
    console.log('[Test] Auth headers:', getOstrovokAuthHeaders());
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Test 1: Search test hotels by IDs
    console.log('[Test] Test 1: Searching test hotels by IDs...');
    let testHotelsResult;
    try {
      const testResponse = await axios.post(
        `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`,
        {
          ids: ['test_hotel', 'test_hotel_do_not_book'],
          checkin: today,
          checkout: tomorrow,
          guests: [{ adults: 2, children: [] }],
          language: 'ru',
          currency: 'RUB',
          residency: 'ru'
        },
        {
          headers: getOstrovokAuthHeaders(),
          timeout: 30000
        }
      );
      testHotelsResult = {
        success: true,
        status: testResponse.status,
        hotelsCount: testResponse.data.hotels?.length || 0,
        firstHotel: testResponse.data.hotels?.[0] ? {
          id: testResponse.data.hotels[0].id,
          name: testResponse.data.hotels[0].name,
          hid: testResponse.data.hotels[0].hid
        } : null
      };
    } catch (error: any) {
      testHotelsResult = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    // Test 2: Search by region (Moscow)
    console.log('[Test] Test 2: Searching by region (Moscow)...');
    let regionResult;
    try {
      const regionResponse = await axios.post(
        `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/region/`,
        {
          region_id: 1,
          checkin: today,
          checkout: tomorrow,
          guests: [{ adults: 2, children: [] }],
          language: 'ru',
          currency: 'RUB',
          residency: 'ru'
        },
        {
          headers: getOstrovokAuthHeaders(),
          timeout: 30000
        }
      );
      regionResult = {
        success: true,
        status: regionResponse.status,
        hotelsCount: regionResponse.data.hotels?.length || 0
      };
    } catch (error: any) {
      regionResult = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    // Test 3: Geo search
    console.log('[Test] Test 3: Searching by geo coordinates (Moscow center)...');
    let geoResult;
    try {
      const geoResponse = await axios.post(
        `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/geo/`,
        {
          latitude: 55.7558,
          longitude: 37.6173,
          radius: 5,
          checkin: today,
          checkout: tomorrow,
          guests: [{ adults: 2, children: [] }],
          language: 'ru',
          currency: 'RUB',
          residency: 'ru'
        },
        {
          headers: getOstrovokAuthHeaders(),
          timeout: 30000
        }
      );
      geoResult = {
        success: true,
        status: geoResponse.status,
        hotelsCount: geoResponse.data.hotels?.length || 0
      };
    } catch (error: any) {
      geoResult = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      config: {
        apiUrl: OSTROVOK_API_URL,
        hasApiKey: !!OSTROVOK_API_KEY,
        hasSecret: !!OSTROVOK_API_SECRET,
        partnerSlug: PARTNER_SLUG
      },
      tests: {
        testHotelsById: testHotelsResult,
        regionSearch: regionResult,
        geoSearch: geoResult
      },
      documentation: {
        implemented: [
          'POST /api/b2b/v3/search/serp/region/ - Search by region',
          'POST /api/b2b/v3/search/serp/hotels/ - Search by hotel IDs',
          'POST /api/b2b/v3/search/serp/geo/ - Search by geo coordinates',
          'POST /api/b2b/v3/search/hp/ - Hotelpage (detailed info)',
          'POST /api/b2b/v3/hotel/prebook - Prebook rate',
          'POST /api/b2b/v3/hotel/info/ - Hotel content',
          'GET  /api/b2b/v3/hotel/info/dump/ - Hotel dump (weekly)',
          'GET  /api/b2b/v3/hotel/info/incremental_dump/ - Incremental dump (daily)'
        ],
        bestPractices: {
          serpRates: 'Limited to 1-2 lowest rates per hotel in SERP',
          hotelpage: 'Full rates shown only on hotelpage',
          prebook: 'Required before booking'
        }
      }
    });
    
  } catch (error: any) {
    console.error('[Test] Error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

// Main endpoint
router.post('/openai', checkEnvVariables, asyncHandler(async (req: Request, res: Response) => {
  console.log('[GPT Proxy] ===== REQUEST START =====');
  console.log('[GPT Proxy] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Defensive check for request body
    if (!req.body || typeof req.body !== 'object') {
      console.error('[GPT Proxy] ERROR: Empty or invalid request body');
      return res.status(400).json({ error: 'Empty or invalid request body' });
    }
    
    const { messages, filters = {}, stream: useStream = false, conversationSummary = '' } = req.body;
    
    console.log('[GPT Proxy] Received request', useStream ? '(streaming)' : '');
    console.log('[GPT Proxy] Raw filters from client:', JSON.stringify(filters, null, 2));
    
    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.error('[GPT Proxy] ERROR: Invalid messages format');
      return res.status(400).json({ 
        error: 'Invalid request format. Expected array of messages.' 
      });
    }

    // Default filter values with defensive programming
    const normalizedMessages: any[] = Array.isArray(messages) ? messages : [];
    const hasRouteIntentInThread = normalizedMessages.some((m: any) =>
      (m?.role || 'user') === 'user' && hasRouteIntent(String(m?.text || m?.content || ''))
    );
    const lastUserText = [...normalizedMessages]
      .reverse()
      .find((m: any) => (m?.role || 'user') === 'user' && typeof (m?.text || m?.content) === 'string');
    const lastUserContent = String(lastUserText?.text || lastUserText?.content || '').trim();
    const durationFromLastUser = parseDurationDays(lastUserContent);
    const certificationHotelIds = resolveCertificationHotelIds(
      `${lastUserContent}\n${filters?.destination || ''}\n${filters?.location || ''}`
    );
    const durationFromFilters = Number(filters?.durationDays);
    const requestedDurationDays = Number.isFinite(durationFromFilters) && durationFromFilters > 0
      ? Math.max(1, Math.min(30, Math.round(durationFromFilters)))
      : durationFromLastUser;

    const rawStart = typeof filters?.dates?.start === 'string' ? filters.dates.start : '';
    const rawEnd = typeof filters?.dates?.end === 'string' ? filters.dates.end : '';
    const parsedStart = parseIsoDate(rawStart) || new Date();
    let parsedEnd = parseIsoDate(rawEnd);
    if (!parsedEnd || parsedEnd.getTime() <= parsedStart.getTime()) {
      parsedEnd = addDaysUtc(parsedStart, requestedDurationDays || 7);
    } else if (durationFromLastUser && isDurationOnlyMessage(lastUserContent)) {
      // Если пользователь отдельным сообщением прислал только "3 дня", фиксируем новый диапазон.
      parsedEnd = addDaysUtc(parsedStart, durationFromLastUser);
    }

    const defaultFilters: FilterState = {
      destination: certificationHotelIds ? 'test_hotel' : (filters?.destination || filters?.location || 'Москва'),
      dates: {
        start: formatIsoDate(parsedStart),
        end: formatIsoDate(parsedEnd)
      },
      durationDays: requestedDurationDays || diffDaysUtc(parsedStart, parsedEnd),
      budget: {
        min: filters?.budget?.min || 1000,
        max: filters?.budget?.max || 100000
      },
      preferences: filters?.preferences || [],
      travelers: filters?.travelers || 2,
      children: filters?.children || 0,
      childrenAges: Array.isArray(filters?.childrenAges) ? filters.childrenAges : [],
      certificationHotelIds: certificationHotelIds || undefined
    };

    console.log('[GPT Proxy] Merged filters:', JSON.stringify(defaultFilters, null, 2));

    // Search for hotels via Ostrovok API
    console.log('[GPT Proxy] Searching hotels via Ostrovok...');
    const hotels = await searchOstrovokHotels(defaultFilters);
    console.log(`[GPT Proxy] Found ${hotels.length} hotels`);

    // Format hotels for prompt
    const hotelsText = formatHotelsForGPT(hotels);
    console.log('[GPT Proxy] Hotels text for GPT (first 1000 chars):', hotelsText.substring(0, 1000));
    const places = searchCuratedPlaces({
      destination: defaultFilters.destination,
      preferences: defaultFilters.preferences,
      budgetMax: defaultFilters.budget.max,
    });
    const placesText = formatPlacesForPrompt(places, defaultFilters.destination);
    console.log(`[GPT Proxy] Prepared ${places.length} curated places for GPT`);

    // Build conversation for OpenRouter
    const conversationMessages = normalizedMessages
      .map((msg: any) => ({
        role: msg.role || 'user',
        content: msg.text || msg.content || ''
      }))
      // Клиент присылает свой system prompt; оставляем только один серверный system.
      .filter((msg: any) => msg.role !== 'system')
      .filter((msg: any) => typeof msg.content === 'string' && msg.content.trim() !== '')
      .slice(-8)
      .map((msg: any) => ({
        role: msg.role,
        content: String(msg.content).slice(0, msg.role === 'assistant' ? 2200 : 1800),
      }));

    if (durationFromLastUser && isDurationOnlyMessage(lastUserContent)) {
      conversationMessages.push({
        role: 'user',
        content: `Составь детальный маршрут по ${defaultFilters.destination} на ${durationFromLastUser} дня по дням (утро/день/вечер), с практическими советами, логичной последовательностью и временем для каждого пункта.`
      });
    }

    const contextBlock = `Контекст путешествия:\n- Направление: ${defaultFilters.destination}\n- Даты: с ${defaultFilters.dates.start} по ${defaultFilters.dates.end}\n- Длительность: ${defaultFilters.durationDays || diffDaysUtc(parsedStart, parsedEnd)} дней\n- Бюджет: от ${defaultFilters.budget.min} до ${defaultFilters.budget.max} ₽\n- Путешественников: ${defaultFilters.travelers}${hotelsText}${placesText}`;
    const durationInstruction = (defaultFilters.durationDays && defaultFilters.durationDays > 0)
      ? `\n\nКРИТИЧНО: В поле itinerary верни РОВНО ${defaultFilters.durationDays} дней (day: 1..${defaultFilters.durationDays}), без пропусков и пустых дней. Каждый пункт внутри morning/daytime/evening начинай с времени: "09:00-10:30 — ...".`
      : '';

    // Non-streaming: use JSON system prompt so we can parse and format to markdown. Streaming: keep text prompt.
    const systemPromptForRequest = useStream ? SYSTEM_PROMPT : TRAVEL_JSON_SYSTEM_PROMPT;
    const fullMessages = [
      {
        role: 'system',
        content: `${systemPromptForRequest}${durationInstruction}\n\n${contextBlock}`
      },
      ...(typeof conversationSummary === 'string' && conversationSummary.trim()
        ? [{ role: 'system', content: `Краткое резюме предыдущего диалога:\n${conversationSummary.trim().slice(0, 1400)}` }]
        : []),
      ...conversationMessages
    ];
    const aiUsageKey = getAiUsageKey(req);
    const aiUsageBefore = await getAiUsageSnapshot(aiUsageKey, AI_DAILY_TOKEN_LIMIT);
    if (aiUsageBefore.remainingTokens <= 0) {
      return res.status(429).json({
        error: 'ai_limit_exceeded',
        message: `Вы достигли лимита AI. Следующий сброс — ${aiUsageBefore.resetAtLabel}.`,
        aiLimitExceeded: true,
        aiUsage: aiUsageBefore,
      });
    }

    console.log('[GPT Proxy] Sending request to OpenRouter...');

    if (useStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (res.socket) res.socket.setNoDelay(true);
      res.flushHeaders?.();
      res.write(`data: ${JSON.stringify({ type: 'hotels', hotels })}\n\n`);

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-4o-mini',
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: AI_MAX_COMPLETION_TOKENS,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': req.headers.origin || 'http://localhost:5173',
            'X-Title': 'AI Travel Assistant'
          },
          responseType: 'stream',
          timeout: 60000
        }
      );

      const stream = response.data as NodeJS.ReadableStream;
      let upstreamBuffer = '';
      let streamedAssistantMessage = '';
      const collectStreamText = (rawChunk: string) => {
        upstreamBuffer += rawChunk;
        let lineEnd = upstreamBuffer.indexOf('\n');
        while (lineEnd !== -1) {
          const line = upstreamBuffer.slice(0, lineEnd).trim();
          upstreamBuffer = upstreamBuffer.slice(lineEnd + 1);
          lineEnd = upstreamBuffer.indexOf('\n');
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (typeof content === 'string') streamedAssistantMessage += content;
          } catch {
            // Ignore non-JSON stream comments/chunks from upstream.
          }
        }
      };
      stream.on('data', (chunk: Buffer | string) => {
        if (res.writableEnded) return;
        collectStreamText(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
        res.write(chunk);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      });
      stream.on('end', async () => {
        if (res.writableEnded) return;
        try {
          const fallbackTokens = estimateMessagesTokens(fullMessages) + estimateTokensFromText(streamedAssistantMessage);
          const aiUsageAfter = await addAiUsageTokens(aiUsageKey, fallbackTokens, AI_DAILY_TOKEN_LIMIT);
          res.write(`data: ${JSON.stringify({ type: 'aiUsage', aiUsage: aiUsageAfter })}\n\n`);
        } catch (err) {
          console.error('[GPT Proxy] Failed to persist stream AI usage:', err instanceof Error ? err.message : err);
        }
        if (!res.writableEnded) res.end();
      });
      stream.on('error', (err: Error) => {
        if (!res.writableEnded) {
          console.error('[GPT Proxy] Stream error:', err.message);
          res.end();
        }
      });
      return;
    }

    // Call OpenRouter API with shorter timeout (non-streaming)
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',  // or any other model available on OpenRouter
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: AI_MAX_COMPLETION_TOKENS
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.origin || 'http://localhost:5173',
          'X-Title': 'AI Travel Assistant'
        },
        timeout: 25000  // 25 seconds timeout
      }
    );

    console.log('[GPT Proxy] OpenRouter response received');

    const assistantMessage = response.data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error('[GPT Proxy] Empty response from OpenRouter:', response.data);
      return res.status(502).json({ 
        error: 'Empty response from OpenRouter API' 
      });
    }

    // Try to parse as structured JSON, merge hotels with whitelist, convert to markdown; fallback to raw text
    let textToSend: string;
    let itineraryToSend: import('./types/tripPlan.js').TripPlanDay[] | undefined;
    const parsed = parseTripPlanResponse(assistantMessage);
    if (parsed) {
      const sourceHotels: SourceHotelForWhitelist[] = hotels.map((h) => {
        const mainImg = h.images?.find((img: any) => img.category === 'exterior' || img.category === 'hotel_front') || h.images?.[0];
        const photoUrl = mainImg?.url
          ? normalizeHotelPreviewImageUrlForServer(String(mainImg.url), '640x400')
          : undefined;
        return {
          name: h.name,
          bookingUrl: h.bookingUrl,
          photoUrl,
          price: h.price,
          currency: h.currency,
          rating: h.rating,
          stars: h.stars,
          address: h.address,
          distanceToCenter: h.distanceToCenter,
          description: h.description,
        };
      });
      const merged = mergeHotelRecommendationsWithSource(parsed, sourceHotels);
      const targetDays = Math.max(1, Number(defaultFilters.durationDays || 0));
      merged.itinerary = normalizeItineraryDays(
        Array.isArray(merged.itinerary) ? merged.itinerary : [],
        targetDays
      );
      const shouldUseFallbackItinerary =
        (durationFromLastUser && isDurationOnlyMessage(lastUserContent)) || hasRouteIntentInThread;
      if (shouldUseFallbackItinerary && isWeakItinerary(merged.itinerary, targetDays)) {
        merged.itinerary = buildFallbackItinerary(defaultFilters.destination, targetDays);
      }
      textToSend = formatTripPlanToMarkdown(merged);
      if (!textToSend) textToSend = assistantMessage;
      if (merged.itinerary?.length) itineraryToSend = merged.itinerary;
    } else {
      textToSend = assistantMessage;
      const targetDays = Math.max(1, Number(defaultFilters.durationDays || 0));
      const shouldUseFallbackItinerary =
        (durationFromLastUser && isDurationOnlyMessage(lastUserContent)) || hasRouteIntentInThread;
      if (shouldUseFallbackItinerary && targetDays > 0) {
        const fallbackItinerary = buildFallbackItinerary(defaultFilters.destination, targetDays);
        if (fallbackItinerary.length > 0) {
          itineraryToSend = fallbackItinerary;
          const itineraryMarkdown = formatTripPlanToMarkdown({
            tripSummary: '',
            assumptions: [],
            recommendedAreas: [],
            hotelRecommendations: [],
            itinerary: fallbackItinerary,
            highlights: [],
            foodRecommendations: [],
            practicalTips: [],
            followUpQuestion: '',
          });
          if (itineraryMarkdown && !/маршрут по дням|день\s*1/i.test(textToSend.toLowerCase())) {
            textToSend = `${textToSend.trim()}\n\n${itineraryMarkdown}`.trim();
          }
        }
      }
    }

    const fallbackTokens = estimateMessagesTokens(fullMessages) + estimateTokensFromText(assistantMessage);
    const aiUsageAfter = await addAiUsageTokens(
      aiUsageKey,
      getOpenRouterTotalTokens(response.data, fallbackTokens),
      AI_DAILY_TOKEN_LIMIT
    );

    res.json({
      text: textToSend,
      hotels: hotels,
      aiUsage: aiUsageAfter,
      ...(itineraryToSend && { itinerary: itineraryToSend })
    });

  } catch (error: any) {
    console.error('[GPT Proxy] ===== CRITICAL ERROR =====');
    console.error('[GPT Proxy] Error message:', error.message);
    console.error('[GPT Proxy] Error stack:', error.stack);
    
    if (error.response) {
      console.error('[GPT Proxy] Axios error response:', error.response.data);
    }

    // Always return JSON, even on error
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } finally {
    console.log('[GPT Proxy] ===== REQUEST END =====');
  }
}));

export default router;
