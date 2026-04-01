export interface NormalizedDestination {
  input: string;
  normalized: string;
  regionHint?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; radius: number }> = {
  москва: { lat: 55.7558, lng: 37.6173, radius: 15 },
  moscow: { lat: 55.7558, lng: 37.6173, radius: 15 },
  'санкт-петербург': { lat: 59.9311, lng: 30.3609, radius: 15 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609, radius: 15 },
  питер: { lat: 59.9311, lng: 30.3609, radius: 15 },
  дубай: { lat: 25.2048, lng: 55.2708, radius: 20 },
  dubai: { lat: 25.2048, lng: 55.2708, radius: 20 },
};

export function normalizeDestination(input: string): NormalizedDestination {
  const cleaned = (input || '').trim();
  const normalized = cleaned.toLowerCase().replace(/\s+/g, ' ');
  const coords = CITY_COORDINATES[normalized];
  return {
    input: cleaned,
    normalized,
    regionHint: cleaned || 'Москва',
    latitude: coords?.lat,
    longitude: coords?.lng,
    radiusKm: coords?.radius,
  };
}
