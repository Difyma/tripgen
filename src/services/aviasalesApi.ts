const API_BASE_URL = 'https://api.travelpayouts.com';
const API_TOKEN = import.meta.env.VITE_AVIASALES_API_TOKEN;

// Check if API token is available
if (!API_TOKEN) {
  console.warn('Aviasales API token is not configured. Please add VITE_AVIASALES_API_TOKEN to your .env file.');
}

interface FlightSearchParams {
  origin: string;           // Airport code (e.g., MOW)
  destination: string;      // Airport code (e.g., LHR)
  date_from: string;       // Departure date
  date_to?: string;        // Return date (optional)
  adults?: number;         // Number of adult passengers
  children?: number;       // Number of child passengers
  infants?: number;        // Number of infant passengers
  trip_class?: 'Y' | 'C';  // Y for economy, C for business
  currency?: string;       // Currency code (e.g., RUB)
}

interface FlightInfo {
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  duration_to: number;
  duration_back?: number;
}

class AviasalesApi {
  private static instance: AviasalesApi;

  private constructor() {}

  public static getInstance(): AviasalesApi {
    if (!AviasalesApi.instance) {
      AviasalesApi.instance = new AviasalesApi();
    }
    return AviasalesApi.instance;
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightInfo[]> {
    const queryParams = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      departure_at: params.date_from,
      ...(params.date_to && { return_at: params.date_to }),
      adults: (params.adults || 1).toString(),
      children: (params.children || 0).toString(),
      infants: (params.infants || 0).toString(),
      trip_class: params.trip_class || 'Y',
      currency: params.currency || 'RUB',
      token: API_TOKEN
    });

    const response = await fetch(`${API_BASE_URL}/aviasales/v3/prices_for_dates?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const data = await response.json();
    return data.data || [];
  }

  formatFlightsForGPT(flights: FlightInfo[]): string {
    if (!flights.length) {
      return 'К сожалению, рейсов по данному направлению не найдено.';
    }

    const formatDuration = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}ч ${mins}мин`;
    };

    const formatDateTime = (dateStr: string): string => {
      const date = new Date(dateStr);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatPrice = (price: number): string => {
      return price.toLocaleString('ru-RU');
    };

    let response = '';

    // Сортируем рейсы по цене
    const sortedFlights = [...flights].sort((a, b) => a.price - b.price);
    
    // Добавляем информацию о каждом рейсе
    sortedFlights.forEach((flight, index) => {
      response += `### Вариант ${index + 1}\n`;
      response += `- 💰 **Цена:** ${formatPrice(flight.price)} RUB\n`;
      response += `- ✈️ **Авиакомпания:** ${flight.airline} ${flight.flight_number}\n`;
      response += `- 🛫 **Вылет:** ${formatDateTime(flight.departure_at)}\n`;
      if (flight.return_at) {
        response += `- 🛬 **Обратный рейс:** ${formatDateTime(flight.return_at)}\n`;
      }
      response += `- ⏱️ **Длительность:** ${formatDuration(flight.duration_to)}\n`;
      if (flight.duration_back) {
        response += `- ⏱️ **Длительность обратного:** ${formatDuration(flight.duration_back)}\n`;
      }
      response += `- 🔄 **Пересадки:** ${flight.transfers}\n\n`;
    });

    return response;
  }
}

export const aviasalesApi = AviasalesApi.getInstance(); 