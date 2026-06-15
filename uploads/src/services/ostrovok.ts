import axios from 'axios';

interface HotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

interface Hotel {
  name: string;
  price: number;
  currency: string;
  url: string;
  rating?: number;
  imageUrl?: string;
}

interface OstrovokResponse {
  hotels: Array<{
    name: string;
    price: number;
    currency: string;
    bookingUrl: string;
    rating?: number;
    imageUrl?: string;
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
        'Authorization': `Bearer ${process.env.OSTROVOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.hotels.map((hotel) => ({
      name: hotel.name,
      price: hotel.price,
      currency: hotel.currency,
      url: hotel.bookingUrl,
      rating: hotel.rating,
      imageUrl: hotel.imageUrl,
    }));
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
}; 