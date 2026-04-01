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

export async function searchSerpRegion(region: string, params: EtgSearchParams): Promise<any[]> {
  const start = Date.now();
  const response = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/region/`,
    { region, ...buildCommonPayload(params) },
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
