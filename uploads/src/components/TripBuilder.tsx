import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, Calendar, Undo2, Redo2, Trash2, ExternalLink, Plus, Clock, BedDouble, Utensils } from 'lucide-react';

interface TripBuilderProps {
  message: string;
  duration: string;
  travelers: number;
  onClose: () => void;
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
      '/images/Traveling_around_Altai.jpg',
      '/images/Traveling_around_Baikal.jpg',
    ],
    restaurant: [
      '/images/Traveling_around_Kamchatka.jpg',
      '/images/Traveling_around_Karelia.jpg',
    ],
    cafe: [
      '/images/Traveling_around_Altai.jpg',
      '/images/Traveling_around_Baikal.jpg',
    ],
    attraction: [
      '/images/Traveling_around_Kamchatka.jpg',
      '/images/Traveling_around_Karelia.jpg',
    ],
    default: [
      '/images/Traveling_around_Altai.jpg',
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

const parseMessage = (text: string): Day[] => {
  const days: Day[] = [];
  const dayRegex = /День (\d+):\s*([^\n]+)([\s\S]*?)(?=День \d+:|$)/g;
  let match;
  while ((match = dayRegex.exec(text)) !== null) {
    const [, number, title, content] = match;
    const activities: Activity[] = [];
    const placeRegex = /([✈️🏨🍽️🏰🏛️⛪🎯📍☕])\s+([^—\n]+?)(?:\s+(?:✓|✔️|☑️|✅|\(verified\)))?\s*(?:—|-)\s*([^\n]+)/g;
    let placeMatch;
    while ((placeMatch = placeRegex.exec(content)) !== null) {
      const [, icon, name, description] = placeMatch;
      // Определяем тип
      let type = 'attraction';
      if (/отель|hotel/i.test(name)) type = 'hotel';
      else if (/ресторан|restaurant/i.test(name)) type = 'restaurant';
      else if (/кафе|cafe/i.test(name)) type = 'cafe';
      // ... можно добавить другие типы
      activities.push({
        icon,
        name: name.trim(),
        type,
        description: description.trim(),
        image: getActivityImage(type),
        time: getRandomTime(type),
        distance: getRandomDistance(),
        link: 'https://google.com', // заглушка
      });
    }
    days.push({
      number: parseInt(number),
      title: title.trim(),
      activities,
    });
  }
  return days;
};

const TripBuilder: React.FC<TripBuilderProps> = ({
  message,
  duration,
  travelers,
  onClose
}) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const [showDistances, setShowDistances] = useState(true);

  const days = parseMessage(message);

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
      {/* Фильтры и табы */}
      <div className="p-6 pb-2 border-b border-gray-100">
        {/* Таб-бар */}
        <div className="flex gap-8 border-b mb-2">
          <button className="pb-2 border-b-2 border-black font-medium">Маршрут</button>
          <button className="pb-2 text-gray-400">Календарь</button>
          <button className="pb-2 text-gray-400">Бронирования</button>
        </div>
        <div className="flex items-center justify-between mt-4">
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
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {travelers} {travelers === 1 ? 'путешественник' : travelers < 5 ? 'путешественника' : 'путешественников'}
          </div>
        </div>
      </div>

      {/* Список дней */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
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
      </div>
    </div>
  );
};

export default TripBuilder; 