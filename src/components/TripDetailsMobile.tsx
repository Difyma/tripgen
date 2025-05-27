import { MapPin, Calendar, DollarSign, Users, Plane, Hotel, Car, CalendarDays, Utensils, ArrowLeft, Clock } from 'lucide-react';

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
    costs: {
      transportation: number;
      accommodation: number;
      activities: number;
      food: number;
      other: number;
    };
  };
}

interface TripDetailsMobileProps {
  trip: Trip;
  onBack: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function TripDetailsMobile({ trip, onBack }: TripDetailsMobileProps) {
  const totalCost = trip.details?.costs ? 
    Object.values(trip.details.costs).reduce((acc, curr) => acc + curr, 0) : 0;

  // daysArray для плана путешествия
  const getDaysArray = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date.toISOString();
    });
  };
  const daysArray = getDaysArray(trip.startDate, trip.endDate);

  return (
    <div className="md:hidden bg-white min-h-screen flex flex-col">
      {/* Баннер */}
      <div className="relative h-56 w-full">
        <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
        <button
          onClick={onBack}
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg text-black shadow"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Назад</span>
        </button>
        <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow-lg">
          <h1 className="text-2xl font-bold mb-2">{trip.title}</h1>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 bg-black/40 rounded px-2 py-1"><MapPin className="w-4 h-4" />{trip.location}</span>
            <span className="flex items-center gap-1 bg-black/40 rounded px-2 py-1"><Calendar className="w-4 h-4" />{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
            <span className="flex items-center gap-1 bg-black/40 rounded px-2 py-1"><Users className="w-4 h-4" />{trip.details?.travelers || 2} чел.</span>
          </div>
        </div>
      </div>

      {/* Основные блоки */}
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Стоимость */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <div>
            <div className="text-xs text-gray-500">Стоимость</div>
            <div className="text-lg font-semibold">{trip.cost || formatCurrency(totalCost)}</div>
          </div>
        </div>
        {/* Транспорт */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <Plane className="w-6 h-6 text-blue-500" />
          <div>
            <div className="text-xs text-gray-500">Транспорт</div>
            <div className="text-base font-medium">{trip.details?.transportation?.join(', ') || '—'}</div>
          </div>
        </div>
        {/* Проживание */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <Hotel className="w-6 h-6 text-purple-500" />
          <div>
            <div className="text-xs text-gray-500">Проживание</div>
            <div className="text-base font-medium">{trip.details?.accommodation?.join(', ') || '—'}</div>
          </div>
        </div>
      </div>

      {/* Маршрут и План путешествия */}
      <div className="flex flex-col gap-4 px-4 pb-8">
        <section className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Маршрут</h2>
          </div>
          <div className="space-y-3">
            {trip.route.map((stop, index) => (
              <div key={stop} className="flex items-center">
                <div className="flex flex-col items-center mr-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-primary' : index === trip.route.length - 1 ? 'bg-primary' : 'bg-primary/60'}`} />
                  {index < trip.route.length - 1 && (
                    <div className="w-0.5 h-8 bg-primary/20 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base">{stop}</div>
                  {trip.details?.accommodation && (
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
                      <Hotel className="w-3 h-3" />
                      {trip.details.accommodation[index]}
                    </div>
                  )}
                  {index < trip.route.length - 1 && trip.details?.transportation && (
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
                      <Plane className="w-3 h-3" />
                      {trip.details.transportation[index]}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {index === 0 ? formatDate(trip.startDate) : 
                   index === trip.route.length - 1 ? formatDate(trip.endDate) : 
                   formatDate(new Date(new Date(trip.startDate).getTime() + (index * (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (trip.route.length - 1))).toISOString())}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">План путешествия</h2>
          </div>
          <div className="space-y-4">
            {daysArray.map((date, dayIndex) => {
              const currentLocation = trip.route[Math.min(dayIndex, trip.route.length - 1)];
              const activities = trip.details?.activities.slice(dayIndex * 2, (dayIndex + 1) * 2) || [];
              return (
                <div key={date} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {dayIndex + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{formatDate(date)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {currentLocation}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>День {dayIndex + 1} из {daysArray.length}</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    {/* Проживание для текущего дня */}
                    {trip.details?.accommodation[Math.min(dayIndex, trip.details.accommodation.length - 1)] && (
                      <div className="flex items-start gap-2 p-2 bg-white rounded border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Hotel className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-0.5">Проживание</div>
                          <div className="text-xs text-gray-600">
                            {trip.details.accommodation[Math.min(dayIndex, trip.details.accommodation.length - 1)]}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Транспорт */}
                    {dayIndex < trip.route.length - 1 && trip.details?.transportation[dayIndex] && (
                      <div className="flex items-start gap-2 p-2 bg-white rounded border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Plane className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-0.5">Транспорт</div>
                          <div className="text-xs text-gray-600">
                            {trip.details.transportation[dayIndex]}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Активности */}
                    {activities.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {activities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border border-gray-100">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-xs font-medium mb-0.5">Активность {index + 1}</div>
                              <div className="text-xs text-gray-600">{activity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Если нет активностей */}
                    {activities.length === 0 && (
                      <div className="text-center py-2 text-xs text-gray-500">
                        Свободный день для самостоятельного исследования
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Мобильный сайдбар (заглушка, как в чате) */}
      {/* <MobileSidebar /> */}
    </div>
  );
} 