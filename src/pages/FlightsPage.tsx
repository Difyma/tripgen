import React, { useState } from 'react';
import FlightSearch from '../components/FlightSearch';
import FlightResults from '../components/FlightResults';

const FlightsPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (results: any) => {
    setSearchResults(results.data || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Поиск авиабилетов
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <FlightSearch onSearch={handleSearch} />
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Результаты поиска
            </h2>
            <FlightResults flights={searchResults} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightsPage; 