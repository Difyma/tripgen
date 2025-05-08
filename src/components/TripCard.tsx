import { MapPin, Calendar, ChevronRight, Eye, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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

interface TripCardProps {
  trip: Trip;
  isPast?: boolean;
  isLarge?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export function TripCard({ trip, isPast, isLarge }: TripCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${
        isPast 
          ? 'bg-muted/50 border-muted hover:bg-muted' 
          : isLarge
          ? 'bg-primary/5 border-primary/10 hover:bg-primary/10'
          : 'bg-card border-border hover:border-primary/20'
      }`}
    >
      <div className="relative">
        <img
          src={trip.image}
          alt={trip.title}
          className={`w-full object-cover ${isPast ? 'grayscale' : ''} ${isLarge ? 'h-48' : 'h-40'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Dropdown Menu */}
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/40 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/trips/${trip.id}`)}>
                Открыть детали
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Share')}>
                Поделиться
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Delete')} className="text-red-600">
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className={`font-semibold mb-1 truncate ${isLarge ? 'text-xl' : 'text-lg'}`}>
            <button onClick={() => navigate(`/trips/${trip.id}`)} className="hover:underline">
              {trip.title}
            </button>
          </h3>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{trip.location}</span>
            </div>
            <div className="px-2.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-full">
              {trip.cost}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            {trip.route.slice(0, isLarge ? trip.route.length : 2).map((stop, index) => (
              <span key={stop} className="flex items-center">
                <span className="font-medium">{stop}</span>
                {index < (isLarge ? trip.route.length - 1 : Math.min(trip.route.length - 1, 1)) && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </span>
            ))}
            {!isLarge && trip.route.length > 2 && (
              <span className="text-muted-foreground">+{trip.route.length - 2}</span>
            )}
          </div>
          <button
            onClick={() => navigate(`/trips/${trip.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Детали
          </button>
        </div>
      </div>
    </motion.div>
  );
} 