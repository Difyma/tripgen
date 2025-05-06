'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SearchResult {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchData, setSearchData] = useState<SearchResult | null>(null);

  useEffect(() => {
    const location = searchParams.get('location') || '';
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const guests = parseInt(searchParams.get('guests') || '1', 10);

    setSearchData({ location, checkIn, checkOut, guests });
  }, [searchParams]);

  if (!searchData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] pt-24">
      <div className="max-w-[1200px] mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-6">Search Results</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-4">Search Parameters</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Location:</span> {searchData.location}</p>
            <p><span className="font-medium">Check In:</span> {new Date(searchData.checkIn).toLocaleDateString()}</p>
            <p><span className="font-medium">Check Out:</span> {new Date(searchData.checkOut).toLocaleDateString()}</p>
            <p><span className="font-medium">Guests:</span> {searchData.guests}</p>
          </div>
        </div>

        {/* Here you can add the actual search results */}
        <div className="mt-8">
          <p className="text-gray-600">Implementing AI-powered search results...</p>
        </div>
      </div>
    </div>
  )
} 