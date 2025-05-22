import { useState } from 'react';
import { MapPin, Calendar, Users, DollarSign } from 'lucide-react';

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  isRoundTrip: boolean;
}

interface FlightResult {
  id: string;
  airline: {
    code: string;
    name: string;
    logo: string;
  };
  departure: {
    city: string;
    airport: string;
    time: string;
  };
  arrival: {
    city: string;
    airport: string;
    time: string;
  };
  duration: number;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
}

const FlightTestPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    isRoundTrip: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }

      const data = await response.json();
      setResults(data.flights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Flight Search Test Page</h1>
          <p className="text-gray-600">Test Aviasales API integration</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Origin */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                  placeholder="City or airport"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                  placeholder="City or airport"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Departure Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Departure Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.departureDate}
                  onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Return Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Return Date</label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchParams.isRoundTrip}
                    onChange={(e) => setSearchParams({ ...searchParams, isRoundTrip: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-600">Round trip</span>
                </label>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                  disabled={!searchParams.isRoundTrip}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Passengers</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={searchParams.passengers.adults}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      passengers: { ...searchParams.passengers, adults: parseInt(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={searchParams.passengers.children}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      passengers: { ...searchParams.passengers, children: parseInt(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Infants</label>
                  <input
                    type="number"
                    min="0"
                    value={searchParams.passengers.infants}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      passengers: { ...searchParams.passengers, infants: parseInt(e.target.value) }
                    })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
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
                'Search Flights'
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
        <div className="space-y-4">
          {results.map((flight) => (
            <div key={flight.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={flight.airline.logo}
                    alt={flight.airline.name}
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="text-sm text-gray-500">{flight.airline.name}</p>
                    <p className="text-xs text-gray-400">Flight {flight.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{flight.price.amount.toLocaleString()} {flight.price.currency}</p>
                  <button className="text-sm text-black hover:underline">Select</button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-semibold">{flight.departure.time}</p>
                  <p className="text-sm text-gray-600">{flight.departure.city}</p>
                  <p className="text-xs text-gray-400">{flight.departure.airport}</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-500">{formatDuration(flight.duration)}</p>
                  <div className="relative w-full my-2">
                    <div className="absolute inset-y-1/2 w-full border-t border-gray-300 border-dashed"></div>
                    <div className="absolute inset-y-1/2 left-0 w-2 h-2 -mt-1 rounded-full bg-gray-400"></div>
                    <div className="absolute inset-y-1/2 right-0 w-2 h-2 -mt-1 rounded-full bg-gray-400"></div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold">{flight.arrival.time}</p>
                  <p className="text-sm text-gray-600">{flight.arrival.city}</p>
                  <p className="text-xs text-gray-400">{flight.arrival.airport}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {!isLoading && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No flights found. Try adjusting your search parameters.
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightTestPage; 