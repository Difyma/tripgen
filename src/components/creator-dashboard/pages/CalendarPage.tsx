import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'tour' | 'booking' | 'meeting';
  guests?: number;
  location?: string;
  time?: string;
}

const mockEvents: CalendarEvent[] = [
  { id: '1', title: 'Тур по Алтаю', date: new Date(2026, 2, 15), type: 'tour', guests: 12, location: 'Горно-Алтайск' },
  { id: '2', title: 'Встреча с клиентом', date: new Date(2026, 2, 18), type: 'meeting', time: '14:00' },
  { id: '3', title: 'Байкал зимой', date: new Date(2026, 2, 22), type: 'tour', guests: 8, location: 'Иркутск' },
  { id: '4', title: 'Бронирование отеля', date: new Date(2026, 2, 25), type: 'booking', time: '10:00' },
];

const typeColors = {
  tour: 'bg-blue-100 text-blue-700 border-blue-200',
  booking: 'bg-green-100 text-green-700 border-green-200',
  meeting: 'bg-purple-100 text-purple-700 border-purple-200',
};

const typeLabels = {
  tour: 'Тур',
  booking: 'Бронирование',
  meeting: 'Встреча',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7;

    const days: (number | null)[] = [];
    for (let i = 1; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDate = (day: number) => {
    return mockEvents.filter(event => 
      event.date.getDate() === day &&
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Календарь</h1>
          <p className="text-gray-500 mt-1">Планируйте туры и следите за расписанием</p>
        </div>
        <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
          <Plus className="w-4 h-4" />
          Добавить событие
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Сегодня
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="h-24" />;
                }

                const events = getEventsForDate(day);
                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                const isSelected = selectedDate?.getDate() === day;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={cn(
                      'h-24 p-2 text-left border rounded-lg transition-colors hover:bg-gray-50',
                      isSelected && 'ring-2 ring-gray-900',
                      isToday && 'bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      isToday ? 'text-gray-900' : 'text-gray-700'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate',
                            typeColors[event.type]
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500">+{events.length - 2} ещё</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate 
                ? `События ${selectedDate.toLocaleDateString('ru-RU')}`
                : 'Ближайшие события'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockEvents.map(event => (
              <div key={event.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className={typeColors[event.type]}>
                    {typeLabels[event.type]}
                  </Badge>
                  {event.time && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                {event.location && (
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                )}
                {event.guests && (
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3" />
                    {event.guests} гостей
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
