import { Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface CurrentTripProps {
  trip?: {
    id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    image: string;
    route: string[];
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export function CurrentTrip({ trip }: CurrentTripProps) {
  if (!trip) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        У вас нет текущих путешествий
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm"
    >
      <div className="relative">
        <img
          src={trip.image}
          alt={trip.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{trip.location}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Маршрут:</h4>
          <div className="flex flex-wrap gap-2">
            {trip.route.map((stop, index) => (
              <div key={stop} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {stop}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 