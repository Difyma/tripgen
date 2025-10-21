import { MapPin, Calendar, DollarSign, Users, Plane, Hotel, Car, Clock, CalendarDays, Utensils, CircleDollarSign, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface TripDetailsPageProps {
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

const getDaysBetweenDates = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export function TripDetailsPage({ trip, onBack }: TripDetailsPageProps) {
  const navigate = useNavigate();
  const totalDays = getDaysBetweenDates(trip.startDate, trip.endDate);
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(trip.startDate);
    date.setDate(date.getDate() + i);
    return date.toISOString();
  });

  const totalCost = trip.details?.costs ? 
    Object.values(trip.details.costs).reduce((acc, curr) => acc + curr, 0) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[400px]">
        <img
          src={trip.image}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к путешествиям</span>
        </button>

        {/* Chat icon */}
        <button
          onClick={() => navigate(`/chat?q=Путешествие: ${encodeURIComponent(trip.title)}`)}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
          title="Открыть чат по путешествию"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden md:inline">Чат</span>
        </button>

        {/* Trip info overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h1 className="text-4xl font-bold mb-6">{trip.title}</h1>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{trip.location}</span>
            </div>
            <div className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
            </div>
            <div className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{trip.details?.travelers || 2} человека</span>
            </div>
            <div className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl flex items-center gap-2 ml-auto">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">{trip.cost}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="col-span-2 space-y-6">
            {/* Маршрут */}
            <section className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Маршрут</h2>
              </div>
              <div className="space-y-4">
                {trip.route.map((stop, index) => (
                  <div key={stop} className="flex items-center">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : index === trip.route.length - 1 ? 'bg-primary' : 'bg-primary/60'}`} />
                      {index < trip.route.length - 1 && (
                        <div className="w-0.5 h-12 bg-primary/20 mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{stop}</div>
                      {trip.details?.accommodation && (
                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                          <Hotel className="w-4 h-4" />
                          {trip.details.accommodation[index]}
                        </div>
                      )}
                      {index < trip.route.length - 1 && trip.details?.transportation && (
                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                          <Plane className="w-4 h-4" />
                          {trip.details.transportation[index]}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {index === 0 ? formatDate(trip.startDate) : 
                       index === trip.route.length - 1 ? formatDate(trip.endDate) : 
                       formatDate(new Date(new Date(trip.startDate).getTime() + (index * (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (trip.route.length - 1))).toISOString())}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* План путешествия */}
            <section className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">План путешествия</h2>
              </div>
              <div className="space-y-6">
                {daysArray.map((date, dayIndex) => {
                  const currentLocation = trip.route[Math.min(dayIndex, trip.route.length - 1)];
                  const activities = trip.details?.activities.slice(dayIndex * 2, (dayIndex + 1) * 2) || [];
                  
                  return (
                    <div key={date} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {dayIndex + 1}
                          </div>
                          <div>
                            <div className="font-medium">{formatDate(date)}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {currentLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>День {dayIndex + 1} из {daysArray.length}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {/* Проживание для текущего дня */}
                        {trip.details?.accommodation[Math.min(dayIndex, trip.details.accommodation.length - 1)] && (
                          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Hotel className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Проживание</div>
                              <div className="text-gray-600">
                                {trip.details.accommodation[Math.min(dayIndex, trip.details.accommodation.length - 1)]}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Транспорт */}
                        {dayIndex < trip.route.length - 1 && trip.details?.transportation[dayIndex] && (
                          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Plane className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Транспорт</div>
                              <div className="text-gray-600">
                                {trip.details.transportation[dayIndex]}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Активности */}
                        {activities.length > 0 && (
                          <div className="grid grid-cols-2 gap-4">
                            {activities.map((activity, index) => (
                              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                                    {index + 1}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium mb-1">Активность {index + 1}</div>
                                  <div className="text-gray-600">{activity}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Если нет активностей */}
                        {activities.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
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

          {/* Боковая информация */}
          <div className="space-y-6">
            {/* Стоимость */}
            {trip.details?.costs && (
              <div className="bg-white rounded-2xl border p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Стоимость</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Общая стоимость:</span>
                    <span className="text-xl font-semibold text-primary">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-500" />
                        <span>Транспорт</span>
                      </div>
                      <span>{formatCurrency(trip.details.costs.transportation)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-4 h-4 text-gray-500" />
                        <span>Проживание</span>
                      </div>
                      <span>{formatCurrency(trip.details.costs.accommodation)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>Активности</span>
                      </div>
                      <span>{formatCurrency(trip.details.costs.activities)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-gray-500" />
                        <span>Питание</span>
                      </div>
                      <span>{formatCurrency(trip.details.costs.food)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>Прочее</span>
                      </div>
                      <span>{formatCurrency(trip.details.costs.other)}</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 mt-4" />
                  <div className="text-sm text-gray-500 text-center">
                    Стоимость указана на {trip.details.travelers} человек(а)
                  </div>
                </div>
              </div>
            )}

            {/* Транспорт */}
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Транспорт</h2>
              </div>
              <div className="space-y-2">
                {trip.details?.transportation.map((transport, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="w-4 h-4 text-primary" />
                    </div>
                    <span>{transport}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Проживание */}
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Проживание</h2>
              </div>
              <div className="space-y-2">
                {trip.details?.accommodation.map((place, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hotel className="w-4 h-4 text-primary" />
                    </div>
                    <span>{place}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}