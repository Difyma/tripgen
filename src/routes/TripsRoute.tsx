import { useState, useEffect } from 'react';
import { CurrentTrip } from '../components/CurrentTrip';
import { TripCard } from '../components/TripCard';
import { trips } from '../data/trips';
import type { Trip } from '../data/trips';

export function TripsRoute() {
  const [currentTrip, setCurrentTrip] = useState<Trip | undefined>();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const current = trips.find(trip => trip.status === 'ongoing');
    const upcoming = trips.filter(trip => trip.status === 'upcoming');
    
    setCurrentTrip(current);
    setUpcomingTrips(upcoming);
  }, []);

  return (
    <div className="flex-1">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold">Мои путешествия</h1>
      </div>
      
      <div className="px-8 py-6 space-y-8">
        <section>
          <h2 className="text-xl font-medium mb-4">Текущее путешествие</h2>
          <CurrentTrip trip={currentTrip} />
        </section>

        <section>
          <h2 className="text-xl font-medium mb-4">Предстоящие путешествия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {upcomingTrips.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                У вас нет предстоящих путешествий
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 