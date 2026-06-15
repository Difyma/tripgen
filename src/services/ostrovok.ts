import { buildHotelPageLink } from '@/lib/ostrovok';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PARTNER_SLUG = import.meta.env.VITE_OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';

interface HotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number[];
  currency?: string;
  lang?: string;
}

interface Hotel {
  id: string;
  name: string;
  price: number;
  currency: string;
  url: string;
  rating?: number;
  imageUrl?: string;
  stars?: number;
}

export const searchHotels = async (params: HotelSearchParams): Promise<Hotel[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hotels/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.location,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.adults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Hotel search failed: ${response.status}`);
    }

    const data = await response.json() as {
      hotels?: Array<{
        id: string;
        slug?: string;
        name: string;
        price?: number;
        min_price?: number;
        currency?: string;
        rating?: number;
        imageUrl?: string;
        thumbnail?: string;
        stars?: number;
      }>;
    };

    return (data.hotels || []).map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      price: hotel.price ?? hotel.min_price ?? 0,
      currency: hotel.currency || 'RUB',
      url: buildHotelPageLink(hotel.slug || hotel.id, {
        partnerSlug: PARTNER_SLUG,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: [{ adults: params.adults, childrenAges: params.children }],
        currency: params.currency,
        lang: params.lang,
      }),
      rating: hotel.rating,
      imageUrl: hotel.imageUrl || hotel.thumbnail,
      stars: hotel.stars,
    }));
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
};
