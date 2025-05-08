import { Dialog, DialogContent } from './ui/dialog';
import { MapPin, Calendar, DollarSign, ChevronRight, X, Users, Plane, Hotel, Car, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Trip {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: string;
  image: string;
  status: 'upcoming' | 'past' | 'ongoing';
  route: string[];
  details?: {
    travelers: number;
    transportation: string[];
    accommodation: string[];
    activities: string[];
  };
}

interface TripDetailsProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export function TripDetails({ trip, isOpen, onClose }: TripDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="relative h-64">
          <img
            src={trip.image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h2 className="text-2xl font-semibold mb-2">{trip.title}</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{trip.location}</span>
              </div>
              <div className="px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full">
                {trip.cost}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Даты поездки</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Количество путешественников</div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{trip.details?.travelers || 2} человека</span>
              </div>
            </div>
          </div>

          {/* Маршрут */}
          <div>
            <h3 className="text-lg font-medium mb-3">Маршрут</h3>
            <div className="bg-muted/30 rounded-xl p-6">
              <div className="space-y-4">
                {trip.route.map((stop, index) => (
                  <div key={stop} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : index === trip.route.length - 1 ? 'bg-primary' : 'bg-primary/60'}`} />
                      {index < trip.route.length - 1 && (
                        <div className="w-0.5 h-16 bg-primary/20" />
                      )}
                    </div>
                    <div className="flex-1 -mt-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-base">{stop}</div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {index === 0 ? formatDate(trip.startDate) : 
                             index === trip.route.length - 1 ? formatDate(trip.endDate) : 
                             formatDate(new Date(new Date(trip.startDate).getTime() + (index * (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (trip.route.length - 1))).toISOString())}
                          </span>
                        </div>
                      </div>
                      {trip.details?.accommodation && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {trip.details.accommodation[index]}
                        </div>
                      )}
                      {index < trip.route.length - 1 && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          {trip.details?.transportation && (
                            <div className="flex items-center gap-1.5">
                              <Car className="w-4 h-4" />
                              <span>{trip.details.transportation[index]}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Детали поездки */}
          {trip.details && (
            <div className="grid grid-cols-2 gap-6">
              {/* Транспорт */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Транспорт
                </h3>
                <ul className="space-y-2">
                  {trip.details.transportation.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Проживание */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Hotel className="w-5 h-5" />
                  Проживание
                </h3>
                <ul className="space-y-2">
                  {trip.details.accommodation.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Активности */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-3">Активности</h3>
                <div className="grid grid-cols-2 gap-4">
                  {trip.details.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="bg-muted/30 rounded-lg p-3 text-sm flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 