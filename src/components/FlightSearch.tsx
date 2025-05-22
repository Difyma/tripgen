import React, { useState } from 'react';
import { aviasalesApi } from '../services/aviasalesApi';
import { Search, Plane, Loader, AlertCircle } from 'lucide-react';

interface FlightSearchProps {
  onSearch: (results: string) => void;
}

interface ValidationErrors {
  origin?: string;
  destination?: string;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate origin
    if (!searchParams.origin) {
      errors.origin = 'Укажите город отправления';
    } else if (!/^[A-Z]{3}$/.test(searchParams.origin)) {
      errors.origin = 'Введите корректный код аэропорта (3 заглавные буквы)';
    }

    // Validate destination
    if (!searchParams.destination) {
      errors.destination = 'Укажите город прибытия';
    } else if (!/^[A-Z]{3}$/.test(searchParams.destination)) {
      errors.destination = 'Введите корректный код аэропорта (3 заглавные буквы)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await aviasalesApi.searchFlights({
        origin: searchParams.origin,
        destination: searchParams.destination
      });

      if (results.startsWith('Ошибка')) {
        setError(results);
      } else {
        onSearch(results);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Ошибка при поиске билетов. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Откуда
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="origin"
                value={searchParams.origin}
                onChange={handleInputChange}
                placeholder="MOW"
                maxLength={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>
            {validationErrors.origin && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.origin}
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Куда
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transform rotate-90" />
              <input
                type="text"
                name="destination"
                value={searchParams.destination}
                onChange={handleInputChange}
                placeholder="LED"
                maxLength={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>
            {validationErrors.destination && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.destination}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Поиск билетов...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Найти билеты
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FlightSearch; 