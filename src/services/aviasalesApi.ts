import axios from 'axios';

const API_BASE_URL = 'https://api.travelpayouts.com';
const API_TOKEN = import.meta.env.VITE_AVIASALES_API_TOKEN;

// Check if API token is available
if (!API_TOKEN) {
  console.warn('Aviasales API token is not configured. Please add VITE_AVIASALES_API_TOKEN to your .env file.');
}

interface FlightSearchParams {
  origin: string;           // Airport code (e.g., MOW)
  destination: string;      // Airport code (e.g., LHR)
}

interface FlightResponse {
  success: boolean;
  data: Array<{
    price: number;
    airline: string;
    flight_number: string;
    departure_at: string;
    return_at?: string;
    duration: number;
  }>;
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

  async searchFlights(params: FlightSearchParams): Promise<string> {
    try {
      // Validate IATA codes
      const origin = params.origin.toUpperCase();
      const destination = params.destination.toUpperCase();

      if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
        console.error('Неверный формат IATA кода:', { origin, destination });
        return 'Ошибка: неверный формат кода аэропорта. Используйте 3-буквенный код IATA.';
      }

      const url = `${API_BASE_URL}/v2/prices/latest?origin=${origin}&destination=${destination}&token=${API_TOKEN}`;
      console.log('Запрос к API:', url.replace(API_TOKEN, '***'));

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Ошибка ответа:', response.status, response.statusText);
        const text = await response.text();
        console.error('Ответ сервера:', text);
        return `Ошибка: ${response.status} ${response.statusText}`;
      }

      const data = await response.json() as FlightResponse;
      console.log('Ответ API:', data);

      if (!data.success || !data.data || !data.data.length) {
        console.log('Рейсы не найдены:', data);
        return "Не удалось найти рейсы по вашему запросу.";
      }

      // Возьмем топ-3 рейса
      const topFlights = data.data.slice(0, 3);

      const formatted = topFlights.map((flight, index) => {
        const depDate = new Date(flight.departure_at).toLocaleString('ru-RU');
        const retDate = flight.return_at ? new Date(flight.return_at).toLocaleString('ru-RU') : 'нет обратного рейса';
        return `${index + 1}. Авиакомпания: ${flight.airline}, вылет: ${depDate}, возврат: ${retDate}, цена: ${flight.price.toLocaleString()} ₽`;
      });

      return `✈️ Найдено несколько рейсов:\n\n${formatted.join('\n')}`;

    } catch (error) {
      console.error('Ошибка при запросе:', error);
      return 'Ошибка при запросе. Проверьте консоль для деталей.';
    }
  }

  // Вспомогательный метод для форматирования одного рейса
  formatFlightInfo(flight: FlightResponse['data'][0]): string {
    const depDate = new Date(flight.departure_at).toLocaleString('ru-RU');
    const retDate = flight.return_at ? new Date(flight.return_at).toLocaleString('ru-RU') : 'нет обратного рейса';
    
    return `
Авиакомпания: ${flight.airline}
Рейс: ${flight.flight_number}
Вылет: ${depDate}
Возврат: ${retDate}
Длительность: ${Math.floor(flight.duration / 60)}ч ${flight.duration % 60}м
Цена: ${flight.price.toLocaleString()} ₽
    `.trim();
  }
}

export const aviasalesApi = AviasalesApi.getInstance(); 