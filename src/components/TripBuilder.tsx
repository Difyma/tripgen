import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, Calendar, Undo2, Redo2, Trash2, ExternalLink, Plus, Clock, BedDouble, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarRange } from '@/components/ui/calendar';
import type { TripPlanDay } from '../types/tripPlan';

/** Состояние фильтра дат (как в хедере чата) */
export interface DateFilterState {
  type: 'specific' | 'duration' | 'month';
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  month?: { month: number; year: number };
}

interface TripBuilderProps {
  message: string;
  /** Структурированный маршрут из JSON-ответа AI — при наличии используется вместо парсинга текста */
  itinerary?: TripPlanDay[];
  duration: string;
  travelers: number;
  onClose: () => void;
  /** Дублирование выбора дат из хедера: при заданных пропсах блок «Выберите даты» открывает тот же выбор */
  dateFilter?: DateFilterState;
  setDateFilter?: (v: DateFilterState) => void;
  getDateFilterDisplay?: () => string;
  onDurationChange?: (days: number) => void;
  onMonthSelection?: (month: number, year: number) => void;
}

interface Day {
  number: number;
  title: string;
  activities: Activity[];
}

interface Activity {
  icon: string;
  name: string;
  type: string;
  description: string;
  image: string;
  time: string;
  distance?: string;
  link?: string;
}

const activityIcons: Record<string, JSX.Element> = {
  hotel: <BedDouble className="w-5 h-5 text-blue-700" />, // или любая другая иконка
  restaurant: <Utensils className="w-5 h-5 text-rose-700" />, // ...
  cafe: <Utensils className="w-5 h-5 text-amber-700" />, // ...
  attraction: <ExternalLink className="w-5 h-5 text-green-700" />, // ...
  default: <ExternalLink className="w-5 h-5 text-gray-400" />,
};

const getActivityIcon = (type: string) => activityIcons[type] || activityIcons.default;

const getActivityImage = (type: string) => {
  const images: Record<string, string[]> = {
    hotel: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    ],
    restaurant: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    ],
    cafe: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    ],
    attraction: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    ],
    default: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    ],
  };
  return (images[type] || images.default)[Math.floor(Math.random() * (images[type]?.length || 1))];
};

const getRandomTime = (type: string) => {
  if (type === 'hotel') return 'Заезд в 15:00 (6 ночей)';
  if (type === 'restaurant' || type === 'cafe') return '19:00 - 21:00';
  return '10:00 - 12:00';
};

const getRandomDistance = () => `${(Math.random() * 2 + 0.2).toFixed(2)} км`;

const inferActivityType = (name: string): string => {
  if (/отель|hotel|завтрак в отеле|ночлег/i.test(name)) return 'hotel';
  if (/ресторан|restaurant|обед|ужин|трактир/i.test(name)) return 'restaurant';
  if (/кафе|cafe|кофе|кофе-брейк/i.test(name)) return 'cafe';
  return 'attraction';
};

const SLOT_TIME: Record<string, string> = {
  morning: '08:00 - 12:00',
  daytime: '12:00 - 17:00',
  evening: '17:00 - 22:00',
};
const SLOT_ICON: Record<string, string> = {
  morning: '🍳',
  daytime: '🏛️',
  evening: '🌅',
};

/** Преобразует структурированный itinerary из API в формат дней/активностей для билдера */
function itineraryToDays(itinerary: TripPlanDay[]): Day[] {
  return itinerary.map((d) => {
    const activities: Activity[] = [];
    const dayNum = typeof d.day === 'number' ? d.day : 1;
    const title = (d.title || `День ${dayNum}`).trim();

    const addSlot = (slot: 'morning' | 'daytime' | 'evening', items: string[] | undefined) => {
      if (!Array.isArray(items)) return;
      items.forEach((text) => {
        const lines = (text || '').trim().split(/\n/).map((l) => l.trim()).filter(Boolean);
        lines.forEach((name) => {
          if (!name) return;
          const type = inferActivityType(name);
          activities.push({
            icon: SLOT_ICON[slot],
            name: name.length > 60 ? name.slice(0, 57) + '…' : name,
            type,
            description: name,
            image: getActivityImage(type),
            time: SLOT_TIME[slot],
            distance: getRandomDistance(),
            link: 'https://google.com',
          });
        });
      });
    };

    addSlot('morning', d.morning);
    addSlot('daytime', d.daytime);
    addSlot('evening', d.evening);

    return { number: dayNum, title, activities };
  });
}

/** Убираем с начала строки время и эмодзи/символы, оставляем название активности */
function cleanActivityName(raw: string): string {
  let s = raw
    .replace(/^\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}\s*/i, '')
    .replace(/^[\s\u200B-\u200D\uFEFF]*/, '')
    .trim();
  const emojiOrSymbol = /^[\p{So}\p{Sk}\p{Sm}\s\u200B-\u200D\uFEFF]+/u;
  s = s.replace(emojiOrSymbol, '').trim();
  return s || raw.trim();
}

const parseMessage = (text: string): Day[] => {
  const days: Day[] = [];
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const dayRegex = /День (\d+):\s*([^\n]+)([\s\S]*?)(?=День \d+:|$)/gi;
  let match;
  while ((match = dayRegex.exec(normalizedText)) !== null) {
    const [, number, title, content] = match;
    const activities: Activity[] = [];
    const contentNorm = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Каждая активность: строка(и), начинающиеся с буллета • · - до следующего буллета или заголовка секции
    const bulletRegex = /(?:^|\n)\s*([•·\-])\s*(\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2})?\s*([\s\S]*?)(?=(?:\n\s*[•·\-]\s*)|\n\s*(?:Утро|День|Вечер)\s*\(|\n\s*День\s+\d+\s*:|$)/g;
    let blockMatch;
    while ((blockMatch = bulletRegex.exec(contentNorm)) !== null) {
      const [, , timeStr, rest] = blockMatch;
      const raw = (rest || '').replace(/\n+/g, ' ').trim();
      const name = cleanActivityName(raw);
      if (!name) continue;
      if (/^(Утро|День|Вечер)\s*\(\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}\)$/i.test(name.trim())) continue;
      let type = 'attraction';
      if (/отель|hotel|завтрак в отеле|ночлег/i.test(name)) type = 'hotel';
      else if (/ресторан|restaurant|обед|ужин|завтрак|трактир/i.test(name)) type = 'restaurant';
      else if (/кафе|cafe|кофе|кофе-брейк|starbucks/i.test(name)) type = 'cafe';
      const time = timeStr ? timeStr.replace(/\s*[-–—]\s*/, ' - ') : getRandomTime(type);
      activities.push({
        icon: '🎯',
        name: name.length > 60 ? name.slice(0, 57) + '…' : name,
        type,
        description: name,
        image: getActivityImage(type),
        time,
        distance: getRandomDistance(),
        link: 'https://google.com',
      });
    }
    if (activities.length >= 2 && activities[activities.length - 1].time === '10:00 - 12:00' && activities[activities.length - 2].time === '10:00 - 12:00') {
      activities.pop();
    }
    days.push({
      number: parseInt(number, 10),
      title: title.trim(),
      activities,
    });
  }
  return days;
};

const TripBuilder: React.FC<TripBuilderProps> = ({
  message,
  itinerary,
  duration,
  travelers,
  onClose,
  dateFilter,
  setDateFilter,
  getDateFilterDisplay,
  onDurationChange,
  onMonthSelection
}) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const [showDistances, setShowDistances] = useState(true);

  const hasDatePicker = Boolean(dateFilter && setDateFilter && getDateFilterDisplay && onDurationChange && onMonthSelection);
  const dateLabel = hasDatePicker ? getDateFilterDisplay!() : duration;

  const days = useMemo(() => {
    if (itinerary?.length) return itineraryToDays(itinerary);
    return parseMessage(message);
  }, [itinerary, message]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white h-full flex flex-col border-l border-gray-200 relative">
      {/* Кнопка закрытия */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {/* Фильтры */}
      <div className="p-6 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100"><Undo2 className="w-5 h-5" /></button>
            <button className="p-2 rounded-full hover:bg-gray-100"><Redo2 className="w-5 h-5" /></button>
            <button className="p-2 rounded-full hover:bg-gray-100"><Trash2 className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Расстояния</span>
            <input type="checkbox" checked={showDistances} onChange={() => setShowDistances(v => !v)} className="accent-black w-4 h-4" />
          </div>
        </div>
        {/* Блок с датами и путешественниками */}
        <div className="flex items-center gap-6 text-sm text-gray-500 mt-3 mb-2">
          {hasDatePicker ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10 rounded">
                  <Calendar className="w-4 h-4" />
                  {dateLabel}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDateFilter!({ type: 'specific' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter!.type === 'specific' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Даты
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilter!({ type: 'duration' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter!.type === 'duration' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Длительность
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilter!({ type: 'month' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter!.type === 'month' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Месяц
                    </button>
                  </div>
                </div>
                {dateFilter!.type === 'specific' && (
                  <CalendarRange
                    mode="range"
                    selected={{ from: dateFilter!.startDate, to: dateFilter!.endDate }}
                    onSelect={(range) => {
                      if (range?.from && setDateFilter) {
                        setDateFilter({
                          type: 'specific',
                          startDate: range.from,
                          endDate: range.to || range.from
                        });
                      }
                    }}
                    locale={ru}
                    className="rounded-lg"
                  />
                )}
                {dateFilter!.type === 'duration' && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Количество дней</label>
                      <div className="flex items-center gap-2">
                        {[3, 5, 7, 10, 14].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => onDurationChange!(days)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter!.duration === days ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {days}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {dateFilter!.type === 'month' && (
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(2024, i, 1);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onMonthSelection!(i, 2024)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter!.month?.month === i ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {format(date, 'LLL', { locale: ru })}
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {duration}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {travelers} {travelers === 1 ? 'путешественник' : travelers < 5 ? 'путешественника' : 'путешественников'}
          </div>
        </div>
      </div>

      {/* Список дней или сырой текст маршрута */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {days.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold mb-4">Маршрут <span className="text-gray-400 font-normal">{days.length} {days.length === 1 ? 'день' : days.length < 5 ? 'дня' : 'дней'}</span></h2>
            {days.map((day) => (
          <div key={day.number} className="mb-8">
            {/* Заголовок дня */}
            <button
              className="flex items-center gap-2 text-base font-semibold mb-2 focus:outline-none"
              onClick={() => setExpandedDays(expanded => expanded.includes(day.number) ? expanded.filter(d => d !== day.number) : [...expanded, day.number])}
            >
              {expandedDays.includes(day.number) ? <ChevronDown /> : <ChevronUp />}
              <span>День {day.number} <span className="ml-2 font-normal text-gray-500">{day.title}</span></span>
            </button>
            <AnimatePresence>
              {expandedDays.includes(day.number) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <div className="space-y-6 pl-6 border-l-2 border-gray-100">
                    {day.activities.map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white rounded-xl border p-3 shadow-sm">
                        <img src={activity.image} alt={activity.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(activity.type)}
                            <span className="font-medium text-base truncate">{activity.name}</span>
                          </div>
                          <div className="text-gray-500 text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {activity.time}
                            {showDistances && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{activity.distance}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">{activity.description}</div>
                        </div>
                        <a href={activity.link} target="_blank" rel="noopener noreferrer" className="ml-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1">
                          {activity.type === 'hotel' ? 'Забронировать' : 'Ссылка'} <ExternalLink className="inline w-4 h-4 ml-1" />
                        </a>
                      </div>
                    ))}
                    <button className="mt-2 px-4 py-1 border rounded-lg text-gray-500 hover:bg-gray-50 flex items-center gap-1"><Plus className="w-4 h-4" /> Добавить</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
          </>
        ) : message.trim() ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Маршрут по дням</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-xl p-4 overflow-x-auto font-sans">{message.trim()}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TripBuilder; 