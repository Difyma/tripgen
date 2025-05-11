import axios from 'axios';

const API_BASE_URL = 'https://api.travelpayouts.com/v2';
const API_TOKEN = import.meta.env.VITE_AVIASALES_API_TOKEN;
const PARTNER_ID = import.meta.env.VITE_AVIASALES_PARTNER_ID || 'your_partner_id';

interface FlightInfo {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  arrival_at: string;
  transfers: number;
  duration: number;
  booking_url: string;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  depart_date: string;
}

class AviasalesApi {
  private static instance: AviasalesApi;
  private api;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
      },
    });
  }

  public static getInstance(): AviasalesApi {
    if (!AviasalesApi.instance) {
      AviasalesApi.instance = new AviasalesApi();
    }
    return AviasalesApi.instance;
  }

  // Формирование партнерской ссылки
  private generatePartnerUrl(flight: any): string {
    const baseUrl = 'https://www.aviasales.ru';
    const params = new URLSearchParams({
      origin: flight.origin,
      destination: flight.destination,
      depart_date: flight.departure_at.split('T')[0],
      return_date: flight.return_at ? flight.return_at.split('T')[0] : '',
      adults: '1',
      children: '0',
      infants: '0',
      with_request: 'true',
      marker: PARTNER_ID
    });

    return `${baseUrl}/search?${params.toString()}`;
  }

  // Получение информации о перелетах для GPT
  async getFlightInfo(params: FlightSearchParams): Promise<FlightInfo[]> {
    try {
      const response = await this.api.get('/prices/latest', {
        params: {
          ...params,
          currency: 'RUB',
          limit: 5, // Ограничиваем количество результатов
        }
      });

      // Преобразуем данные в нужный формат
      return (response.data as any).data.map((flight: any) => ({
        origin: flight.origin,
        destination: flight.destination,
        price: flight.price,
        airline: flight.airline,
        flight_number: flight.flight_number,
        departure_at: flight.departure_at,
        arrival_at: flight.arrival_at,
        transfers: flight.transfers,
        duration: flight.duration_to,
        booking_url: this.generatePartnerUrl(flight)
      }));
    } catch (error) {
      console.error('Error getting flight info:', error);
      throw error;
    }
  }

  // Получение списка аэропортов для валидации
  async getAirports(): Promise<{ [code: string]: string }> {
    try {
      const response = await this.api.get('/airports');
      const airports: { [code: string]: string } = {};
      
      (response.data as any[]).forEach((airport: any) => {
        airports[airport.code] = airport.name;
      });

      return airports;
    } catch (error) {
      console.error('Error getting airports:', error);
      throw error;
    }
  }
}

export const aviasalesApi = AviasalesApi.getInstance();

// Вспомогательная функция для форматирования данных о перелете для GPT
export function formatFlightInfoForGPT(flights: FlightInfo[]): string {
  if (!flights.length) {
    return '# ✈️ Информация о рейсах\nК сожалению, рейсов по данному направлению не найдено.';
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  let response = '# ✈️ Информация о рейсах\n\n';

  flights.forEach((flight, index) => {
    response += `### Рейс ${index + 1}: ${flight.airline} ${flight.flight_number}\n`;
    response += `- 🛫 **Вылет:** ${formatDate(flight.departure_at)}\n`;
    response += `- 🛬 **Прилет:** ${formatDate(flight.arrival_at)}\n`;
    response += `- ⏱️ **Длительность:** ${formatDuration(flight.duration)}\n`;
    response += `- 🔄 **Пересадок:** ${flight.transfers}\n`;
    response += `- 💰 **Цена:** ${flight.price.toLocaleString('ru-RU')} RUB\n`;
    response += `- 🎫 **[Забронировать билет](${flight.booking_url})**\n\n`;
  });

  return response;
} 