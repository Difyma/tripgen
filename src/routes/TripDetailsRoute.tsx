import { useParams, useNavigate } from 'react-router-dom';
import { TripDetailsPage } from '../components/TripDetailsPage';
import { trips, Trip } from '../data/trips';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function TripDetailsRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentTrip, setCurrentTrip] = useState<Trip | undefined>(
    trips.find((t: Trip) => t.id === id)
  );

  if (!currentTrip) {
    return (
      <div className="flex-1 p-8">
        <button 
          onClick={() => navigate('/trips')}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к путешествиям</span>
        </button>
        <div className="text-center mt-12">Путешествие не найдено</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <TripDetailsPage 
        trip={currentTrip} 
        onBack={() => navigate('/trips')} 
      />
    </div>
  );
} 