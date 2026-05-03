import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { Pool } from 'pg';
import {
  extractCancellationDeadlineLine,
  extractCancellationPolicyLine,
  extractCheckInOut,
  extractMealLine,
  extractTaxesLine,
} from './etgExtractCert';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';
const ETG_BASE_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
const ETG_KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const ETG_API_TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const ETG_ENABLE_TEST_FALLBACK = process.env.ETG_ENABLE_TEST_FALLBACK === 'true';
const CERT_MODE = process.env.CERT_MODE || 'real';
const FORCE_TEST_HOTELS = CERT_MODE === 'test_hotels';
const CERT_TEST_HOTEL_IDS = ['test_hotel', 'test_hotel_do_not_book'] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type SearchTrace = {
  traceId: string;
  timestamp: string;
  rawUserQuery?: string;
  parsedDestination?: string;
  normalizedDestination?: string;
  parsedDates?: { checkIn: string; checkOut: string };
  adults?: number;
  children?: number;
  childrenAges?: number[];
  endpoint?: string;
  selectedEndpoint?: string;
  etgRequestPayload?: unknown;
  etgResponseSummary?: unknown;
  numberOfHotels?: number;
  firstReferralLink?: string;
  durationMs?: number;
  responseStatus?: number;
  responseTimeMs?: number;
  hotelsFound?: number;
  errorReason?: string;
};

const inMemoryTraces: SearchTrace[] = [];

function hasEtgCredentials(): boolean {
  return Boolean(ETG_KEY_ID && ETG_API_TOKEN);
}

function hasPgConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.PGDATABASE && process.env.PGHOST && process.env.PGUSER)
  );
}

let pgPool: Pool | null = null;

function getPgPool(): Pool {
  if (pgPool) return pgPool;
  if (process.env.DATABASE_URL) {
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    return pgPool;
  }
  pgPool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  return pgPool;
}

function etgAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${ETG_KEY_ID}:${ETG_API_TOKEN}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PartnerName/ai-travel; ClientVersion/1.0.0',
  };
}

function createTraceId(): string {
  return `etg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function logSearchStep(level: 'info' | 'warn' | 'error', traceId: string, step: string, payload?: unknown): void {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger(`[search] ${traceId} ${step}`, payload ?? '');
}
function upsertTrace(trace: Partial<SearchTrace> & { traceId: string }): void {
  const idx = inMemoryTraces.findIndex((t) => t.traceId === trace.traceId);
  if (idx === -1) {
    inMemoryTraces.push({
      traceId: trace.traceId,
      timestamp: new Date().toISOString(),
      ...trace,
    });
  } else {
    inMemoryTraces[idx] = { ...inMemoryTraces[idx], ...trace };
  }
  if (inMemoryTraces.length > 200) inMemoryTraces.splice(0, inMemoryTraces.length - 200);
}

function listRecentTraces(limit = 20): SearchTrace[] {
  return [...inMemoryTraces].slice(-limit).reverse();
}

function normalizeDestination(input: string): { regionHint: string; latitude?: number; longitude?: number; radiusKm?: number } {
  const normalized = (input || '').trim().toLowerCase();
  const coords: Record<string, { lat: number; lng: number; radius: number }> = {
    москва: { lat: 55.7558, lng: 37.6173, radius: 15 },
    moscow: { lat: 55.7558, lng: 37.6173, radius: 15 },
    'санкт-петербург': { lat: 59.9311, lng: 30.3609, radius: 15 },
    'saint petersburg': { lat: 59.9311, lng: 30.3609, radius: 15 },
    питер: { lat: 59.9311, lng: 30.3609, radius: 15 },
    париж: { lat: 48.8566, lng: 2.3522, radius: 12 },
    paris: { lat: 48.8566, lng: 2.3522, radius: 12 },
    дубай: { lat: 25.2048, lng: 55.2708, radius: 20 },
    dubai: { lat: 25.2048, lng: 55.2708, radius: 20 },
  };
  const c = coords[normalized];
  return { regionHint: input || 'Москва', latitude: c?.lat, longitude: c?.lng, radiusKm: c?.radius };
}

function resolveSearchEndpoint(input: { hasCoordinates?: boolean; regionResultCount?: number }) {
  if ((input.regionResultCount ?? 1) === 0 && input.hasCoordinates) {
    return { endpoint: '/api/b2b/v3/search/serp/geo/', reason: 'region_empty_geo_fallback' as const };
  }
  return { endpoint: '/api/b2b/v3/search/serp/region/', reason: 'primary_region_search' as const };
}

function toDMY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
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

function rewriteOstrovokHybridHotelPathToSerp(url: string): string | null {
  const raw = String(url || '').trim().replace(/&amp;/gi, '&');
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;
  let pathname = '';
  try {
    pathname = new URL(raw).pathname;
  } catch {
    return null;
  }
  if (!/^\/hotel\/[^/]+/i.test(pathname)) return null;
  if (!/(?:[?&])q=(\d+)(?:&|#|$)/i.test(raw)) return null;
  try {
    const u = new URL(raw);
    const serp = new URL('https://www.ostrovok.ru/hotels/');
    u.searchParams.forEach((v, k) => serp.searchParams.set(k, v));
    return serp.toString();
  } catch {
    return null;
  }
}

function rewriteOstrovokHotelPathToRooms(url: string): string | null {
  const raw = String(url || '').trim().replace(/&amp;/gi, '&');
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (/^\/rooms\/[^/]+/i.test(parsed.pathname)) return raw;
  if (!/^\/hotel\/[^/]+/i.test(parsed.pathname)) return null;

  const parts = parsed.pathname
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'hotel') return null;

  let slug = '';
  if (parts.length === 2) {
    const q = parsed.searchParams.get('q');
    if (q && /^\d+$/.test(q)) return null;
    slug = parts[1] || '';
  } else {
    for (let i = parts.length - 1; i >= 1; i -= 1) {
      const seg = parts[i];
      if (!seg) continue;
      if (/^mid\d+$/i.test(seg)) continue;
      if (/^(hotel|hotels|rooms)$/i.test(seg)) continue;
      slug = seg;
      break;
    }
  }

  if (!slug || /^\d+$/.test(slug)) return null;
  const rooms = new URL(`https://www.ostrovok.ru/rooms/${encodeURIComponent(slug)}/`);
  parsed.searchParams.forEach((v, k) => rooms.searchParams.set(k, v));
  return rooms.toString();
}

// Маппинг популярных городов на region_id Ostrovok
const CITY_REGION_MAP: Record<string, number> = {
  // В текущем ETG-окружении нужны валидные region_id из доступного набора ключа.
  'москва': 2395, 'moscow': 2395,
  'париж': 2734, 'paris': 2734,
  'казань': 1993, 'kazan': 1993, 'казани': 1993,
  'дубай': 6053839, 'dubai': 6053839,
  'лос-анджелес': 2011, 'los angeles': 2011, 'pasadena': 2011,
};

function getRegionIdByCity(destination?: string): number | null {
  if (!destination) return null;
  const normalized = destination.toLowerCase().trim();
  return CITY_REGION_MAP[normalized] || null;
}

function stableRgExtKey(rgExt: Record<string, unknown> | null | undefined): string | null {
  if (!rgExt || typeof rgExt !== 'object') return null;
  const keys = Object.keys(rgExt).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) normalized[key] = rgExt[key];
  return JSON.stringify(normalized);
}

type RoomGroupStaticRow = {
  name: string | null;
  room_amenities: unknown;
  images: unknown;
};

async function getRoomGroupByRgExt(hid: string, rgExt: Record<string, unknown> | null | undefined): Promise<RoomGroupStaticRow | null> {
  const key = stableRgExtKey(rgExt);
  if (!key || !hasPgConfig()) return null;
  const pool = getPgPool();
  const result = await pool.query<RoomGroupStaticRow>(
    `SELECT name, room_amenities, images
       FROM etg_room_groups
      WHERE hid = $1 AND rg_ext_key = $2
      LIMIT 1`,
    [hid, key]
  );
  return result.rows[0] ?? null;
}

function buildTextSearchFallbackLink(checkIn: string, checkOut: string, adults: number, destination?: string): string {
  const u = new URL('https://www.ostrovok.ru/hotels/');
  // Если известен город, используем его region_id для поиска
  const regionId = getRegionIdByCity(destination);
  if (regionId) {
    u.searchParams.set('q', String(regionId));
  }
  // IMPORTANT: text q (e.g. "Париж") can produce 404 on Ostrovok partner SERP.
  // Keep fallback generic when numeric region_id is unavailable.
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(adults));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

function buildSerpFallbackLink(
  checkIn: string,
  checkOut: string,
  adults: number,
  destination?: string,
  regionId?: unknown
): string {
  const u = new URL('https://www.ostrovok.ru/hotels/');
  const rid = typeof regionId === 'number' || (typeof regionId === 'string' && /^\d+$/.test(regionId))
    ? String(regionId)
    : '';
  if (rid) u.searchParams.set('q', rid);
  else return buildTextSearchFallbackLink(checkIn, checkOut, adults, destination);
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(adults));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

async function searchSerpRegion(regionId: number, params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/region/`,
    {
      region_id: regionId,
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: 8000 }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

async function searchSerpGeo(latitude: number, longitude: number, radiusKm: number, params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/geo/`,
    {
      latitude,
      longitude,
      radius: radiusKm,
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: 8000 }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

async function searchSerpHotels(ids: readonly string[], params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/hotels/`,
    {
      ids: [...ids],
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: 8000 }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

// Inline the JSON-system-prompt to avoid Vercel runtime module resolution issues
// (ERR_MODULE_NOT_FOUND for ../src/prompts/travelJsonSystemPrompt).
const TRAVEL_JSON_SYSTEM_PROMPT = `Ты — AI-планировщик путешествий премиального уровня. Твоя задача — составлять персонализированный план поездки в структурированном виде.

Как ты работаешь:
- Учитывай направление, длительность, бюджет, состав путешественников и стиль поездки.
- Строй реалистичный маршрут, группируй активности логично (утро / день / вечер).
- Подбирай только подходящие отели из переданного списка — НЕ придумывай отели.
- bookingUrl, photoUrl, цены и рейтинги бери ТОЛЬКО из контекста (список отелей). Не выдумывай ссылки и данные.
- Объясняй, почему выбран район и отель. Избегай общих туристических фраз и клише.
- Не выдавай слишком длинные перечни мест. Не фантазируй факты.
- Делай ответ практически полезным: конкретные места, конкретные шаги, конкретные советы.
- В tripSummary дай 2-4 предложения с ориентиром по логистике/ритму поездки.
- В recommendedAreas дай 2-3 района с понятной причиной выбора.
- В itinerary по каждому дню указывай 2-4 реальных точки интереса (не абстрактные "музей/парк").
- В foodRecommendations и highlights указывай конкретные названия заведений/мест, когда это уместно.

Если каких-то данных не хватает, сделай разумное предположение и укажи его в массиве assumptions.

КРИТИЧНО — формат ответа:
Твой ответ должен быть ТОЛЬКО одним валидным JSON-объектом. Запрещено:
- писать markdown;
- добавлять пояснительный текст до или после JSON;
- обрамлять JSON в \`\`\`json ... \`\`\` или кавычки;
- добавлять комментарии вне JSON.

Обязательная структура JSON (все поля должны присутствовать; если данных нет — пустая строка или пустой массив):

{
  "tripSummary": "string",
  "assumptions": ["string"],
  "recommendedAreas": [
    { "name": "string", "reason": "string" }
  ],
  "hotelRecommendations": [
    {
      "name": "string",
      "whyThisHotel": "string",
      "bookingUrl": "string",
      "photoUrl": "string",
      "price": "string",
      "stars": "string",
      "rating": "string",
      "address": "string",
      "distanceToCenter": "string",
      "description": "string"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "morning": ["string"],
      "daytime": ["string"],
      "evening": ["string"]
    }
  ],
  "highlights": ["string"],
  "foodRecommendations": ["string"],
  "practicalTips": ["string"],
  "followUpQuestion": "string"
}

В hotelRecommendations используй ТОЛЬКО отели из предоставленного списка. Все URL и фото бери из контекста.` as const;

const SYSTEM_PROMPT = `Ты — опытный туристический ассистент и профессиональный travel-блогер.
Твоя задача — помогать пользователям планировать путешествия, предоставляя персонализированные рекомендации.

ВАЖНО: В твоём распоряжении есть актуальные данные об отелях из Ostrovok.ru с реальными ценами, фото и ссылками на бронирование.
Используй ТОЛЬКО эти данные при составлении рекомендаций по размещению. НЕ ПРИДУМЫВАЙ отели — используй только те, что в списке ниже.

ПРАВИЛА ОТВЕТОВ:
1. Используй ТОЛЬКО отели из предоставленного списка "Рекомендуемые отели"
2. Для каждого отеля ОБЯЗАТЕЛЬНО включи фото используя markdown: ![название отеля](URL_фото)
3. Добавь кнопку бронирования ТОЧНО в формате: [🛎️ Забронировать отель](URL_бронирования)
4. Укажи цену, звёздность, рейтинг и расстояние до центра
5. Добавь краткое описание отеля

⚠️ ВАЖНО: Используй ТОЛЬКО bookingUrl из предоставленных данных. Не придумывай ссылки.`;

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterCompletionResponse {
  choices?: OpenRouterChoice[];
}

interface HotelForApi {
  id: string;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  price: number;
  currency: string;
  images?: { category: string; url: string }[];
  bookingUrl: string;
  distanceToCenter?: number;
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

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x)).filter(Boolean);
}

function toImageArray(input: unknown): Array<{ category: string; url: string }> {
  if (!Array.isArray(input)) return [];
  return input
    .map((img) => {
      if (typeof img === 'string') {
        return { category: 'room', url: img };
      }
      if (!img || typeof img !== 'object') return null;
      const url = typeof (img as any).url === 'string' ? (img as any).url : '';
      if (!url) return null;
      const category =
        typeof (img as any).category === 'string' && (img as any).category.trim()
          ? (img as any).category.trim()
          : 'room';
      return { category, url };
    })
    .filter((x): x is { category: string; url: string } => Boolean(x));
}

function buildTestHotelUrl(checkIn: string, checkOut: string, guests: number): string {
  const u = new URL('https://www.ostrovok.ru/rooms/test_hotel/');
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(guests));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

function getCertificationTestHotels(destination: string, checkIn: string, checkOut: string, guests: number): HotelForApi[] {
  const bookingUrl = buildTestHotelUrl(checkIn, checkOut, guests);
  return [
    {
      id: 'test_hotel',
      name: `Test Hotel (${destination})`,
      stars: 4,
      rating: 8.1,
      address: `${destination}, test address`,
      price: 5000,
      currency: 'RUB',
      bookingUrl,
      images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop' }],
      mealType: 'Режим CERT_MODE=test_hotels: для проверки полей сертификации включите CERT_MODE=real и live SERP.',
      cancellationPolicy: 'Режим CERT_MODE=test_hotels: нет live cancellation_penalties.',
      cancellationDeadline: '—',
      checkInTime: '—',
      checkOutTime: '—',
      taxesAndFees: 'Режим CERT_MODE=test_hotels: нет live tax_data.',
    },
  ];
}

function humanizeHotelId(value: string): string {
  const cleaned = String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function mapEtgHotelToApi(
  hotel: any,
  checkIn: string,
  checkOut: string,
  adults: number,
  destination?: string,
  fallbackRegionId?: number | string
): HotelForApi {
  const rawId = String(hotel?.id || hotel?.hid || '').trim();
  const fallbackName =
    rawId === 'test_hotel'
      ? 'Test Hotel'
      : rawId === 'test_hotel_do_not_book'
      ? 'Test Hotel Do Not Book'
      : rawId
      ? humanizeHotelId(rawId)
      : 'Hotel';
  const fallbackAddress = rawId.startsWith('test_hotel') ? 'Test Address' : '';
  const rate = hotel?.rates?.[0];
  const startDate = parseIsoDate(checkIn);
  const endDate = parseIsoDate(checkOut);
  const nights = startDate && endDate ? diffDaysUtc(startDate, endDate) : 1;
  const dailyPrices = Array.isArray(rate?.daily_prices)
    ? (rate.daily_prices as unknown[])
        .map((p) => Number(p))
        .filter((p) => Number.isFinite(p) && p > 0)
    : [];
  const rawAmount = Number(
    rate?.payment_options?.payment_types?.[0]?.show_amount ?? rate?.amount ?? hotel?.min_price ?? 0
  );
  const amount =
    dailyPrices.length > 0
      ? Math.min(...dailyPrices)
      : Number.isFinite(rawAmount) && rawAmount > 0
      ? (nights > 1 ? rawAmount / nights : rawAmount)
      : 0;
  const bookingUrl =
    typeof rate?.payment_options?.payment_types?.[0]?.link === 'string'
      ? rewriteOstrovokHotelPathToRooms(rate.payment_options.payment_types[0].link) ||
        rewriteOstrovokHybridHotelPathToSerp(rate.payment_options.payment_types[0].link) ||
        rate.payment_options.payment_types[0].link
      : buildSerpFallbackLink(
          checkIn,
          checkOut,
          adults,
          destination,
          hotel?.region?.id ?? hotel?.region_id ?? fallbackRegionId
        );

  const cinout = extractCheckInOut(hotel);

  return {
    id: rawId,
    name: hotel?.name || fallbackName,
    stars: Number(hotel?.stars || 0),
    rating: typeof hotel?.rating === 'number' ? hotel.rating : undefined,
    address: hotel?.address || fallbackAddress,
    price: Number.isFinite(amount) ? amount : 0,
    currency: rate?.payment_options?.show_currency_code || hotel?.currency || 'RUB',
    images: Array.isArray(hotel?.images_ext)
      ? hotel.images_ext.map((i: any) => ({ category: i?.category || 'exterior', url: i?.url || '' }))
      : undefined,
    bookingUrl,
    distanceToCenter: typeof hotel?.distance_center === 'number' ? hotel.distance_center : undefined,
    taxesAndFees: extractTaxesLine(rate),
    mealType: extractMealLine(rate),
    cancellationPolicy: extractCancellationPolicyLine(rate),
    cancellationDeadline: extractCancellationDeadlineLine(rate),
    checkInTime: cinout.in,
    checkOutTime: cinout.out,
    metapolicyHighlights: hotel?.metapolicy_struct ? [JSON.stringify(hotel.metapolicy_struct)] : undefined,
    roomName: rate?.room_name,
    roomAmenities: Array.isArray(rate?.amenities) ? rate.amenities.map((a: any) => String(a)) : undefined,
    amenities: Array.isArray(hotel?.amenities) ? hotel.amenities.map((a: any) => String(a)) : undefined,
  };
}

async function enrichHotelsWithRoomGroups(rawHotels: any[], hotels: HotelForApi[]): Promise<HotelForApi[]> {
  if (!hasPgConfig()) return hotels;
  const enriched: HotelForApi[] = [];
  for (let i = 0; i < hotels.length; i += 1) {
    const mapped = hotels[i];
    const raw = rawHotels[i];
    const hid = String(raw?.hid ?? '');
    const rgExt = raw?.rates?.[0]?.rg_ext as Record<string, unknown> | undefined;
    if (!hid || !rgExt) {
      enriched.push(mapped);
      continue;
    }
    try {
      const row = await getRoomGroupByRgExt(hid, rgExt);
      if (!row) {
        enriched.push(mapped);
        continue;
      }
      const staticAmenities = toStringArray(row.room_amenities);
      const roomImages = toImageArray(row.images).slice(0, 4);
      const mergedImages =
        roomImages.length > 0
          ? [...roomImages, ...(mapped.images || [])]
          : mapped.images;
      enriched.push({
        ...mapped,
        roomName: row.name && row.name.trim() ? row.name : mapped.roomName,
        roomAmenities:
          staticAmenities.length > 0 ? staticAmenities : mapped.roomAmenities,
        images: mergedImages,
      });
    } catch {
      enriched.push(mapped);
    }
  }
  return enriched;
}

function formatHotelsForPrompt(hotels: HotelForApi[]): string {
  if (hotels.length === 0) return '';
  let text = '\n\n# 🏨 Рекомендуемые отели (используй ТОЛЬКО эти отели)\n\n';
  hotels.forEach((hotel, index) => {
    const stars = '⭐'.repeat(hotel.stars);
    text += `### ${index + 1}. ${hotel.name} ${stars}\n\n`;
    if (hotel.images?.[0]) {
      text += `![${hotel.name}](${hotel.images[0].url})\n\n`;
    }
    text += `- **Адрес:** ${hotel.address}\n`;
    if (hotel.rating) text += `- **Рейтинг:** ${hotel.rating}/10\n`;
    text += `- **Цена:** от ${hotel.price.toLocaleString('ru-RU')} ${hotel.currency}\n`;
    if (hotel.taxesAndFees) text += `- **Налоги и сборы:** ${hotel.taxesAndFees}\n`;
    if (hotel.mealType) text += `- **Питание:** ${hotel.mealType}\n`;
    if (hotel.cancellationPolicy) text += `- **Политика отмены:** ${hotel.cancellationPolicy}\n`;
    if (hotel.cancellationDeadline) text += `- **Дедлайн отмены:** ${hotel.cancellationDeadline}\n`;
    if (hotel.checkInTime || hotel.checkOutTime) {
      text += `- **Check-in / Check-out:** ${hotel.checkInTime || '-'} / ${hotel.checkOutTime || '-'}\n`;
    }
    if (hotel.metapolicyHighlights?.length) {
      text += `- **Важные ограничения:** ${hotel.metapolicyHighlights.join('; ')}\n`;
    }
    if (hotel.roomName) text += `- **Номер:** ${hotel.roomName}\n`;
    if (hotel.distanceToCenter) {
      const km = hotel.distanceToCenter / 1000;
      text += `- **До центра:** ${km < 1 ? `${Math.round(hotel.distanceToCenter)} м` : `${km.toFixed(1)} км`}\n`;
    }
    text += `\n[🛎️ Забронировать ${hotel.name}](${hotel.bookingUrl})\n\n---\n\n`;
  });
  text += '\n⚠️ **ВАЖНО:** Используй ТОЛЬКО эти отели в своих рекомендациях.\n';
  return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    const traceId = typeof req.query.traceId === 'string' ? req.query.traceId : undefined;
    if (traceId) {
      const trace = inMemoryTraces.find((t) => t.traceId === traceId);
      if (!trace) return res.status(404).json({ error: 'Trace not found' });
      return res.status(200).json({ trace });
    }
    return res.status(200).json({ traces: listRecentTraces(30) });
  }

  if (req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({
      error: 'OpenRouter API key is not configured',
      message: 'Set OPENROUTER_API_KEY in Vercel environment variables',
    });
  }

  let useStream = false;
  try {
    const body = req.body as {
      messages?: { role: string; text: string }[];
      filters?: Record<string, unknown>;
      stream?: boolean;
    };
    const messages = body?.messages ?? [];
    const filters = body?.filters as {
      destination?: string;
      dates?: { start?: string; end?: string };
      durationDays?: number;
      budget?: { min?: number; max?: number };
      travelers?: number;
    } | undefined;
    // IMPORTANT:
    // На Vercel иногда стриминг (`stream=true`) падает с FUNCTION_INVOCATION_FAILED.
    // Чтобы гарантировать стабильность и корректную работу фронта,
    // отключаем stream и всегда возвращаем обычный JSON.
    useStream = false;

    const destination = filters?.destination ?? 'Москва';
    const lastUserText = [...messages]
      .reverse()
      .find((m) => (m?.role || 'user') === 'user' && typeof m?.text === 'string');
    const durationFromMessage = parseDurationDays(String(lastUserText?.text || ''));
    const durationFromFilters = Number(filters?.durationDays);
    const requestedDurationDays =
      Number.isFinite(durationFromFilters) && durationFromFilters > 0
        ? Math.max(1, Math.min(30, Math.round(durationFromFilters)))
        : durationFromMessage;
    const startDate = parseIsoDate(filters?.dates?.start) || new Date();
    let endDate = parseIsoDate(filters?.dates?.end);
    if (!endDate || endDate.getTime() <= startDate.getTime()) {
      endDate = addDaysUtc(startDate, requestedDurationDays || 7);
    } else if (durationFromMessage) {
      endDate = addDaysUtc(startDate, durationFromMessage);
    }
    const start = formatIsoDate(startDate);
    const end = formatIsoDate(endDate);
    const travelers = filters?.travelers ?? 2;
    const childrenAges = Array.isArray((filters as any)?.childrenAges)
      ? ((filters as any).childrenAges as unknown[]).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x >= 0 && x <= 17)
      : [];
    const budgetMin = filters?.budget?.min ?? 1000;
    const budgetMax = filters?.budget?.max ?? 100000;
    const traceId = createTraceId();
    const rawUserQuery = messages?.[messages.length - 1]?.text || '';
    upsertTrace({
      traceId,
      rawUserQuery,
      parsedDestination: destination,
      parsedDates: { checkIn: start, checkOut: end },
      adults: travelers,
      children: childrenAges.length,
      childrenAges,
    });
    logSearchStep('info', traceId, 'request_received', {
      destination,
      start,
      end,
      requestedDurationDays: requestedDurationDays || diffDaysUtc(startDate, endDate),
      travelers,
      childrenAgesCount: childrenAges.length
    });
    const normalized = normalizeDestination(destination);
    const regionId = getRegionIdByCity(normalized.regionHint || destination);
    upsertTrace({ traceId, normalizedDestination: normalized.regionHint });
    logSearchStep('info', traceId, 'destination_normalized', { ...normalized, regionId });

    const endpoint = resolveSearchEndpoint({
      hasCoordinates: Boolean(normalized.latitude && normalized.longitude),
      regionResultCount: regionId ? 1 : 0,
    });
    upsertTrace({ traceId, endpoint: endpoint.endpoint });
    logSearchStep('info', traceId, 'endpoint_selected', endpoint);

    let hotels: HotelForApi[] = [];
    const HOTEL_RESULTS_LIMIT = 10;
    const canUseTestIdFallback = ETG_ENABLE_TEST_FALLBACK && process.env.NODE_ENV !== 'production';
    const searchStartedAt = Date.now();
    try {
      if (FORCE_TEST_HOTELS) {
        hotels = getCertificationTestHotels(destination, start, end, travelers);
        upsertTrace({
          traceId,
          selectedEndpoint: 'test_hotels:forced_by_cert_mode',
          numberOfHotels: hotels.length,
          firstReferralLink: hotels[0]?.bookingUrl,
        });
      } else {
      if (!hasEtgCredentials()) {
        throw new Error('ETG credentials are not configured');
      }

      let rawHotels: any[] = [];
      const stepErrors: string[] = [];
      if (regionId) {
        try {
          rawHotels = await searchSerpRegion(regionId, {
            checkIn: start,
            checkOut: end,
            adults: travelers,
            childrenAges,
          });
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/region/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/region/',
              region_id: regionId,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_region_failed';
          stepErrors.push(`serp_region:${msg}`);
          logSearchStep('warn', traceId, 'serp_region_failed', { regionId, error: msg });
        }
      }

      if (rawHotels.length === 0 && normalized.latitude && normalized.longitude) {
        try {
          const geoEndpoint = resolveSearchEndpoint({
            hasCoordinates: true,
            regionResultCount: 0,
          });
          upsertTrace({ traceId, endpoint: geoEndpoint.endpoint });
          logSearchStep('warn', traceId, 'region_empty_geo_fallback', geoEndpoint);
          rawHotels = await searchSerpGeo(
            normalized.latitude,
            normalized.longitude,
            normalized.radiusKm || 10,
            {
              checkIn: start,
              checkOut: end,
              adults: travelers,
              childrenAges,
            }
          );
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/geo/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/geo/',
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              radius: normalized.radiusKm || 10,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_geo_failed';
          stepErrors.push(`serp_geo:${msg}`);
          logSearchStep('warn', traceId, 'serp_geo_failed', { error: msg });
        }
      }

      if (rawHotels.length === 0 && canUseTestIdFallback) {
        try {
          logSearchStep('warn', traceId, 'primary_search_empty_use_test_hotel_ids', {
            ids: CERT_TEST_HOTEL_IDS,
          });
          rawHotels = await searchSerpHotels(CERT_TEST_HOTEL_IDS, {
            checkIn: start,
            checkOut: end,
            adults: travelers,
            childrenAges,
          });
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/hotels/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/hotels/',
              ids: CERT_TEST_HOTEL_IDS,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_hotels_failed';
          stepErrors.push(`serp_hotels:${msg}`);
          logSearchStep('warn', traceId, 'serp_hotels_failed', { error: msg });
        }
      }

      if (rawHotels.length === 0) {
        throw new Error(
          `No hotels returned from region/geo search${canUseTestIdFallback ? '/test-hotel fallback' : ''}${stepErrors.length ? ` (${stepErrors.join('; ')})` : ''}`
        );
      }

      rawHotels = rawHotels.slice(0, HOTEL_RESULTS_LIMIT);
      const fallbackRegionId = rawHotels
        .map((h: any) => h?.region?.id ?? h?.region_id)
        .find((id: unknown) => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)));
      hotels = rawHotels.map((h) =>
        mapEtgHotelToApi(
          h,
          start,
          end,
          travelers,
          destination,
          fallbackRegionId as number | string | undefined
        )
      );
      hotels = await enrichHotelsWithRoomGroups(rawHotels, hotels);
      upsertTrace({
        traceId,
        responseStatus: 200,
        responseTimeMs: Date.now() - searchStartedAt,
        hotelsFound: hotels.length,
        etgResponseSummary: {
          hotelsCount: hotels.length,
        },
        numberOfHotels: hotels.length,
        firstReferralLink: hotels[0]?.bookingUrl,
        durationMs: Date.now() - searchStartedAt,
      });
      logSearchStep('info', traceId, 'search_success', { hotelsFound: hotels.length, responseTimeMs: Date.now() - searchStartedAt });
      }
    } catch (searchError: unknown) {
      const reason = searchError instanceof Error ? searchError.message : 'search_failed';
      upsertTrace({
        traceId,
        responseStatus: 500,
        responseTimeMs: Date.now() - searchStartedAt,
        hotelsFound: 0,
        errorReason: reason,
      });
      logSearchStep('error', traceId, 'search_failed', { reason, responseTimeMs: Date.now() - searchStartedAt });
      const canUseFallback = FORCE_TEST_HOTELS || canUseTestIdFallback;
      if (!canUseFallback) {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(502).json({
          error: 'Hotel search failed',
          message: reason,
          emptyState: true,
          traceId,
        });
      }
      upsertTrace({
        traceId,
        selectedEndpoint: 'test_hotels:fallback_after_error',
      });
      hotels = getCertificationTestHotels(destination, start, end, travelers);
    }
    const hotelsText = formatHotelsForPrompt(hotels);

    const conversationMessages = messages
      .map((msg) => ({
        role: msg.role || 'user',
        content: msg.text || '',
      }))
      .filter((msg) => msg.role !== 'system')
      .filter((msg) => typeof msg.content === 'string' && msg.content.trim() !== '');

    if (durationFromMessage && isDurationOnlyMessage(String(lastUserText?.text || ''))) {
      conversationMessages.push({
        role: 'user',
        content: `Составь детальный маршрут по ${destination} на ${durationFromMessage} дня по дням (утро/день/вечер), с практическими советами и логичной последовательностью.`,
      });
    }

    const effectiveDurationDays = requestedDurationDays || diffDaysUtc(startDate, endDate);
    const contextBlock = `Контекст путешествия:\n- Направление: ${destination}\n- Даты: с ${start} по ${end}\n- Длительность: ${effectiveDurationDays} дней\n- Бюджет: от ${budgetMin} до ${budgetMax} ₽\n- Путешественников: ${travelers}${hotelsText}`;
    const systemPromptForRequest = useStream ? SYSTEM_PROMPT : TRAVEL_JSON_SYSTEM_PROMPT;
    const durationInstruction =
      effectiveDurationDays > 0
        ? `\n\nКРИТИЧНО: В поле itinerary верни РОВНО ${effectiveDurationDays} дней (day: 1..${effectiveDurationDays}), без пропусков и пустых дней.`
        : '';
    const systemContent = `${systemPromptForRequest}${durationInstruction}\n\n${contextBlock}`;

    if (useStream) {
      const streamHeaders = {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      };
      res.writeHead(200, streamHeaders);
      res.write(`data: ${JSON.stringify({ type: 'hotels', hotels })}\n\n`);
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: systemContent },
              ...conversationMessages,
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': req.headers.origin || 'https://vercel.app',
              'X-Title': 'AI Travel Assistant',
            },
            responseType: 'stream',
            timeout: 60000,
          }
        );

        (response.data as NodeJS.ReadableStream).pipe(res);
        return;
      } catch (streamError) {
        // Важно: в режиме stream нельзя пытаться вернуть JSON 500 —
        // headers уже отправлены. Завершаем stream корректно.
        console.error('[api/openai] streamError:', streamError);
        try {
          res.write(
            `data: ${JSON.stringify({
              error: {
                message: 'Streaming failed',
              },
            })}\n\n`
          );
        } catch {
          // ignore write errors
        }
        res.end();
        return;
      }
    }

    const response = await axios.post<OpenRouterCompletionResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          ...conversationMessages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.origin || 'https://vercel.app',
          'X-Title': 'AI Travel Assistant',
        },
        timeout: 25000,
      }
    );

    const assistantMessage = response.data.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(502).json({ error: 'Empty response from OpenRouter API' });
    }

    const textToSend = assistantMessage;

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({
      text: textToSend,
      hotels,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    console.error('[api/openai] Error:', err?.message, err?.response?.data);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    if (useStream && res.headersSent) {
      try {
        res.end();
      } catch {
        // ignore
      }
      return;
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: err?.message ?? 'Unknown error',
    });
  }
}
