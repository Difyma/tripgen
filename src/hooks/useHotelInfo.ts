import { useState } from 'react';
import { ostrovokApi, formatHotelInfoForGPT } from '../services/ostrovokApi';

interface UseHotelInfoResult {
  getHotelInfoForGPT: (location: string, checkIn: string, checkOut: string, guests: number) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export function useHotelInfo(): UseHotelInfoResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHotelInfoForGPT = async (
    location: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const hotels = await ostrovokApi.searchHotels({
        location,
        checkIn,
        checkOut,
        guests
      });

      return formatHotelInfoForGPT(hotels);
    } catch (err) {
      const errorMessage = 'Не удалось получить информацию об отелях';
      setError(errorMessage);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getHotelInfoForGPT,
    isLoading,
    error
  };
} 