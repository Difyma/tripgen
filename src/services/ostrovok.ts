import axios from 'axios';
import { buildHotelPageLink } from '@/lib/ostrovok';

const PARTNER_SLUG = import.meta.env.VITE_OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';

interface HotelSearchParams {
  location: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
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

interface OstrovokResponse {
  hotels: Array<{
    id: string;
    slug?: string;
    name: string;
    price: number;
    currency: string;
    rating?: number;
    imageUrl?: string;
    stars?: number;
  }>;
}

export const searchHotels = async (params: HotelSearchParams): Promise<Hotel[]> => {
  try {
    const response = await axios.get<OstrovokResponse>('https://api.ostrovok.com/v1/hotels/search', {
      params: {
        location: params.location,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children || 0,
      },
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OSTROVOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      price: hotel.price,
      currency: hotel.currency,
      url: buildHotelPageLink(hotel.slug || hotel.id, {
        partnerSlug: PARTNER_SLUG,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: [{ adults: params.adults, childrenAges: params.children }],
        currency: params.currency,
        lang: params.lang,
      }),
      rating: hotel.rating,
      imageUrl: hotel.imageUrl,
      stars: hotel.stars,
    }));
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
}; 