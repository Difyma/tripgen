/**
 * Ostrovok (ETG) API Full Integration Routes
 * Provides complete hotel data including photos, descriptions, amenities, and policies
 * 
 * API Documentation: https://docs.emergingtravel.com
 */

import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { DEMO_HOTELS as REALISTIC_DEMO_HOTELS, TEST_HOTELS } from '../src/demoHotels.js';

dotenv.config();

const router = express.Router();

// API Configuration
// ETG (Emerging Travel Group) API v3 URL
// Production/Staging: https://api.worldota.net
const OSTROVOK_API_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
const OSTROVOK_API_KEY = process.env.OSTROVOK_API_KEY;
const OSTROVOK_API_SECRET = process.env.OSTROVOK_API_SECRET;
const PARTNER_ID = process.env.OSTROVOK_PARTNER_ID;

// Default request timeout (30 seconds as per ETG recommendations)
const DEFAULT_TIMEOUT = 30000;

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

// Popular cities coordinates mapping for geo search
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

// ============ TYPES ============

interface Guest {
  adults: number;
  children: number[];
}

interface SearchRequest {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  children?: number[];
  residency?: string;
  currency?: string;
  language?: string;
}

interface HotelIdsRequest {
  ids: string[];
  checkIn: string;
  checkOut: string;
  guests: Guest[];
  residency?: string;
  currency?: string;
  language?: string;
}

interface HotelPageRequest {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: Guest[];
  residency?: string;
  currency?: string;
  language?: string;
}

interface HotelContentRequest {
  id: string;
  language?: string;
}

// ============ MIDDLEWARE ============

// Validate API credentials (test mode needs only KEY, production needs both)
const validateCredentials = (req: Request, res: Response, next: Function) => {
  if (!OSTROVOK_API_KEY) {
    res.status(500).json({
      error: 'Ostrovok API credentials not configured',
      details: 'Please set OSTROVOK_API_KEY environment variable'
    });
    return;
  }
  next();
};

// Get auth headers - ETG B2B API uses Basic Auth
// Format: Authorization: Basic base64(API_KEY:API_SECRET)
// For test keys without secret, use API_KEY as username with empty password
const getAuthHeaders = () => {
  // ETG B2B API uses Basic Auth: base64(KEY_ID:API_TOKEN)
  // Key ID is the numeric ID from contract settings, API Token is the key value
  const username = process.env.OSTROVOK_KEY_ID || OSTROVOK_API_KEY || '';
  const password = process.env.OSTROVOK_API_TOKEN || OSTROVOK_API_SECRET || '';
  
  return {
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': `PartnerName/ai-travel; ClientVersion/1.0.0`
  };
};

// ============ UTILS ============

// Generate partner booking link
// For test/demo hotels: link to city page
// For real hotels: direct hotel link
const generatePartnerLink = (
  hotelId: string | number,
  params: { checkIn: string; checkOut: string; guests: number },
  hotelName?: string,
  city?: string
): string => {
  // Extract numeric partner ID
  const fullPartnerId = PARTNER_ID || '270392.affiliate.a0bd';
  const partnerId = fullPartnerId.split('.')[0] || '270392';
  
  const hotelIdStr = String(hotelId);
  
  // Check if this is a test/demo hotel
  const isTestHotel = hotelIdStr === 'test_hotel' || hotelIdStr === 'test_hotel_do_not_book' || 
                      hotelIdStr === '8526976' || hotelIdStr === '1' || hotelIdStr === '2';
  const isDemoHotel = hotelIdStr.startsWith('moscow_') || hotelIdStr.startsWith('paris_') || 
                      hotelIdStr.startsWith('spb_') || hotelIdStr.startsWith('ist_') ||
                      hotelIdStr.startsWith('dxb_') || hotelIdStr.startsWith('bkk_') ||
                      hotelIdStr.startsWith('test_hotel');
  
  const queryParams = [];
  queryParams.push(`partner_id=${partnerId}`);
  if (params.checkIn) queryParams.push(`check_in=${params.checkIn}`);
  if (params.checkOut) queryParams.push(`check_out=${params.checkOut}`);
  if (params.guests) queryParams.push(`guests=${params.guests}`);
  
  const queryString = queryParams.join('&');
  
  if (isTestHotel || isDemoHotel) {
    // For demo hotels, create a search URL with hotel name
    // This will show search results for the specific hotel
    const citySlug = city ? CITY_URL_SLUGS[city.toLowerCase().trim()] : null;
    
    // Build search query with hotel name for better targeting
    const searchQuery = hotelName ? encodeURIComponent(hotelName.replace(/[""]/g, '').trim()) : '';
    
    if (citySlug && searchQuery) {
      // Link to city page with hotel name as search hint
      // Using text parameter for search
      return `https://ostrovok.ru/hotel/${citySlug}/?text=${searchQuery}&${queryString}`;
    } else if (citySlug) {
      // Fallback to city page only
      return `https://ostrovok.ru/hotel/${citySlug}/?${queryString}`;
    } else if (searchQuery) {
      // Search by hotel name only
      return `https://ostrovok.ru/search/?text=${searchQuery}&${queryString}`;
    } else {
      // Fallback to homepage with partner ID
      return `https://ostrovok.ru/?${queryString}`;
    }
  }
  
  // For real hotels with numeric ID, direct link
  return `https://ostrovok.ru/hotel/${hotelId}/?${queryString}`;
};

// Format image URL with size
const formatImageUrl = (url: string, size: string = '640x400'): string => {
  return url.replace('{size}', size);
};

// Demo hotels for testing when API is unavailable
// Using realistic demo data from demoHotels.ts
const DEMO_HOTELS: Record<string, any[]> = Object.entries(REALISTIC_DEMO_HOTELS).reduce(
  (acc, [key, hotelsArray]) => {
    acc[key] = hotelsArray.map((h: any) => ({
      id: h.id,
      hid: h.hid,
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      address: h.address,
      price: h.price,
      currency: h.currency,
      hotel_type: h.hotelType,
      thumbnail: h.images?.[0]?.url || '',
      images: h.images,
      description: h.description,
      distance_center: h.distanceToCenter,
      amenities: h.amenities
    }));
    return acc;
  },
  {} as Record<string, any[]>
);

// Add test hotels
DEMO_HOTELS['test_hotel'] = TEST_HOTELS.filter((h: any) => h.id === 'test_hotel').map((h: any) => ({
  id: h.id,
  hid: h.hid,
  name: h.name,
  stars: h.stars,
  rating: h.rating,
  address: h.address,
  price: h.price,
  currency: h.currency,
  hotel_type: h.hotelType,
  thumbnail: h.images?.[0]?.url || '',
  images: h.images,
  description: h.description,
  distance_center: h.distanceToCenter
}));

DEMO_HOTELS['test_hotel_do_not_book'] = TEST_HOTELS.filter((h: any) => h.id === 'test_hotel_do_not_book').map((h: any) => ({
  id: h.id,
  hid: h.hid,
  name: h.name,
  stars: h.stars,
  rating: h.rating,
  address: h.address,
  price: h.price,
  currency: h.currency,
  hotel_type: h.hotelType,
  thumbnail: h.images?.[0]?.url || '',
  images: h.images,
  description: h.description,
  distance_center: h.distanceToCenter
}));

// Get demo hotels
const getDemoHotels = (destination: string) => {
  const normalizedDest = destination.toLowerCase();
  for (const [key, hotels] of Object.entries(DEMO_HOTELS)) {
    if (normalizedDest.includes(key.toLowerCase())) {
      return hotels;
    }
  }
  // Return Moscow hotels as default fallback
  return DEMO_HOTELS['Москва'] || DEMO_HOTELS['Moscow'] || Object.values(DEMO_HOTELS)[0] || [];
};

// Transform hotel data to frontend format
const transformHotelData = (hotel: any, searchParams?: any, city?: string) => {
  // Get best thumbnail
  const getThumbnail = () => {
    // Try images_ext first (API response)
    if (hotel.images_ext && hotel.images_ext.length > 0) {
      const exterior = hotel.images_ext.find((img: any) => img.category === 'exterior');
      const hotelFront = hotel.images_ext.find((img: any) => img.category === 'hotel_front');
      const firstImage = hotel.images_ext[0];
      return formatImageUrl((exterior || hotelFront || firstImage).url, '640x400');
    }
    // Fallback to images (demo data)
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0].url;
    }
    // Fallback to thumbnail field
    if (hotel.thumbnail) {
      return hotel.thumbnail;
    }
    if (hotel.thumbnail_url) {
      return hotel.thumbnail_url;
    }
    return null;
  };

  // Get all formatted images
  const getFormattedImages = () => {
    // Try images_ext first (API response)
    if (hotel.images_ext && hotel.images_ext.length > 0) {
      return hotel.images_ext.map((img: any) => ({
        category: img.category,
        url: img.url,
        sizes: {
          small: formatImageUrl(img.url, '240x240'),
          medium: formatImageUrl(img.url, '640x400'),
          large: formatImageUrl(img.url, '1024x768'),
          thumbnail: formatImageUrl(img.url, '120x120')
        }
      }));
    }
    // Fallback to images (demo data)
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images.map((img: any) => ({
        category: img.category || 'exterior',
        url: img.url,
        sizes: {
          small: img.url,
          medium: img.url,
          large: img.url,
          thumbnail: img.url
        }
      }));
    }
    return [];
  };

  // Get min price from rates
  const getMinPrice = () => {
    if (hotel.rates && hotel.rates.length > 0) {
      const prices = hotel.rates.map((r: any) => r.amount || r.show_amount || 0);
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
    address: hotel.address,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    hotelType: hotel.hotel_type,
    
    // Images
    thumbnail: getThumbnail(),
    images: getFormattedImages(),
    
    // Pricing
    price: getMinPrice(),
    currency: hotel.currency || 'RUB',
    rates: hotel.rates || [],
    
    // Descriptions
    description: hotel.description_struct?.map((p: any) => p.text).join('\n\n'),
    descriptionStruct: hotel.description_struct,
    
    // Amenities & Policies
    amenities: hotel.amenities,
    metapolicy: hotel.metapolicy_struct,
    
    // Room groups
    roomGroups: hotel.room_groups,
    
    // Region
    region: hotel.region,
    
    // Booking link
    bookingUrl: searchParams ? generatePartnerLink(
      hotel.hid || hotel.id, 
      {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests
      },
      hotel.name,
      city || hotel.region?.name || hotel.address?.split(',').pop()?.trim()
    ) : null,
    
    // Distance to center
    distanceToCenter: hotel.distance_center
  };
};

// ============ ROUTES ============

/**
 * POST /api/hotels/search
 * Search hotels by region/query (SERP mechanism)
 * Returns list of hotels with minimal data and rates
 */
router.post('/search', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  // Extract params from body first (needed for error handling)
  const { 
    query, 
    checkIn, 
    checkOut, 
    guests, 
    children = [], 
    residency = 'ru', 
    currency = 'RUB',
    language = 'ru'
  } = req.body as SearchRequest;

  // Validate required fields
  if (!query || !checkIn || !checkOut || !guests) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['query', 'checkIn', 'checkOut', 'guests']
    });
    return;
  }

  try {
    console.log(`[Hotels API] Searching hotels: "${query}" | ${checkIn} - ${checkOut} | ${guests} guests`);

    // Check if searching for test hotels by specific IDs
    const testHotelIds = ['test_hotel', 'test_hotel_do_not_book'];
    const isTestHotelQuery = testHotelIds.some(id => query.toLowerCase().includes(id.toLowerCase()));
    
    const headers = getAuthHeaders();
    console.log('[Hotels API] Request headers:', { ...headers, Authorization: headers.Authorization.substring(0, 20) + '...' });
    
    let searchResponse;
    
    if (isTestHotelQuery) {
      // Search by specific hotel IDs for test hotels
      console.log('[Hotels API] Searching test hotels by IDs:', testHotelIds);
      console.log('[Hotels API] Request URL:', `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`);
      
      searchResponse = await axios.post(
        `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`,
        {
          ids: testHotelIds,
          checkin: checkIn,
          checkout: checkOut,
          guests: [{
            adults: guests,
            children: children
          }],
          language,
          currency,
          residency
        },
        {
          headers,
          timeout: DEFAULT_TIMEOUT
        }
      );
    } else {
      // Search by hotel IDs from demoHotels for known cities
      // This allows getting real rates from API while using known hotel IDs
      const demoHotelsForCity = getDemoHotels(query);
      
      if (demoHotelsForCity.length === 0) {
        console.log('[Hotels API] Unknown city, returning empty result:', query);
        res.json({
          success: true,
          hotels: [],
          total: 0,
          searchParams: { query, checkIn, checkOut, guests }
        });
        return;
      }
      
      // Extract hotel IDs (prefer hid if available, otherwise use id)
      // All IDs must be strings for Ostrovok API
      const hotelIds = demoHotelsForCity
        .map((h: any) => String(h.hid || h.id))
        .filter(Boolean);
      
      console.log(`[Hotels API] Searching ${hotelIds.length} hotels by IDs for: ${query}`);
      console.log('[Hotels API] Hotel IDs:', hotelIds);
      console.log('[Hotels API] Request URL:', `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`);
      
      try {
        searchResponse = await axios.post(
          `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`,
          {
            ids: hotelIds,
            checkin: checkIn,
            checkout: checkOut,
            guests: [{
              adults: guests,
              children: children
            }],
            language,
            currency,
            residency
          },
          {
            headers,
            timeout: DEFAULT_TIMEOUT
          }
        );
        
        console.log(`[Hotels API] API returned ${searchResponse.data.data?.hotels?.length || 0} hotels`);
      } catch (apiError: any) {
        console.error('[Hotels API] API error:', apiError.message);
        // Continue with empty response - will fallback to demo data below
        searchResponse = { data: { data: { hotels: [] } } };
      }
    }

    // API returns data in data.data.hotels structure
    const apiHotels = searchResponse.data.data?.hotels || searchResponse.data.hotels || [];
    
    console.log(`[Hotels API] Found ${apiHotels.length} hotels from API`);
    
    // Get demo hotels for the city
    const demoHotelsForCity = getDemoHotels(query);
    
    // Merge API data with demo data
    // For hotels found in API - use API data (with real rates)
    // For hotels not found in API - use demo data (with static info)
    const mergedHotels = demoHotelsForCity.map((demoHotel: any) => {
      // Find matching hotel in API response
      const apiHotel = apiHotels.find((h: any) => 
        h.id === demoHotel.id || h.hid === demoHotel.hid
      );
      
      if (apiHotel) {
        // Use API data with real rates - pass query as city for proper URL generation
        return transformHotelData(apiHotel, { checkIn, checkOut, guests }, query);
      } else {
        // Use demo data with booking link
        // Pass query (destination) as city for proper URL generation
        return {
          ...transformHotelData(demoHotel, { checkIn, checkOut, guests }),
          bookingUrl: generatePartnerLink(demoHotel.hid || demoHotel.id, { checkIn, checkOut, guests }, demoHotel.name, query)
        };
      }
    });
    
    // Filter out hotels with no rates if we have API results
    const hasRealRates = mergedHotels.some((h: any) => h.rates && h.rates.length > 0);
    const finalHotels = hasRealRates 
      ? mergedHotels.filter((h: any) => h.rates && h.rates.length > 0)
      : mergedHotels;
    
    console.log(`[Hotels API] Returning ${finalHotels.length} hotels (${apiHotels.length} with real rates)`);

    res.json({
      success: true,
      hotels: finalHotels,
      total: finalHotels.length,
      searchParams: { query, checkIn, checkOut, guests },
      demo: apiHotels.length === 0
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Search error:', axiosError.message);
    console.log('[Hotels API] Returning demo data as fallback');
    
    // Return demo data as fallback
    const demoHotels = getDemoHotels(query).map((hotel: any) => ({
      ...transformHotelData(hotel, { checkIn, checkOut, guests }),
      bookingUrl: generatePartnerLink(hotel.hid || hotel.id, { checkIn, checkOut, guests }, hotel.name, query)
    }));
    
    res.json({
      success: true,
      hotels: demoHotels,
      total: demoHotels.length,
      searchParams: { query, checkIn, checkOut, guests },
      demo: true
    });
  }
});

/**
 * POST /api/hotels/search-by-ids
 * Search hotels by specific hotel IDs
 * Returns detailed hotel data with rates
 */
router.post('/search-by-ids', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      ids,
      checkIn,
      checkOut,
      guests,
      residency = 'ru',
      currency = 'RUB',
      language = 'ru'
    } = req.body as HotelIdsRequest;

    if (!ids || !ids.length || !checkIn || !checkOut || !guests) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['ids', 'checkIn', 'checkOut', 'guests']
      });
      return;
    }

    console.log(`[Hotels API] Searching hotels by IDs: ${ids.join(', ')}`);

    const searchResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/hotels/`,
      {
        ids,
        checkin: checkIn,
        checkout: checkOut,
        guests,
        language,
        currency,
        residency
      },
      {
        headers: getAuthHeaders(),
        timeout: DEFAULT_TIMEOUT
      }
    );

    const hotels = searchResponse.data.hotels || [];
    
    const transformedHotels = hotels.map((hotel: any) =>
      transformHotelData(hotel, { checkIn, checkOut, guests: guests[0]?.adults || 1 })
    );

    res.json({
      success: true,
      hotels: transformedHotels,
      total: transformedHotels.length
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Search by IDs error:', axiosError.response?.data || axiosError.message);
    
    res.status(500).json({
      error: 'Failed to search hotels by IDs',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * POST /api/hotels/hotelpage
 * Get detailed hotel page with all rates and room information
 * Should be called after search when user views specific hotel
 */
router.post('/hotelpage', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id,
      checkIn,
      checkOut,
      guests,
      residency = 'ru',
      currency = 'RUB',
      language = 'ru'
    } = req.body as HotelPageRequest;

    if (!id || !checkIn || !checkOut) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['id', 'checkIn', 'checkOut']
      });
      return;
    }

    console.log(`[Hotels API] Getting hotelpage for hotel ${id}`);

    const hotelpageResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/search/hp/`,
      {
        id,
        checkin: checkIn,
        checkout: checkOut,
        guests: guests || [{ adults: 2, children: [] }],
        language,
        currency,
        residency
      },
      {
        headers: getAuthHeaders(),
        timeout: DEFAULT_TIMEOUT
      }
    );

    const hotel = hotelpageResponse.data;
    const transformedHotel = transformHotelData(hotel, { 
      checkIn, 
      checkOut, 
      guests: guests?.[0]?.adults || 2 
    });

    res.json({
      success: true,
      hotel: transformedHotel
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Hotelpage error:', axiosError.response?.data || axiosError.message);
    
    res.status(500).json({
      error: 'Failed to get hotel details',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * POST /api/hotels/content
 * Get static hotel content (photos, descriptions, amenities)
 * This is called to get detailed hotel information
 */
router.post('/content', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, language = 'ru' } = req.body as HotelContentRequest;

    if (!id) {
      res.status(400).json({
        error: 'Missing required field: id'
      });
      return;
    }

    console.log(`[Hotels API] Getting content for hotel ${id}`);

    const contentResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/hotel/info/`,
      {
        id,
        language
      },
      {
        headers: getAuthHeaders(),
        timeout: DEFAULT_TIMEOUT
      }
    );

    const content = contentResponse.data;

    // Format images with all sizes
    const formattedImages = content.images_ext?.map((img: any) => ({
      category: img.category,
      url: img.url,
      sizes: {
        small: formatImageUrl(img.url, '240x240'),
        medium: formatImageUrl(img.url, '640x400'),
        large: formatImageUrl(img.url, '1024x768'),
        thumbnail: formatImageUrl(img.url, '120x120')
      }
    })) || [];

    // Format room images
    const roomGroups = content.room_groups?.map((rg: any) => ({
      ...rg,
      images: rg.images_ext?.map((img: any) => ({
        category: img.category,
        url: img.url,
        sizes: {
          small: formatImageUrl(img.url, '240x240'),
          medium: formatImageUrl(img.url, '640x400'),
          large: formatImageUrl(img.url, '1024x768')
        }
      })) || []
    })) || [];

    res.json({
      success: true,
      content: {
        id: content.id,
        hid: content.hid,
        name: content.name,
        address: content.address,
        latitude: content.latitude,
        longitude: content.longitude,
        stars: content.stars,
        rating: content.rating,
        hotelType: content.hotel_type,
        checkInTime: content.check_in_time,
        checkOutTime: content.check_out_time,
        
        // Images
        images: formattedImages,
        
        // Descriptions
        description: content.description_struct?.map((p: any) => p.text).join('\n\n'),
        descriptionStruct: content.description_struct,
        
        // Amenities grouped by category
        amenities: content.amenities,
        
        // Policies
        metapolicy: content.metapolicy_struct,
        
        // Room groups with images
        roomGroups,
        
        // Region info
        region: content.region,
        
        // Serp filters
        serpFilters: content.serp_filters
      }
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Content error:', axiosError.response?.data || axiosError.message);
    
    res.status(500).json({
      error: 'Failed to get hotel content',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * GET /api/hotels/suggest
 * Autocomplete for hotel/region search
 */
router.get('/suggest', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, language = 'ru' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Query parameter "q" is required'
      });
      return;
    }

    // Note: Suggest endpoint might not be available in v3, using region search as fallback
    const suggestResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/region/`,
      {
        region: q,
        checkin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkout: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        guests: [{ adults: 2, children: [] }],
        language,
        currency: 'RUB',
        residency: 'ru'
      },
      {
        headers: getAuthHeaders(),
        timeout: 10000
      }
    );

    res.json({
      success: true,
      hotels: suggestResponse.data.hotels || [],
      regions: suggestResponse.data.regions || []
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Suggest error:', axiosError.response?.data || axiosError.message);
    
    res.status(500).json({
      error: 'Failed to get suggestions',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * POST /api/hotels/prebook
 * Prebook a rate to confirm availability and get final price
 * This should be called before creating a booking
 */
router.post('/prebook', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash, priceIncreasePercent = 0 } = req.body;

    if (!hash) {
      res.status(400).json({
        error: 'Missing required field: hash (book_hash from hotelpage)'
      });
      return;
    }

    console.log(`[Hotels API] Prebooking rate with hash ${hash}`);

    const prebookResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/hotel/prebook`,
      {
        hash,
        price_increase_percent: priceIncreasePercent
      },
      {
        headers: getAuthHeaders(),
        timeout: DEFAULT_TIMEOUT
      }
    );

    res.json({
      success: true,
      prebook: prebookResponse.data
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Prebook error:', axiosError.response?.data || axiosError.message);
    
    res.status(500).json({
      error: 'Failed to prebook rate',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * GET /api/hotels/config
 * Get API configuration status
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    configured: !!(OSTROVOK_API_KEY && OSTROVOK_API_SECRET),
    partnerId: PARTNER_ID ? 'configured' : 'not configured',
    apiUrl: OSTROVOK_API_URL
  });
});

/**
 * POST /api/hotels/booking-link
 * Generate or verify booking link for a hotel
 * For test hotels, returns information that booking is only available via API
 */
router.post('/booking-link', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId, hid, checkIn, checkOut, guests } = req.body;

    if (!hotelId || !checkIn || !checkOut || !guests) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['hotelId', 'checkIn', 'checkOut', 'guests']
      });
      return;
    }

    // Check if it's a test hotel
    const testHotelIds = ['test_hotel', 'test_hotel_do_not_book'];
    const isTestHotel = testHotelIds.includes(String(hotelId)) || testHotelIds.includes(String(hid));

    if (isTestHotel) {
      res.json({
        success: true,
        isTestHotel: true,
        warning: '⚠️ Это тестовый отель. Бронирование доступно только через API тестирования. Для реальных бронирований используйте реальные отели.',
        bookingUrl: generatePartnerLink(hid || hotelId, { checkIn, checkOut, guests }),
        apiBookingInfo: {
          endpoint: '/api/hotels/prebook',
          method: 'POST',
          body: {
            hash: 'book_hash from hotelpage',
            priceIncreasePercent: 0
          }
        }
      });
      return;
    }

    // For real hotels, try to verify via hotelpage API
    try {
      const hotelpageResponse = await axios.post(
        `${OSTROVOK_API_URL}/api/b2b/v3/search/hp/`,
        {
          id: hotelId,
          checkin: checkIn,
          checkout: checkOut,
          guests: [{ adults: guests, children: [] }],
          language: 'ru',
          currency: 'RUB',
          residency: 'ru'
        },
        {
          headers: getAuthHeaders(),
          timeout: DEFAULT_TIMEOUT
        }
      );

      // Hotel exists, return booking link
      res.json({
        success: true,
        isTestHotel: false,
        hotelName: hotelpageResponse.data.name,
        bookingUrl: generatePartnerLink(hid || hotelId, { checkIn, checkOut, guests }),
        ratesAvailable: hotelpageResponse.data.rates?.length > 0,
        minPrice: hotelpageResponse.data.min_price
      });

    } catch (apiError: any) {
      // Hotel not found or API error
      res.json({
        success: false,
        isTestHotel: false,
        error: 'Hotel not found or unavailable',
        details: apiError.response?.data?.error || apiError.message,
        fallbackUrl: generatePartnerLink(hid || hotelId, { checkIn, checkOut, guests })
      });
    }

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Booking link error:', axiosError.message);
    res.status(500).json({
      error: 'Failed to generate booking link',
      details: axiosError.message
    });
  }
});

/**
 * POST /api/hotels/search/geo
 * Search hotels by geo coordinates (SERP geo)
 * Endpoint: /api/b2b/v3/search/serp/geo/
 */
router.post('/search/geo', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius = 10, // km
      checkIn,
      checkOut,
      guests,
      children = [],
      residency = 'ru',
      currency = 'RUB',
      language = 'ru'
    } = req.body;

    if (!latitude || !longitude || !checkIn || !checkOut || !guests) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['latitude', 'longitude', 'checkIn', 'checkOut', 'guests']
      });
      return;
    }

    console.log(`[Hotels API] Searching hotels by geo: lat=${latitude}, lng=${longitude}, radius=${radius}km`);

    const searchResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/search/serp/geo/`,
      {
        latitude,
        longitude,
        radius,
        checkin: checkIn,
        checkout: checkOut,
        guests: [{
          adults: guests,
          children: children
        }],
        language,
        currency,
        residency
      },
      {
        headers: getAuthHeaders(),
        timeout: DEFAULT_TIMEOUT
      }
    );

    const hotels = searchResponse.data.hotels || [];
    
    // Limit rates to 1-2 lowest per hotel (as per ETG best practices)
    const limitedHotels = hotels.map((hotel: any) => {
      if (hotel.rates && hotel.rates.length > 2) {
        // Sort by price and keep only 2 lowest
        const sortedRates = [...hotel.rates].sort((a: any, b: any) => 
          (a.amount || a.show_amount || 0) - (b.amount || b.show_amount || 0)
        );
        return { ...hotel, rates: sortedRates.slice(0, 2) };
      }
      return hotel;
    });

    const transformedHotels = limitedHotels.map((hotel: any) => 
      transformHotelData(hotel, { checkIn, checkOut, guests })
    );

    res.json({
      success: true,
      hotels: transformedHotels,
      total: transformedHotels.length,
      searchParams: { latitude, longitude, radius, checkIn, checkOut, guests }
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Geo search error:', axiosError.message);
    res.status(500).json({
      error: 'Failed to search hotels by geo',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * GET /api/hotels/dump
 * Retrieve hotel dump (Static Data Step 1.1)
 * Required. Updated weekly.
 * Endpoint: /api/b2b/v3/hotel/info/dump/
 */
router.get('/dump', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { language = 'ru' } = req.query;

    console.log('[Hotels API] Fetching hotel dump...');

    const dumpResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/hotel/info/dump/`,
      { language },
      {
        headers: getAuthHeaders(),
        timeout: 120000 // 2 minutes for large dump
      }
    );

    res.json({
      success: true,
      data: dumpResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Dump error:', axiosError.message);
    res.status(500).json({
      error: 'Failed to fetch hotel dump',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

/**
 * GET /api/hotels/dump/incremental
 * Retrieve incremental hotel dump (Static Data Step 1.3)
 * Recommended. Updated daily.
 * Endpoint: /api/b2b/v3/hotel/info/incremental_dump/
 */
router.get('/dump/incremental', validateCredentials, async (req: Request, res: Response): Promise<void> => {
  try {
    const { language = 'ru' } = req.query;

    console.log('[Hotels API] Fetching incremental hotel dump...');

    const incrementalResponse = await axios.post(
      `${OSTROVOK_API_URL}/api/b2b/v3/hotel/info/incremental_dump/`,
      { language },
      {
        headers: getAuthHeaders(),
        timeout: 60000 // 1 minute
      }
    );

    res.json({
      success: true,
      data: incrementalResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Hotels API] Incremental dump error:', axiosError.message);
    res.status(500).json({
      error: 'Failed to fetch incremental dump',
      details: axiosError.response?.data || axiosError.message
    });
  }
});

export default router;
