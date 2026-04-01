export type SearchMode = 'serp_region' | 'serp_hotels' | 'serp_geo';

export interface EndpointResolutionInput {
  hotelIds?: string[];
  hasCoordinates?: boolean;
  regionResultCount?: number;
}

export interface EndpointResolution {
  mode: SearchMode;
  endpoint: '/api/b2b/v3/search/serp/region/' | '/api/b2b/v3/search/serp/hotels/' | '/api/b2b/v3/search/serp/geo/';
  reason: string;
}

export function resolveSearchEndpoint(input: EndpointResolutionInput): EndpointResolution {
  if (Array.isArray(input.hotelIds) && input.hotelIds.length > 0) {
    return {
      mode: 'serp_hotels',
      endpoint: '/api/b2b/v3/search/serp/hotels/',
      reason: 'known_hotel_ids',
    };
  }

  if ((input.regionResultCount ?? 1) === 0 && input.hasCoordinates) {
    return {
      mode: 'serp_geo',
      endpoint: '/api/b2b/v3/search/serp/geo/',
      reason: 'region_empty_geo_fallback',
    };
  }

  return {
    mode: 'serp_region',
    endpoint: '/api/b2b/v3/search/serp/region/',
    reason: 'primary_region_search',
  };
}
