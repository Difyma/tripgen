import { useState } from 'react';
import { Search, Calendar, Users, Loader2 } from 'lucide-react';

interface HotelSearchParams {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface HotelResult {
  id: string;
  name: string;
  stars: number;
  address: string;
  price: number;
  currency: string;
  thumbnail: string;
}

const HotelTestPage = () => {
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({
    query: '',
    checkIn: '',
    checkOut: '',
    guests: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }

      const data = await response.json();
      setResults(data.hotels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hotel Search Test Page</h1>
          <p className="text-gray-600">Test Ostrovok.ru API integration</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                  placeholder="City or hotel name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-in */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Check-in</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-out */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Check-out</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Guests</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search Hotels'
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((hotel) => (
            <div key={hotel.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={hotel.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                {hotel.stars > 0 && (
                  <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-lg text-sm">
                    {hotel.stars} ★
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{hotel.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{hotel.address}</p>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">
                    {hotel.price.toLocaleString()} {hotel.currency}
                  </div>
                  <button className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {!isLoading && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hotels found. Try adjusting your search parameters.
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelTestPage; 