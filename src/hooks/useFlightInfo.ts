import { useState } from 'react';
import { aviasalesApi, formatFlightInfoForGPT } from '../services/aviasalesApi';

interface UseFlightInfoResult {
  getFlightInfoForGPT: (origin: string, destination: string, date: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export function useFlightInfo(): UseFlightInfoResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFlightInfoForGPT = async (
    origin: string,
    destination: string,
    date: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем информацию о перелетах
      const flights = await aviasalesApi.getFlightInfo({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        depart_date: date
      });

      // Форматируем информацию для GPT
      return formatFlightInfoForGPT(flights);
    } catch (err) {
      const errorMessage = 'Не удалось получить информацию о перелетах';
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