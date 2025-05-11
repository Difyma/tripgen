import React from 'react';
import { Plane, Clock, Calendar } from 'lucide-react';

interface Flight {
  airline: string;
  flight_number: string;
  departure_at: string;
  arrival_at: string;
  price: number;
  currency: string;
  transfers: number;
  duration: number;
}

interface FlightResultsProps {
  flights: Flight[];
  loading?: boolean;
}

const FlightResults: React.FC<FlightResultsProps> = ({ flights, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Билеты не найдены</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  return (
    <div className="space-y-4">
      {flights.map((flight, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{flight.airline}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{flight.flight_number}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Вылет</div>
                  <div className="font-medium">{formatDate(flight.departure_at)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Прилет</div>
                  <div className="font-medium">{formatDate(flight.arrival_at)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(flight.duration)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{flight.transfers} пересадка</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold text-blue-600">
                {flight.price} {flight.currency}
              </div>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Выбрать
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlightResults; 