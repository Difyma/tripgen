import React from 'react';
import { Loader } from 'lucide-react';

interface FlightResultsProps {
  results: string;
  loading?: boolean;
}

const FlightResults: React.FC<FlightResultsProps> = ({ results, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!results || results.startsWith('Не удалось')) {
    return (
      <div className="text-center py-12 text-gray-500">
        Рейсы не найдены. Попробуйте изменить параметры поиска.
      </div>
    );
  }

  // Split the results into title and flights
  const [title, ...flights] = results.split('\n\n');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <div className="space-y-4">
        {flights.map((flight, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <pre className="whitespace-pre-wrap font-sans text-gray-700">
              {flight}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlightResults; 