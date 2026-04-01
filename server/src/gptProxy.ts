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
  generatePartnerLinkLegacy
} from '../lib/ostrovok-links.cjs';
import { TRAVEL_JSON_SYSTEM_PROMPT } from './prompts/travelJsonSystemPrompt.js';
import { parseTripPlanResponse } from './lib/parseTripPlanResponse.js';
import { formatTripPlanToMarkdown } from './lib/formatTripPlanToMarkdown.js';
import { mergeHotelRecommendationsWithSource } from './lib/mergeHotelRecommendationsWithSource.js';
import type { SourceHotelForWhitelist } from './types/tripPlan.js';
import { ETG_ENABLE_TEST_FALLBACK, FORCE_TEST_HOTELS, hasEtgCredentials } from './config/etg.js';
import { normalizeDestination } from './etg/destinationNormalizer.js';
import { resolveSearchEndpoint } from './etg/endpointResolver.js';
import { searchSerpGeo, searchSerpRegion } from './etg/searchClient.js';
import { createTraceId, logSearchStep, upsertTrace } from './diagnostics/searchLogger.js';

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

// Interfaces
interface FilterState {
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  budget: {
    min: number;
    max: number;
  };
  preferences: string[];
  travelers?: number;
  children?: number;
  childrenAges?: number[];
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

// Format image URL
const formatImageUrl = (url: string, size: string = '640x400'): string => {
  return url.replace('{size}', size);
};

// Transform Ostrovok hotel to our format
const transformHotelData = (hotel: OstrovokHotel, searchParams?: {
  checkIn: string;
  checkOut: string;
  guests: number;
  childrenAges?: number[];
}, city?: string): Hotel => {
  const getThumbnail = () => {
    if (hotel.images_ext && hotel.images_ext.length > 0) {
      const exterior = hotel.images_ext.find(img => img.category === 'exterior');
      const hotelFront = hotel.images_ext.find(img => img.category === 'hotel_front');
      const firstImage = hotel.images_ext[0];
      return formatImageUrl((exterior || hotelFront || firstImage).url, '640x400');
    }
    return null;
  };

  const getMinPrice = () => {
    if (hotel.rates && hotel.rates.length > 0) {
      const prices = hotel.rates.map(r => r.amount || 0);
      return Math.min(...prices);
    }
    return hotel.min_price || 0;
  };

  return {
    id: hotel.id,
    hid: hotel.hid,
    name: hotel.name,
    stars: hotel.stars || 0,
    rating: hotel.rating,
    address: hotel.address || '',
    price: getMinPrice(),
    currency: hotel.currency || 'RUB',
    images: hotel.images_ext,
    description: hotel.description_struct?.map(p => p.text).join('\n\n'),
    hotelType: hotel.hotel_type,
    bookingUrl: searchParams
      ? generatePartnerLink(hotel.id || hotel.hid || '', {
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          guests: searchParams.guests,
          childrenAges: searchParams.childrenAges,
        }, hotel.name, city)
      : undefined,
    distanceToCenter: hotel.distance_center,
    taxesAndFees:
      typeof (hotel as any)?.rates?.[0]?.payment_options?.payment_types?.[0]?.tax_data?.taxes === 'string'
        ? (hotel as any).rates[0].payment_options.payment_types[0].tax_data.taxes
        : 'Не указано',
    mealType: (hotel as any)?.rates?.[0]?.meal || (hotel as any)?.rates?.[0]?.meal_data?.value || 'Не указано',
    cancellationPolicy: Array.isArray((hotel as any)?.rates?.[0]?.cancellation_penalties)
      ? JSON.stringify((hotel as any).rates[0].cancellation_penalties[0])
      : 'Не указано',
    cancellationDeadline:
      (hotel as any)?.rates?.[0]?.cancellation_penalties?.[0]?.start_at ||
      (hotel as any)?.rates?.[0]?.cancellation_penalties?.[0]?.free_cancellation_before ||
      'Не указано',
    checkInTime: (hotel as any).check_in_time || 'Не указано',
    checkOutTime: (hotel as any).check_out_time || 'Не указано',
    metapolicyHighlights: (hotel as any).metapolicy_struct ? [JSON.stringify((hotel as any).metapolicy_struct)] : undefined,
    roomName: (hotel as any)?.rates?.[0]?.room_name,
    roomAmenities: Array.isArray((hotel as any)?.rates?.[0]?.amenities)
      ? (hotel as any).rates[0].amenities.map((a: any) => String(a))
      : undefined,
    amenities: Array.isArray((hotel as any).amenities) ? (hotel as any).amenities.map((a: any) => String(a)) : undefined,
  };
};

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
  const checkIn = filters.dates.start || new Date().toISOString().split('T')[0];
  const checkOut = filters.dates.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const guests = filters.travelers || 2;
  const traceId = createTraceId();
  const normalized = normalizeDestination(filters.destination || 'Москва');
  logSearchStep('info', traceId, 'search_start', {
    destination: filters.destination,
    normalizedDestination: normalized.regionHint,
    checkIn,
    checkOut,
    guests,
  });
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
    let apiHotels = await searchSerpRegion(normalized.regionHint || 'Москва', {
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
    if (apiHotels.length === 0 && normalized.latitude && normalized.longitude) {
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
    }
    const transformed = apiHotels.map((apiHotel: OstrovokHotel) =>
      transformHotelData(apiHotel, { checkIn, checkOut, guests, childrenAges }, filters.destination)
    );
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
    const canUseFallback = FORCE_TEST_HOTELS || (ETG_ENABLE_TEST_FALLBACK && process.env.NODE_ENV !== 'production');
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
      photoUrl = mainImage.url ? mainImage.url.replace('{size}', '640x400') : '';
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
const SYSTEM_PROMPT = `Ты — опытный туристический ассистент и профессиональный travel-блогер. 
Твоя задача — помогать пользователям планировать путешествия, предоставляя персонализированные рекомендации.

ВАЖНО: В твоём распоряжении есть актуальные данные об отелях из Ostrovok.ru с реальными ценами, фото и ссылками на бронирование.
Используй ТОЛЬКО эти данные при составлении рекомендаций по размещению. НЕ ПРИДУМЫВАЙ отели — используй только те, что в списке ниже.

ПРАВИЛА ОТВЕТОВ:
1. Используй ТОЛЬКО отели из предоставленного списка "Рекомендуемые отели"
2. Для каждого отеля ОБЯЗАТЕЛЬНО включи фото используя markdown: ![название отеля](URL_фото)
3. Добавь кнопку бронирования ТОЧНО в формате: [🛎️ Забронировать отель](URL_бронирования)
   - Используй ПОЛНУЮ ссылку из поля bookingUrl в данных отеля
   - НЕ сокращай, НЕ изменяй и НЕ генерируй URL самостоятельно
   - Если bookingUrl отсутствует — не показывай кнопку бронирования
4. Укажи цену, звёздность, рейтинг и расстояние до центра
5. Добавь краткое описание отеля

⚠️⚠️⚠️ КРИТИЧЕСКИ ВАЖНО:
- Используй ТОЛЬКО bookingUrl из предоставленных данных
- НИКОГДА не придумывай ссылки типа https://ostrovok.ru/hotel/{id}/
- Не используй hid (числовой ID) для создания ссылок
- Если нет bookingUrl — напиши "Ссылка на бронирование недоступна"

СТРУКТУРА ОТВЕТА ПРО ОТЕЛИ:

## 🏨 Название Отеля ⭐⭐⭐⭐

![Название Отеля](URL_фото_640x400)

📍 **Адрес:** адрес отеля
⭐ **Рейтинг:** X/10
💰 **Цена:** от XXXX ₽ за ночь
🎯 **До центра:** X км

📝 **Описание:** краткое описание отеля

[🛎️ Забронировать отель](ПОЛНАЯ_ССЫЛКА_ИЗ_ДАННЫХ)

⚠️ ВАЖНО: Используй ПОЛНУЮ ссылку из поля bookingUrl без изменений. Не сокращай и не изменяй URL.

---

ФОРМАТИРОВАНИЕ:
# 🌟 Главные рекомендации
# 🏨 Где остановиться
# 🎯 Что посмотреть
# 🍽️ Где поесть`;

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
          region: 'Москва',
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
    
    const { messages, filters = {}, stream: useStream = false } = req.body;
    
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
    const defaultFilters: FilterState = {
      destination: filters?.destination || 'Москва',
      dates: {
        start: filters?.dates?.start || new Date().toISOString().split('T')[0],
        end: filters?.dates?.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      budget: {
        min: filters?.budget?.min || 1000,
        max: filters?.budget?.max || 100000
      },
      preferences: filters?.preferences || [],
      travelers: filters?.travelers || 2,
      children: filters?.children || 0,
      childrenAges: Array.isArray(filters?.childrenAges) ? filters.childrenAges : []
    };

    console.log('[GPT Proxy] Merged filters:', JSON.stringify(defaultFilters, null, 2));

    // Search for hotels via Ostrovok API
    console.log('[GPT Proxy] Searching hotels via Ostrovok...');
    const hotels = await searchOstrovokHotels(defaultFilters);
    console.log(`[GPT Proxy] Found ${hotels.length} hotels`);

    // Format hotels for prompt
    const hotelsText = formatHotelsForGPT(hotels);
    console.log('[GPT Proxy] Hotels text for GPT (first 1000 chars):', hotelsText.substring(0, 1000));

    // Build conversation for OpenRouter
    const conversationMessages = messages.map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.text || msg.content || ''
    }));

    const contextBlock = `Контекст путешествия:\n- Направление: ${defaultFilters.destination}\n- Даты: с ${defaultFilters.dates.start} по ${defaultFilters.dates.end}\n- Бюджет: от ${defaultFilters.budget.min} до ${defaultFilters.budget.max} ₽\n- Путешественников: ${defaultFilters.travelers}${hotelsText}`;

    // Non-streaming: use JSON system prompt so we can parse and format to markdown. Streaming: keep text prompt.
    const systemPromptForRequest = useStream ? SYSTEM_PROMPT : TRAVEL_JSON_SYSTEM_PROMPT;
    const fullMessages = [
      {
        role: 'system',
        content: `${systemPromptForRequest}\n\n${contextBlock}`
      },
      ...conversationMessages
    ];

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
          max_tokens: 2000,
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
      stream.on('data', (chunk: Buffer | string) => {
        if (res.writableEnded) return;
        res.write(chunk);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      });
      stream.on('end', () => {
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
        max_tokens: 2000
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
        const photoUrl = mainImg?.url ? String(mainImg.url).replace('{size}', '640x400') : undefined;
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
      textToSend = formatTripPlanToMarkdown(merged);
      if (!textToSend) textToSend = assistantMessage;
      if (merged.itinerary?.length) itineraryToSend = merged.itinerary;
    } else {
      textToSend = assistantMessage;
    }

    res.json({
      text: textToSend,
      hotels: hotels,
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
