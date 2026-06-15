import { buildHotelPageLink, type RoomGuests } from '@/lib/ostrovok';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PARTNER_SLUG = import.meta.env.VITE_OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';

interface HotelInfo {
  id: string;
  name: string;
  stars: number;
  address: string;
  price: number;
  currency: string;
  thumbnail: string;
  booking_url: string;
  rating: number;
}

interface HotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  children?: number[];
  currency?: string;
  lang?: string;
}

class OstrovokApi {
  private static instance: OstrovokApi;

  public static getInstance(): OstrovokApi {
    if (!OstrovokApi.instance) {
      OstrovokApi.instance = new OstrovokApi();
    }
    return OstrovokApi.instance;
  }

  private generatePartnerUrl(hotelSlug: string, params: HotelSearchParams): string {
    const rooms: RoomGuests[] = [{
      adults: params.guests,
      childrenAges: params.children,
    }];

    return buildHotelPageLink(hotelSlug, {
      partnerSlug: PARTNER_SLUG,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      rooms,
      currency: params.currency,
      lang: params.lang,
    });
  }

  async searchHotels(params: HotelSearchParams): Promise<HotelInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.location,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          guests: params.guests,
        }),
      });

      if (!response.ok) {
        throw new Error(`Hotel search failed: ${response.status}`);
      }

      const data = await response.json() as {
        hotels?: Array<{
          id: string;
          hid?: number;
          slug?: string;
          name: string;
          stars?: number;
          address?: string;
          price?: number;
          min_price?: number;
          currency?: string;
          thumbnail?: string;
          thumbnail_url?: string;
          rating?: number;
        }>;
      };

      return (data.hotels || []).map((hotel) => ({
        id: hotel.id,
        hid: hotel.hid,
        name: hotel.name,
        stars: hotel.stars || 0,
        address: hotel.address || '',
        price: hotel.price ?? hotel.min_price ?? 0,
        currency: hotel.currency || 'RUB',
        thumbnail: hotel.thumbnail || hotel.thumbnail_url || '',
        booking_url: this.generatePartnerUrl(hotel.slug || hotel.id, params),
        rating: hotel.rating || 0,
      }));
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }
}

export const ostrovokApi = OstrovokApi.getInstance();

export function formatHotelInfoForGPT(hotels: HotelInfo[]): string {
  if (!hotels.length) {
    return 'К сожалению, отелей по данному запросу не найдено.';
  }

  let response = '# 🏨 Рекомендуемые отели\n\n';

  hotels.forEach((hotel) => {
    response += `### ${hotel.name} ${'⭐'.repeat(hotel.stars)}\n`;
    response += `- 📍 **Адрес:** ${hotel.address}\n`;
    response += `- 💰 **Цена от:** ${hotel.price.toLocaleString('ru-RU')} ${hotel.currency}\n`;
    if (hotel.rating) {
      response += `- ⭐ **Рейтинг:** ${hotel.rating.toFixed(1)}/10\n`;
    }
    response += `- 🔗 **[Забронировать](${hotel.booking_url})**\n\n`;
  });

  return response;
}
