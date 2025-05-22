import React, { useState } from 'react';
import FlightSearch from '../components/FlightSearch';
import FlightResults from '../components/FlightResults';

const FlightsPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (results: string) => {
    setLoading(true);
    try {
      setSearchResults(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Поиск авиабилетов
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <FlightSearch onSearch={handleSearch} />
          
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка результатов...</p>
            </div>
          ) : searchResults && (
            <FlightResults results={searchResults} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightsPage; 