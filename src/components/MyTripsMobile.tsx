import { useState, useEffect } from 'react';
import { trips } from '../data/trips';
import type { Trip } from '../data/trips';
import { MapPin, Calendar, Users, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyTripsMobile() {
  const [currentTrip, setCurrentTrip] = useState<Trip | undefined>();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const current = trips.find(trip => trip.status === 'ongoing');
    const upcoming = trips.filter(trip => trip.status === 'upcoming');
    setCurrentTrip(current);
    setUpcomingTrips(upcoming);
  }, []);

  return (
    <div className="md:hidden bg-white min-h-screen flex flex-col px-2 py-4">
      <h1 className="text-xl font-bold mb-4 text-center">Мои путешествия</h1>
      {/* Текущее путешествие */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-2 px-2">Текущее путешествие</h2>
        {currentTrip ? (
          <TripMobileCard trip={currentTrip} onClick={() => navigate(`/trips/${currentTrip.id}`)} />
        ) : (
          <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-xl">Нет текущего путешествия</div>
        )}
      </section>
      {/* Предстоящие путешествия */}
      <section>
        <h2 className="text-base font-semibold mb-2 px-2">Предстоящие путешествия</h2>
        <div className="flex flex-col gap-3">
          {upcomingTrips.length > 0 ? upcomingTrips.map(trip => (
            <TripMobileCard key={trip.id} trip={trip} onClick={() => navigate(`/trips/${trip.id}`)} />
          )) : (
            <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-xl">У вас нет предстоящих путешествий</div>
          )}
        </div>
      </section>
    </div>
  );
}

function TripMobileCard({ trip, onClick }: { trip: Trip, onClick: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 shadow-sm cursor-pointer active:bg-gray-100 transition"
      onClick={onClick}
    >
      <img src={trip.image} alt={trip.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate mb-1">{trip.title}</div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{trip.location}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
          <Calendar className="w-3 h-3" />
          <span>{trip.startDate} - {trip.endDate}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>{trip.details?.travelers || 2} чел.</span>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); navigate(`/chat?q=Путешествие: ${encodeURIComponent(trip.title)}`); }}
        className="p-2 rounded-full hover:bg-primary/10"
        title="Открыть чат по путешествию"
      >
        <MessageSquare className="w-5 h-5 text-primary" />
      </button>
      <ArrowRight className="w-5 h-5 text-gray-400" />
    </div>
  );
} 