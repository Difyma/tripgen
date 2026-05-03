import axios from 'axios';
import { ETG_BASE_URL, clampEtgTimeout, etgAuthHeaders } from '../config/etg.js';

export interface EtgSearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenAges?: number[];
  language?: string;
  currency?: string;
  residency?: string;
  timeoutMs?: number;
}

const CITY_REGION_MAP: Record<string, number> = {
  // region_id из ETG API. Включены склонённые формы которые передаёт фронт.
  москва: 2395, москве: 2395, москвы: 2395, москву: 2395, moscow: 2395,
  'санкт-петербург': 2114, 'санкт-петербурге': 2114, 'санкт-петербурга': 2114, 'санкт-петербургу': 2114,
  питер: 2114, 'saint petersburg': 2114, 'st. petersburg': 2114,
  париж: 2734, париже: 2734, парижа: 2734, парижу: 2734, paris: 2734,
  казань: 1993, казани: 1993, kazan: 1993,
  дубай: 6053839, дубае: 6053839, dubai: 6053839,
  лондон: 211, лондоне: 211, лондона: 211, лондону: 211, london: 211,
  рим: 1187, риме: 1187, рима: 1187, риму: 1187, rome: 1187,
  берлин: 964, берлине: 964, берлина: 964, берлину: 964, berlin: 964,
  амстердам: 1242, амстердаме: 1242, амстердама: 1242, амстердаму: 1242, amsterdam: 1242,
  барселона: 1189, барселоне: 1189, барселоны: 1189, барселону: 1189, barcelona: 1189,
  мадрид: 1190, мадриде: 1190, мадрида: 1190, мадриду: 1190, madrid: 1190,
  вена: 1352, вене: 1352, вены: 1352, вену: 1352, vienna: 1352,
  прага: 1004, праге: 1004, праги: 1004, прагу: 1004, prague: 1004,
  милан: 1188, милане: 1188, милана: 1188, милану: 1188, milan: 1188,
  неаполь: 1191, неаполе: 1191, неаполя: 1191, неаполю: 1191, naples: 1191,
  венеция: 1193, венеции: 1193, венецию: 1193, venice: 1193,
  флоренция: 1194, флоренции: 1194, флоренцию: 1194, florence: 1194,
  стамбул: 876, стамбуле: 876, стамбула: 876, стамбулу: 876, istanbul: 876,
  бангкок: 1990, бангкоке: 1990, bangkok: 1990,
  токио: 1987, токие: 1987, tokyo: 1987,
  сочи: 1978, sochi: 1978,
  'лос-анджелес': 2011, 'лос-анджелесе': 2011, 'los angeles': 2011, pasadena: 2011,
  лиссабон: 1461, лиссабоне: 1461, lisbon: 1461,
  'нью-йорк': 163, 'нью-йорке': 163, 'new york': 163,
};

function buildCommonPayload(params: EtgSearchParams) {
  return {
    checkin: params.checkIn,
    checkout: params.checkOut,
    guests: [{ adults: params.adults, children: params.childrenAges || [] }],
    language: params.language || 'ru',
    currency: params.currency || 'RUB',
    residency: params.residency || 'ru',
  };
}

function resolveRegionPayload(region: string): { region_id: number } | { region: string } {
  const trimmed = String(region || '').trim();
  if (/^\d+$/.test(trimmed)) {
    const regionId = Number(trimmed);
    if (Number.isFinite(regionId) && regionId > 0) return { region_id: regionId };
    throw new Error(`Invalid region_id: ${trimmed}`);
  }
  const mapped = CITY_REGION_MAP[trimmed.toLowerCase()];
  if (mapped) return { region_id: mapped };
  throw new Error(`Unknown region: "${trimmed}" (region_id mapping required)`);
}

export async function searchSerpRegion(region: string, params: EtgSearchParams): Promise<any[]> {
  const start = Date.now();
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/region/`,
    { ...resolveRegionPayload(region), ...buildCommonPayload(params) },
    { headers: etgAuthHeaders(), timeout: clampEtgTimeout(params.timeoutMs) }
  );
  const hotels = response.data?.data?.hotels || response.data?.hotels || [];
  void start;
  return hotels;
}

export async function searchSerpGeo(latitude: number, longitude: number, radiusKm: number, params: EtgSearchParams): Promise<any[]> {
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/geo/`,
    { latitude, longitude, radius: radiusKm, ...buildCommonPayload(params) },
    { headers: etgAuthHeaders(), timeout: clampEtgTimeout(params.timeoutMs) }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

export async function searchSerpHotels(ids: string[], params: EtgSearchParams): Promise<any[]> {
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/hotels/`,
    { ids, ...buildCommonPayload(params) },
    { headers: etgAuthHeaders(), timeout: clampEtgTimeout(params.timeoutMs) }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}
