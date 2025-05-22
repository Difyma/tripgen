import { useState } from 'react';
import { aviasalesApi } from '../services/aviasalesApi';

interface UseFlightInfoResult {
  getFlightInfoForGPT: (
    origin: string,
    destination: string,
    dateFrom: string,
    dateTo?: string,
    adults?: number,
    children?: number,
    infants?: number,
    tripClass?: 'Y' | 'C'
  ) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export function useFlightInfo(): UseFlightInfoResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFlightInfoForGPT = async (
    origin: string,
    destination: string,
    dateFrom: string,
    dateTo?: string,
    adults: number = 1,
    children: number = 0,
    infants: number = 0,
    tripClass: 'Y' | 'C' = 'Y'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем информацию о перелетах
      const flightInfo = await aviasalesApi.searchFlights({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date_from: dateFrom,
        date_to: dateTo,
        adults,
        children,
        infants,
        trip_class: tripClass,
        currency: 'RUB'
      });

      // Форматируем информацию для GPT
      return aviasalesApi.formatFlightsForGPT(flightInfo);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Ошибка при поиске рейсов: ${err.message}`
        : 'Не удалось получить информацию о перелетах';
      setError(errorMessage);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getFlightInfoForGPT,
    isLoading,
    error
  };
} 