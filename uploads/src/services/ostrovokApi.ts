import axios from 'axios';

const API_BASE_URL = 'https://api.ostrovok.ru/v2';
const API_TOKEN = import.meta.env.VITE_OSTROVOK_API_TOKEN;
const PARTNER_ID = import.meta.env.VITE_OSTROVOK_PARTNER_ID;

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
}

interface OstrovokResponse {
  hotels: Array<{
    id: string;
    name: string;
    stars: number;
    address: string;
    min_price: number;
    currency: string;
    thumbnail: string;
    rating: number;
  }>;
}

class OstrovokApi {
  private static instance: OstrovokApi;
  private api;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
        'X-Partner-ID': PARTNER_ID
      },
    });
  }

  public static getInstance(): OstrovokApi {
    if (!OstrovokApi.instance) {
      OstrovokApi.instance = new OstrovokApi();
    }
    return OstrovokApi.instance;
  }

  // Формирование партнерской ссылки
  private generatePartnerUrl(hotelId: string, params: HotelSearchParams): string {
    const baseUrl = 'https://ostrovok.ru/hotel';
    const searchParams = new URLSearchParams({
      partner_id: PARTNER_ID,
      check_in: params.checkIn,
      check_out: params.checkOut,
      guests: params.guests.toString(),
    });

    return `${baseUrl}/${hotelId}?${searchParams.toString()}`;
  }

  // Поиск отелей
  async searchHotels(params: HotelSearchParams): Promise<HotelInfo[]> {
    try {
      const response = await this.api.post('/search', {
        location: params.location,
        check_in: params.checkIn,
        check_out: params.checkOut,
        guests: params.guests,
        currency: 'RUB',
        limit: 5
      });

      const data = response.data as OstrovokResponse;
      return data.hotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        stars: hotel.stars,
        address: hotel.address,
        price: hotel.min_price,
        currency: hotel.currency,
        thumbnail: hotel.thumbnail,
        booking_url: this.generatePartnerUrl(hotel.id, params),
        rating: hotel.rating
      }));
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }
}

export const ostrovokApi = OstrovokApi.getInstance();

// Форматирование информации об отелях для GPT
export function formatHotelInfoForGPT(hotels: HotelInfo[]): string {
  if (!hotels.length) {
    return 'К сожалению, отелей по данному запросу не найдено.';
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const formatStars = (stars: number) => {
    return '⭐'.repeat(stars);
  };

  let response = '# 🏨 Рекомендуемые отели\n\n';

  hotels.forEach(hotel => {
    response += `### ${hotel.name} ${formatStars(hotel.stars)}\n`;
    response += `- 📍 **Адрес:** ${hotel.address}\n`;
    response += `- 💰 **Цена от:** ${formatPrice(hotel.price)} ${hotel.currency}\n`;
    if (hotel.rating) {
      response += `- ⭐ **Рейтинг:** ${hotel.rating.toFixed(1)}/10\n`;
    }
    response += `- 🔗 **[Забронировать](${hotel.booking_url})**\n\n`;
  });

  return response;
} 