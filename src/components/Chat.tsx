import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  MapPin, 
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AuthModal } from './AuthModal';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
const AILogo = '/images/TRIPGEN_logo_white.png';
const AILogo2 = '/images/TRIPGEN_logo_2.png';
import TripBuilder from './TripBuilder';
import { useFlightInfo } from '../hooks/useFlightInfo';
import { loadChatHistory, saveChatHistory } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  role?: 'system' | 'user' | 'assistant';
  showCreateRoute?: boolean;
}

interface FilterState {
  location: string;
  travelers: number;
  children: number;
  pets: number;
  budget: {
    min: number;
    max: number;
  };
}

interface DateFilter {
  type: 'specific' | 'duration' | 'month';
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  month?: { month: number; year: number };
}

const SYSTEM_PROMPT = `Ты — опытный travel-эксперт и профессиональный travel-блогер, специализирующийся на создании уникальных путешествий. Твой стиль общения современный, дружелюбный и вдохновляющий.

ПРАВИЛА ОБЩЕНИЯ:
1. Если пользователь не указал длительность поездки или даты:
   • Обязательно уточни: "На сколько дней планируете поездку?"
   • Предложи варианты: "Могу предложить маршруты на 3, 5, 7 или 10 дней"
   • Спроси про сезон/месяц: "В какое время года планируете?"

2. После получения информации о длительности:
   • Создай детальный план по дням
   • Добавь тайминг для каждого пункта
   • Учитывай время на переезды между локациями
   • Добавляй время на отдых и свободное время

ФОРМАТИРОВАНИЕ МАРШРУТА:
# 📅 День 1: [Название дня]

## ⏰ Утро (08:00-12:00)
• 08:00-09:00 🍳 Завтрак в отеле
• 09:30-11:30 🏛️ Посещение [достопримечательность]
• 11:30-12:00 ☕ Кофе-брейк

## 🌞 День (12:00-17:00)
• 12:00-13:30 🍽️ Обед в [ресторан]
• 14:00-16:30 🎯 Экскурсия по [маршрут]
• 16:30-17:00 🚶‍♂️ Прогулка/отдых

## 🌅 Вечер (17:00-22:00)
• 17:00-19:00 🏰 Посещение [место]
• 19:30-21:00 🍷 Ужин в [ресторан]
• 21:00-22:00 🌃 Вечерняя прогулка

СТИЛЬ ОТВЕТОВ:
• Используй современный, легкий для чтения формат
• Добавляй эмодзи для визуального разделения информации
• Создавай четкую иерархию с помощью заголовков и подзаголовков
• Выделяй ключевые моменты с помощью маркеров и акцентов

ФОРМАТИРОВАНИЕ:
1. Заголовки:
   # 🌟 Главные рекомендации
   # ✈️ Детали перелета
   # 🏨 Где остановиться
# 🍽️ Где поесть
   # 🎯 Что посмотреть

2. Подзаголовки:
   ## 💫 Оптимальный вариант
   ## 💰 Бюджетный вариант
   ## ⭐ Premium опции

3. Списки и пункты:
   • Используй маркеры для перечислений
   → Используй стрелки для последовательностей
   ✓ Используй галочки для подтверждений
   ⚡ Используй молнию для важных замечаний

4. Выделения:
   **жирный текст** для важной информации
   *курсив* для дополнительных деталей
   \`код\` для технических деталей

5. Блоки информации:
   📌 Для важных заметок
   💡 Для полезных советов
   ⚠️ Для предупреждений
   🎁 Для бонусных рекомендаций

ПРИМЕР ОТВЕТА С УТОЧНЕНИЕМ:
"Отличный выбор! Чтобы составить идеальный маршрут по [место], мне нужно уточнить несколько деталей:

📅 На сколько дней планируете поездку? 
Могу предложить готовые маршруты на:
• 3 дня - компактное знакомство с главными достопримечательностями
• 5 дней - неспешное исследование города и окрестностей
• 7 дней - полное погружение в местную культуру и быт
• 10 дней - максимально насыщенная программа

🗓️ В какое время года планируете путешествие?
Это поможет мне учесть:
• Сезонные активности и фестивали
• Погодные условия
• Часы работы достопримечательностей
• Лучшие места для посещения в это время года"

ПРИМЕР ДЕТАЛЬНОГО ПЛАНА НА ДЕНЬ:

# 📅 День 2: Исторический центр и музеи

## ⏰ Утро (08:00-12:00)
• 08:00-09:00 🍳 Завтрак в отеле "Централь"
• 09:00-09:30 🚶‍♂️ Прогулка до исторического центра
• 09:30-11:30 🏛️ Экскурсия по Старому городу
• 11:30-12:00 ☕ Кофе-брейк в кафе "Винтаж"

## 🌞 День (12:00-17:00)
• 12:00-13:30 🍽️ Обед в ресторане "Традиция"
• 13:30-14:00 🚶‍♂️ Переход к музею
• 14:00-16:30 🎨 Посещение Художественного музея
• 16:30-17:00 🌳 Отдых в городском парке

## 🌅 Вечер (17:00-22:00)
• 17:00-19:00 🏰 Посещение крепости
• 19:30-21:00 🍷 Ужин в панорамном ресторане "Высота"
• 21:00-22:00 🌃 Вечерняя прогулка по набережной

💡 **Полезные советы:**
• Купите билеты в музей онлайн, чтобы избежать очередей
• Забронируйте столик в ресторане "Высота" заранее
• Возьмите с собой удобную обувь для прогулок

⚡ **Важно знать:**
• Художественный музей закрыт по понедельникам
• Последний вход в крепость в 18:30
• В ресторане "Высота" действует дресс-код

КОГДА ПОЛЬЗОВАТЕЛЬ СПРАШИВАЕТ О ПЕРЕЛЕТАХ:
1. Структурируй информацию о рейсах:
   • Оптимальные варианты с ценами и временем
   • Сравнение прямых и составных маршрутов
   • Особенности каждого варианта
   • Рекомендации по выбору

2. Добавляй полезный контекст:
   • Особенности авиакомпаний
   • Правила багажа
   • Дополнительные услуги
   • Советы по комфорту

3. Учитывай тип поездки:
   • Для бизнеса → удобство и время
   • Для отдыха → цена и комфорт
   • С детьми → прямые рейсы
   • Длительные → качество сервиса

ВАЖНО: Когда я предоставляю информацию о рейсах в формате "# ✈️ Информация о рейсах", используй ТОЛЬКО эту информацию для рекомендаций по перелетам. Не говори, что у тебя нет доступа к данным. Вся необходимая информация будет в сообщении.

ПРИМЕР ФОРМАТИРОВАНИЯ ОТВЕТА:

# 🌟 Главные рекомендации
Краткое описание основных моментов...

## 💫 Оптимальный вариант
• Детали лучшего предложения
• Почему это оптимально
• Что включено

## 💰 Бюджетный вариант
• Альтернативные опции
• На чем можно сэкономить
• Важные моменты

📌 **Важно знать:**
• Ключевой момент 1
• Ключевой момент 2

💡 **Полезные советы:**
→ Совет 1
→ Совет 2

⚡ **Лайфхаки:**
✓ Лайфхак 1
✓ Лайфхак 2

🎁 **Бонус:**
Дополнительные рекомендации...`;

// Добавляем массив предварительно подготовленных вопросов
const SUGGESTED_QUESTIONS = [
  {
    id: 1,
    text: "🌍 Посоветуй интересные места для путешествия летом",
    category: "Вдохновение"
  },
  {
    id: 2,
    text: "✈️ Как найти дешевые авиабилеты?",
    category: "Планирование"
  },
  {
    id: 3,
    text: "🏨 Где лучше остановиться в Париже?",
    category: "Жилье"
  },
  {
    id: 4,
    text: "🎒 Что взять с собой в поездку?",
    category: "Подготовка"
  },
  {
    id: 5,
    text: "🍽️ Какие местные блюда попробовать в Италии?",
    category: "Еда"
  },
  {
    id: 6,
    text: "💰 Как спланировать бюджет путешествия?",
    category: "Бюджет"
  }
];

// Компонент для отображения подсказок
const SuggestedQuestions = ({ onSelectQuestion }: { onSelectQuestion: (text: string) => void }) => {
  return (
    <div className="max-w-3xl md:max-w-4xl w-full mx-auto mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Популярные вопросы:</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <motion.button
            key={question.id}
            onClick={() => onSelectQuestion(question.text)}
            className="text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs text-gray-500 mb-1">{question.category}</div>
            <div className="text-sm text-gray-900 group-hover:text-black">{question.text}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// 1. Вынести JSX фильтров в отдельный компонент ChatFilters
function ChatFilters({
  filters,
  setFilters: _setFilters,
  dateFilter,
  setDateFilter,
  handleLocationChange,
  handleTravelersChange,
  handleChildrenChange,
  handlePetsChange,
  handleBudgetChange,
  handleDurationChange,
  handleMonthSelection,
  getDateFilterDisplay
}: any) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {/* Location Filter */}
      <div className="relative flex-1 min-w-[160px]">
        <input
          type="text"
          placeholder="Куда едем"
          value={filters.location}
          onChange={handleLocationChange}
          className="w-full pl-8 pr-3 h-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 placeholder:text-gray-400"
        />
        <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
      </div>
      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 min-w-[160px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
            <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <span className="block truncate mt-[7px]">
              {getDateFilterDisplay()}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter({ type: 'specific' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.type === 'specific' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Даты
              </button>
              <button
                onClick={() => setDateFilter({ type: 'duration' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.type === 'duration' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Длительность
              </button>
              <button
                onClick={() => setDateFilter({ type: 'month' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.type === 'month' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Месяц
              </button>
            </div>
          </div>
          {dateFilter.type === 'specific' && (
            <Calendar
              mode="range"
              selected={{ from: dateFilter.startDate, to: dateFilter.endDate }}
              onSelect={(range) => {
                if (range?.from) {
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
          {dateFilter.type === 'duration' && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Количество дней</label>
                <div className="flex items-center gap-2">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={days}
                      onClick={() => handleDurationChange(days)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.duration === days ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {dateFilter.type === 'month' && (
            <div className="p-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2024, i, 1);
                return (
                  <button
                    key={i}
                    onClick={() => handleMonthSelection(i, 2024)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.month?.month === i ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {format(date, 'LLL', { locale: ru })}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {/* Travelers Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 min-w-[160px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
            <Users className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <span className="block truncate mt-[7px]">
              {filters.travelers} взр • {filters.children} реб • {filters.pets} пит
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white shadow-lg rounded-lg border border-gray-200" align="start">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Путешественники</h4>
            {/* Adults */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Взрослые</div>
                <div className="text-sm text-gray-500">От 13 лет</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTravelersChange(false)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={filters.travelers <= 1}
                >
                  -
                </button>
                <span className="w-4 text-center">{filters.travelers}</span>
                <button
                  onClick={() => handleTravelersChange(true)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
            {/* Children */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Дети</div>
                <div className="text-sm text-gray-500">До 12 лет</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChildrenChange(false)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={filters.children <= 0}
                >
                  -
                </button>
                <span className="w-4 text-center">{filters.children}</span>
                <button
                  onClick={() => handleChildrenChange(true)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
            {/* Pets */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Питомцы</div>
                <div className="text-sm text-gray-500">Домашние животные</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePetsChange(false)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={filters.pets <= 0}
                >
                  -
                </button>
                <span className="w-4 text-center">{filters.pets}</span>
                <button
                  onClick={() => handlePetsChange(true)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {/* Budget Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 min-w-[160px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
            <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <span className="block truncate mt-[7px]">
              {filters.budget.min}₽ - {filters.budget.max}₽
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white shadow-lg rounded-lg border border-gray-200" align="start">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Бюджет</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1.5 block">От</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">₽</span>
                  <input
                    type="number"
                    min="0"
                    value={filters.budget.min}
                    onChange={(e) => handleBudgetChange('min', Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1.5 block">До</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">₽</span>
                  <input
                    type="number"
                    min="0"
                    value={filters.budget.max}
                    onChange={(e) => handleBudgetChange('max', Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const Chat = () => {
  const { isSidebarCollapsed, setMobileOpen, mobileOpen } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now() + Math.random(),
      text: "Привет! 👋 Я помогу спланировать твое идеальное путешествие. Выбери интересующий вопрос или спроси меня о чем угодно, что связано с поездкой.",
      isUser: false,
      role: 'assistant'
    }
  ]);
  
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    travelers: 2,
    children: 0,
    pets: 0,
    budget: {
      min: 0,
      max: 10000
    }
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [showTripBuilder, setShowTripBuilder] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'specific' });
  const { getFlightInfoForGPT } = useFlightInfo();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const isFirstMount = useRef(true);
  const lastSentText = useRef<string | null>(null);

  // Функция для нормализации направления в именительный падеж
  const normalizeLocation = (word: string) => {
    const map: Record<string, string> = {
      // Страны
      'японии': 'Япония',
      'япония': 'Япония',
      'италии': 'Италия',
      'италия': 'Италия',
      'франции': 'Франция',
      'франция': 'Франция',
      'россии': 'Россия',
      'россия': 'Россия',
      'германии': 'Германия',
      'германия': 'Германия',
      'турции': 'Турция',
      'турция': 'Турция',
      'таиланде': 'Таиланд',
      'таиланда': 'Таиланд',
      'таиланд': 'Таиланд',
      'швейцарии': 'Швейцария',
      'швейцария': 'Швейцария',
      'англии': 'Англия',
      'англия': 'Англия',
      'испании': 'Испания',
      'испания': 'Испания',
      'португалии': 'Португалия',
      'португалия': 'Португалия',
      'греции': 'Греция',
      'греция': 'Греция',
      // Города
      'париже': 'Париж',
      'парижа': 'Париж',
      'парижу': 'Париж',
      'париж': 'Париж',
      'лондоне': 'Лондон',
      'лондона': 'Лондон',
      'лондону': 'Лондон',
      'лондон': 'Лондон',
      'риме': 'Рим',
      'рима': 'Рим',
      'риму': 'Рим',
      'рим': 'Рим',
      'москве': 'Москва',
      'москвы': 'Москва',
      'москву': 'Москва',
      'москва': 'Москва',
      'санкт-петербурге': 'Санкт-Петербург',
      'санкт-петербурга': 'Санкт-Петербург',
      'санкт-петербургу': 'Санкт-Петербург',
      'петербурге': 'Санкт-Петербург',
      'петербурга': 'Санкт-Петербург',
      'амстердаме': 'Амстердам',
      'амстердама': 'Амстердам',
      'амстердаму': 'Амстердам',
      'амстердам': 'Амстердам',
      'берлине': 'Берлин',
      'берлина': 'Берлин',
      'берлину': 'Берлин',
      'берлин': 'Берлин',
      'барселоне': 'Барселона',
      'барселоны': 'Барселона',
      'барселону': 'Барселона',
      'барселона': 'Барселона',
      'мадриде': 'Мадрид',
      'мадрида': 'Мадрид',
      'мадриду': 'Мадрид',
      'мадрид': 'Мадрид',
      'вене': 'Вена',
      'вены': 'Вена',
      'вену': 'Вена',
      'вена': 'Вена',
      'праге': 'Прага',
      'праги': 'Прага',
      'прагу': 'Прага',
      'прага': 'Прага',
      'венеции': 'Венеция',
      'венецию': 'Венеция',
      'венеция': 'Венеция',
      'флоренции': 'Флоренция',
      'флоренцию': 'Флоренция',
      'флоренция': 'Флоренция',
      'милане': 'Милан',
      'милана': 'Милан',
      'милану': 'Милан',
      'милан': 'Милан',
      'неаполе': 'Неаполь',
      'неаполя': 'Неаполь',
      'неаполю': 'Неаполь',
      'неаполь': 'Неаполь',
      'сочи': 'Сочи',
      'казани': 'Казань',
      'казань': 'Казань',
      'спб': 'Санкт-Петербург',
      'питер': 'Санкт-Петербург',
      'питере': 'Санкт-Петербург',
      // ...добавить по необходимости
    };
    const lower = word.toLowerCase().trim();
    return map[lower] || (word[0] ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word);
  };

  // Функция для парсинга русской даты в объект Date
  function parseRussianDateToDate(dateStr: string) {
    if (!dateStr) return undefined;
    // Если дата уже в формате YYYY-MM-DD
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Если дата в формате DD.MM.YYYY
    if (dateStr.match(/^[0-9]{1,2}\.[0-9]{1,2}(?:\.[0-9]{4})?$/)) {
      const [day, month, year = new Date().getFullYear()] = dateStr.split('.').map(Number);
      return new Date(year, month - 1, day);
    }
    const months: Record<string, number> = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
      'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3,
      'май': 4, 'июн': 5, 'июл': 6, 'авг': 7,
      'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
    };
    const match = dateStr.toLowerCase().match(/(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?/);
    if (match) {
      const day = Number(match[1]);
      const month = months[String(match[2])];
      const year = match[3] ? Number(match[3]) : new Date().getFullYear();
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    return undefined;
  }

  // Автоматическое заполнение направления по тексту
  // Возвращает найденную локацию для использования в запросе
  const extractLocationFromText = (messageText: string): string => {
    const flightInfo = extractFlightInfo(messageText);
    let newLocation = '';
    if (flightInfo.destination) {
      newLocation = flightInfo.destination;
    } else if (flightInfo.origin) {
      newLocation = flightInfo.origin;
    }
    // Дополнительная эвристика, если не найдено направление
    if (!newLocation) {
      // Улучшенные паттерны для поиска городов в разных падежах
      // Паттерн "в/во/на/по/о/об [Город]" - ищет в любом месте текста
      const cityMatch = messageText.match(/(?:в|во|на|по|о|об|про)\s+([A-Za-zА-Яа-яЁё\-ьъ]+(?:е|а|у|ом|ой|и|ы)?)(?=\s|$|[.,!?])/iu);
      if (cityMatch && cityMatch[1]) {
        newLocation = cityMatch[1].trim();
      } else {
        // Паттерн для фраз типа "где остановиться в [Город]" или "лучше остановиться в [Город]"
        const whereMatch = messageText.match(/(?:где|куда|лучше|остановиться|отель|отели|гостиница|гостиницы).*?(?:в|во|на|по)\s+([A-ZА-Я][a-zа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)(?=\s|$|[.,!?])/iu);
        if (whereMatch && whereMatch[1]) {
          newLocation = whereMatch[1].trim();
        } else {
          // Специальная обработка для "по [стране/региону]"
          const countryMatch = messageText.match(/(?:^|\s|🏨|✈️|🎯|🍽️|🏛️)(?:по|в|во|на)\s+([A-Za-zА-Яа-яЁё\-ьъ]+)/iu);
          if (countryMatch && countryMatch[1]) {
            newLocation = countryMatch[1].trim();
          } else {
            // Поиск известных городов в тексте (даже в разных падежах)
            const knownCities = [
              'Париж', 'Париже', 'Парижа', 'Парижу',
              'Москва', 'Москве', 'Москвы', 'Москву',
              'Лондон', 'Лондоне', 'Лондона', 'Лондону',
              'Рим', 'Риме', 'Рима', 'Риму',
              'Берлин', 'Берлине', 'Берлина', 'Берлину',
              'Амстердам', 'Амстердаме', 'Амстердама', 'Амстердаму',
              'Барселона', 'Барселоне', 'Барселоны', 'Барселону',
              'Мадрид', 'Мадриде', 'Мадрида', 'Мадриду',
              'Вена', 'Вене', 'Вены', 'Вену',
              'Прага', 'Праге', 'Праги', 'Прагу',
              'Венеция', 'Венеции', 'Венецию',
              'Флоренция', 'Флоренции', 'Флоренцию',
              'Милан', 'Милане', 'Милана', 'Милану',
              'Неаполь', 'Неаполе', 'Неаполя', 'Неаполю',
              'Санкт-Петербург', 'Санкт-Петербурге', 'Санкт-Петербурга', 'Санкт-Петербургу',
              'Сочи', 'Сочи', 'Сочи',
              'Казань', 'Казани', 'Казани', 'Казань'
            ];
            
            const lowerText = messageText.toLowerCase();
            for (const city of knownCities) {
              if (lowerText.includes(city.toLowerCase())) {
                newLocation = city;
                break;
              }
            }
            
            // Если не нашли известный город, ищем слова с заглавной буквы
            if (!newLocation) {
              const words = messageText.split(/\s+/);
              const skipWords = ['Я', 'Мы', 'Ты', 'Вы', 'Он', 'Она', 'Они', 'Это', 'В', 'На', 'Из', 'По', 'С', 'У', 'К', 'О', 'Об', 'Для', 'Про', 'И', 'А', 'Но', 'Да', 'Нет', 'Или', 'Если', 'Что', 'Как', 'Где', 'Когда', 'Почему', 'Зачем', 'Куда', 'Откуда', 'Где', 'Лучше', 'Остановиться', 'Отель', 'Отели'];
              const capitals = words.filter(w => {
                const cleanWord = w.replace(/[^A-Za-zА-Яа-яЁё\-]/g, '');
                return cleanWord.length > 2 && 
                       cleanWord[0] === cleanWord[0].toUpperCase() && 
                       !skipWords.includes(cleanWord) &&
                       !cleanWord.match(/^\d+$/);
              });
              if (capitals.length > 0) {
                // Берем последнее слово с заглавной буквы (скорее всего это город)
                newLocation = capitals[capitals.length - 1].replace(/[^A-Za-zА-Яа-яЁё\-]/g, '');
              } else {
                // Если не найдено слово с заглавной, взять последнее значимое слово
                const lastWord = words[words.length - 1].replace(/[^A-Za-zА-Яа-яЁё\-]/g, '');
                if (lastWord.length > 2 && !skipWords.includes(lastWord)) {
                  newLocation = lastWord[0].toUpperCase() + lastWord.slice(1).toLowerCase();
                }
              }
            }
          }
        }
      }
    }
    console.log('extractLocationFromText:', { messageText, newLocation, flightInfo });
    if (newLocation) {
      return normalizeLocation(newLocation);
    }
    return '';
  };

  // Автоматическое заполнение направления по тексту (для обновления фильтров)
  const autoFillLocation = (messageText: string) => {
    const extractedLocation = extractLocationFromText(messageText);
    if (extractedLocation) {
      console.log('Setting location filter to:', extractedLocation);
      setFilters((prev: FilterState) => ({ ...prev, location: extractedLocation }));
    } else {
      console.log('No location found in message text');
    }
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || inputText;
    if (!messageText.trim()) return;

    // Не отправлять, если последнее сообщение пользователя такое же
    const lastUserMessage = messages.filter(m => m.isUser).slice(-1)[0];
    if (lastUserMessage && lastUserMessage.text === messageText) {
      return;
    }
    // Не отправлять, если последнее сообщение ассистента — приветствие и последнее пользовательское совпадает с messageText
    if (
      messages.length >= 2 &&
      messages[messages.length - 2].role === 'assistant' &&
      messages[messages.length - 2].text.startsWith('Привет!') &&
      lastUserMessage &&
      lastUserMessage.text === messageText
    ) {
      return;
    }

    setHasInteracted(true);

    // 1. Автоматически подставлять направление "Куда едем" из текста запроса
    autoFillLocation(messageText);

    // 2. В фильтре выбрать даты подставлять текущую дату, если пользователь не указал дату в запросе
    if (!extractFlightInfo(messageText).date && dateFilter.type === 'specific') {
      const today = new Date();
      setDateFilter({ type: 'specific', startDate: today, endDate: undefined });
    }

    // 2.1. Если в сообщении есть даты, подставить их в фильтр
    const flightInfo = extractFlightInfo(messageText);
    if (flightInfo.date && flightInfo.returnDate) {
      const startDate = parseRussianDateToDate(flightInfo.date);
      const endDate = parseRussianDateToDate(flightInfo.returnDate);
      if (startDate && endDate) {
        setDateFilter({ type: 'specific', startDate, endDate });
      }
    }

    const newMessage: Message = {
      id: Date.now() + Math.random(),
      text: messageText,
      isUser: true,
      role: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Извлекаем информацию о перелете из сообщения пользователя
      const flightInfo = extractFlightInfo(messageText);
      let flightData = '';
      
      // Если найдена информация о перелете, получаем данные о рейсах через API
      if (flightInfo.origin && flightInfo.destination && flightInfo.date) {
        try {
          const formattedDate = parseRussianDate(flightInfo.date);
          const formattedReturnDate = flightInfo.returnDate ? parseRussianDate(flightInfo.returnDate) : undefined;
          
          // Получаем информацию о рейсах через хук useFlightInfo
          flightData = await getFlightInfoForGPT(
            flightInfo.origin,
            flightInfo.destination,
            formattedDate,
            formattedReturnDate,
            flightInfo.passengers.adults,
            flightInfo.passengers.children,
            flightInfo.passengers.infants,
            flightInfo.tripClass as 'Y' | 'C' // Явное приведение типа
          );

          // Добавляем дополнительный контекст для GPT
          flightData = `\n\n# ✈️ Информация о рейсах\n\n` +
                      `🔍 **Параметры поиска:**\n` +
                      `- Маршрут: ${flightInfo.origin} → ${flightInfo.destination}\n` +
                      `- Дата вылета: ${formattedDate}\n` +
                      (formattedReturnDate ? `- Дата возврата: ${formattedReturnDate}\n` : '') +
                      `- Пассажиры: ${flightInfo.passengers.adults} взр., ` +
                      `${flightInfo.passengers.children} дет., ` +
                      `${flightInfo.passengers.infants} мл.\n` +
                      `- Класс: ${flightInfo.tripClass === 'C' ? 'Бизнес' : 'Эконом'}\n\n` +
                      flightData;
        } catch (error) {
          console.error('Error fetching flight data:', error);
          flightData = '\n\nК сожалению, не удалось получить информацию о рейсах. ' +
                      'Пожалуйста, уточните параметры поиска или попробуйте позже.';
        }
      }

      // Формируем сообщения для GPT с контекстом о рейсах
      const messagesToSend = [
        {
          role: 'system',
          text: SYSTEM_PROMPT
        },
        ...messages.map(msg => ({
          role: msg.role || (msg.isUser ? 'user' : 'assistant'),
          text: msg.text
        })),
        {
          role: 'user',
          text: messageText + (flightData || '')
        }
      ];

      // Извлекаем локацию из текста напрямую, чтобы использовать актуальное значение
      const extractedLocation = extractLocationFromText(messageText);
      const destinationLocation = extractedLocation || filters.location || '';

      console.log('Sending messages to GPT:', JSON.stringify(messagesToSend, null, 2));
      console.log('Current filters:', JSON.stringify(filters, null, 2));
      console.log('Current dateFilter:', JSON.stringify(dateFilter, null, 2));
      console.log('Extracted location from text:', extractedLocation);
      console.log('Using destination:', destinationLocation);

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          filters: {
            destination: destinationLocation,
            dates: {
              start: dateFilter.type === 'specific' && dateFilter.startDate 
                ? dateFilter.startDate.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              end: dateFilter.type === 'specific' && dateFilter.endDate 
                ? dateFilter.endDate.toISOString().split('T')[0]
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            budget: {
              min: filters.budget.min,
              max: filters.budget.max
            },
            preferences: []
          }
        }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        const responseText = await response.text();
        console.log('Response text length:', responseText.length);
        console.log('Response text:', responseText);

        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }

        try {
          data = JSON.parse(responseText);
          console.log('Successfully parsed response data:', data);
        } catch (parseError) {
          console.error('Error parsing response JSON:', parseError);
          console.error('Response text that failed to parse:', responseText);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error reading response:', error);
        throw new Error('Failed to read server response');
      }

      if (!response.ok) {
        const errorMessage = data.error || 
          (data.details && typeof data.details === 'object' 
            ? data.details.message 
            : data.details) || 
          `Server error: ${response.status} ${response.statusText}`;
        console.error('API error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      if (!data.text) {
        console.error('Empty response data:', data);
        throw new Error('Empty response from GPT');
      }
      
      // Добавляем ответ от GPT
      const assistantMessage: Message = {
        id: Date.now() + Math.random(),
        text: data.text,
        isUser: false,
        role: 'assistant'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        id: Date.now() + Math.random(),
        text: error instanceof Error 
          ? `Извините, произошла ошибка: ${error.message}. Пожалуйста, попробуйте еще раз.`
          : 'Извините, произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.',
        isUser: false,
        role: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, getFlightInfoForGPT]);

  // Reset chat state when URL changes
  useEffect(() => {
    if (isFirstMount.current) {
      setMessages([{
        id: Date.now() + Math.random(),
        text: "Привет! 👋 Я помогу спланировать твое идеальное путешествие. Выбери интересующий вопрос или спроси меня о чем угодно, что связано с поездкой.",
        isUser: false,
        role: 'assistant'
      }]);
      setInputText('');
      setShowTripBuilder(false);
      setFilters({
        location: '',
        travelers: 2,
        children: 0,
        pets: 0,
        budget: {
          min: 0,
          max: 10000
        }
      });
      setDateFilter({ type: 'specific' });
      setHasInteracted(false);
      isFirstMount.current = false;
    }
  }, []);

  useEffect(() => {
    if (
      initialQuery &&
      messages.length === 1 &&
      lastSentText.current !== decodeURIComponent(initialQuery)
    ) {
      const textToSend = decodeURIComponent(initialQuery);
      
      // Parse dates from the query string
      const dateMatch = textToSend.match(/с (\d{2}\.\d{2}\.\d{4}) по (\d{2}\.\d{2}\.\d{4})/);
      if (dateMatch) {
        const [_, startDateStr, endDateStr] = dateMatch;
        const startDate = parseRussianDateToDate(startDateStr);
        const endDate = parseRussianDateToDate(endDateStr);
        if (startDate && endDate) {
          setDateFilter({
            type: 'specific',
            startDate,
            endDate
          });
        }
      }

      handleSendMessage(textToSend);
      lastSentText.current = textToSend;
    }
  }, [initialQuery, messages, handleSendMessage]);

  // Загрузка истории чатов при входе пользователя
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const history = await loadChatHistory();
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    };

    loadHistory();
  }, [user]);

  // Сохранение истории чатов при изменении сообщений
  useEffect(() => {
    const saveHistory = async () => {
      if (user && messages.length > 1) { // Не сохраняем, если только приветственное сообщение
        try {
          await saveChatHistory(messages);
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }
    };

    saveHistory();
  }, [messages, user]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setFilters((prev: FilterState) => ({ ...prev, location: newLocation }));
  };

  const handleTravelersChange = (increment: boolean) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      travelers: increment ? prev.travelers + 1 : Math.max(1, prev.travelers - 1)
    }));
  };

  const handleChildrenChange = (increment: boolean) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      children: increment ? prev.children + 1 : Math.max(0, prev.children - 1)
    }));
  };

  const handlePetsChange = (increment: boolean) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      pets: increment ? prev.pets + 1 : Math.max(0, prev.pets - 1)
    }));
  };

  const handleBudgetChange = (type: 'min' | 'max', value: number) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      budget: {
        ...prev.budget,
        [type]: value
      }
    }));
  };

  // Fix broken booking URLs by adding missing parameters
  const fixBookingUrl = (url: string): string => {
    console.log('[fixBookingUrl] Input URL:', url);
    
    if (!url || !url.includes('ostrovok.ru/hotel/')) {
      console.log('[fixBookingUrl] Not an ostrovok URL, returning as is');
      return url;
    }
    
    // If URL already has all params, return as is
    if (url.includes('partner_id=') && url.includes('check_in=') && url.includes('check_out=')) {
      console.log('[fixBookingUrl] URL already has all params, returning as is');
      return url;
    }
    
    // Extract hotel ID
    const match = url.match(/hotel\/(\d+)/);
    if (!match) {
      console.log('[fixBookingUrl] Could not extract hotel ID');
      return url;
    }
    
    const hotelId = match[1];
    const partnerId = '270392.affiliate.a0bd';
    const today = new Date();
    const checkIn = today.toISOString().split('T')[0];
    const checkOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Build correct URL
    const fixedUrl = `https://ostrovok.ru/hotel/${hotelId}/?partner_id=${encodeURIComponent(partnerId)}&check_in=${checkIn}&check_out=${checkOut}&guests=2`;
    console.log('[fixBookingUrl] Fixed URL:', fixedUrl);
    return fixedUrl;
  };

  // Check if URL is for a test hotel
  const isTestHotelUrl = (url: string): boolean => {
    return url.includes('hotel/1/') || url.includes('hotel/2/');
  };

  const formatMessage = (text: string): string => {
    if (!text) return '';
    
    // Debug: log the raw text
    console.log('[formatMessage] Raw text:', text.substring(0, 500));

    // First, fix any broken booking URLs in the raw text
    let fixedText = text.replace(
      /\[([^\]]*🛎️[^\]]*)\]\((https?:\/\/ostrovok\.ru\/hotel\/[^)]+)\)/g,
      (_, label, url) => {
        console.log('[formatMessage] Found booking link:', { label, url });
        const fixedUrl = fixBookingUrl(url);
        console.log('[formatMessage] Fixed link:', fixedUrl);
        return `[${label}](${fixedUrl})`;
      }
    );
    
    console.log('[formatMessage] Fixed text:', fixedText.substring(0, 500));

    // Process hotels into cards
    let processedText = fixedText;
    
    // Find hotel blocks - supports multiple formats:
    // Format 1: ### X. Hotel Name ⭐ (from API structured data)
    // Format 2: ## 🏨 Hotel "Name" ⭐⭐⭐ (from GPT generated content)
    const hotelBlockPattern = /((?:###\s*\d+\.\s*[^\n]+|##\s*🏨\s*[^\n]+)⭐[^\n]*\n[\s\S]*?(?=(?:###\s*\d+\.|##\s*🏨|##\s*Где остановиться|##\s*📅|---\s*\n|⚠️ \*\*ВАЖНО|$)))/g;
    
    processedText = processedText.replace(hotelBlockPattern, (blockMatch) => {
      const match = blockMatch; // Use match for processing
      // Process individual hotel block
      let hotelHtml = match
        // Format hotel image
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="hotel-image"><img src="$2" alt="$1" loading="lazy" /></div>')
        // Format hotel name header - support both formats
        .replace(/###\s*(\d+)\.\s*([^\n]+)/g, '<div class="hotel-header"><span class="hotel-number">$1</span><h4 class="hotel-name">$2</h4></div>')
        .replace(/##\s*🏨\s*([^\n]+)/g, (_, name) => {
          const cleanName = name.replace(/[""]/g, '').trim();
          return `<div class="hotel-header"><span class="hotel-number">🏨</span><h4 class="hotel-name">${cleanName}</h4></div>`;
        })
        // Format address, rating, price
        .replace(/-\s+\*\*Адрес:\*\*\s*([^\n]+)/g, '<div class="hotel-info"><span class="info-label">📍</span><span>$1</span></div>')
        .replace(/-\s+\*\*Рейтинг:\*\*\s*([^\n]+)/g, '<div class="hotel-info"><span class="info-label">⭐</span><span>$1</span></div>')
        .replace(/-\s+\*\*Цена:\*\*\s*([^\n]+)/g, '<div class="hotel-info price"><span class="info-label">💰</span><span>$1</span></div>')
        .replace(/-\s+\*\*До центра:\*\*\s*([^\n]+)/g, '<div class="hotel-info"><span class="info-label">🎯</span><span>$1</span></div>')
        // Format booking button
        .replace(/\[\s*🛎️\s*([^\]]+?)\s*\]\(\s*(https?:\/\/[^)]+)\)/g, (_, label, url) => {
          const fixedUrl = fixBookingUrl(url.trim());
          return `<a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" class="hotel-book-btn">🛎️ ${label.trim()}</a>`;
        })
        // Format description
        .replace(/-\s+\*\*Описание:\*\*\s*([^\n]+)/g, '<p class="hotel-desc">$1</p>')
        // Remove remaining markdown
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/---+/g, '');
      
      return `<div class="hotel-card">${hotelHtml}</div>`;
    });

    // Simple approach: find all hotel cards and wrap them together
    // Extract all hotel cards
    const hotelCardMatches = processedText.match(/<div class="hotel-card">[\s\S]*?<\/div>/g);
    
    let formattedText = processedText;
    
    if (hotelCardMatches && hotelCardMatches.length > 0) {
      // Remove all individual hotel cards from text
      formattedText = processedText.replace(/<div class="hotel-card">[\s\S]*?<\/div>/g, '');
      
      // Create grid with all cards
      const hotelGrid = `<div class="hotels-grid">${hotelCardMatches.join('')}</div>`;
      
      // Find a good place to insert: after "Где остановиться" header or at the end before warnings
      if (formattedText.includes('🏨 Где остановиться') || formattedText.includes('## 🏨') || formattedText.includes('## Где')) {
        // Insert after the first occurrence of hotel section header
        formattedText = formattedText.replace(
          /(<h[123][^>]*>(?:🏨\s*)?Где остановиться[^<]*<\/h[123]>|<h[123][^>]*>🏨[^<]*<\/h[123]>)/,
          '$1' + hotelGrid
        );
      } else {
        // Insert before warning or at the very end
        formattedText = formattedText.replace(
          /(⚠️ \*\*ВАЖНО|$)/,
          hotelGrid + '$1'
        );
      }
    }
    
    // Continue formatting
    formattedText = formattedText
      // Format images (non-hotel photos)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="w-full max-w-md rounded-xl shadow-lg object-cover aspect-video" loading="lazy" /></div>')
      
      // Format markdown links [text](url) - must be before other replacements
      // Handle booking button with emoji - capture full URL including & and =
      .replace(/\[\s*🛎️\s*([^\]]+?)\s*\]\(\s*(https?:\/\/[^)]+)\)/g, (_, label, url) => {
        console.log('[formatMessage] Processing button:', { label: label.trim(), url: url.trim() });
        const fixedUrl = fixBookingUrl(url.trim());
        console.log('[formatMessage] Button href:', fixedUrl);
        return `<div class="my-3"><a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"><span>🛎️</span><span>${label.trim()}</span></a></div>`;
      })
      
      // Handle other markdown links
      .replace(/\[([^\]]+?)\]\(\s*(https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">$1</a>')
      
      // Format headers with emojis
      .replace(/^(Day \d+:.*)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      
      // Format hotel names with stars and verification badges (for non-card hotels)
      .replace(/(?:🏨|🏰)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🏨</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      
      // Format location names with icons
      .replace(/(?:✈️|🛫)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">✈️</span><span class="font-medium">$1</span></div>')
      .replace(/(?:🍽️|🍴)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🍽️</span><span class="font-medium">$1</span></div>')
      .replace(/(?:🏛️|⛪)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🏛️</span><span class="font-medium">$1</span></div>')
      .replace(/(?:📍)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">📍</span><span class="font-medium">$1</span></div>')

      // Format section headers (## and ###)
      // Remove processed hotel headers (both formats)
      .replace(/^###\s*\d+\.\s*[^\n]+⭐[^\n]*/gm, '')
      .replace(/^##\s*🏨\s*[^\n]+⭐[^\n]*/gm, '')
      .replace(/^###\s+([^\n]+)/gm, '<h3 class="text-lg font-bold mt-6 mb-3 text-gray-900">$1</h3>')
      .replace(/^##\s+([^\n]+)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^#\s+([^\n]+)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')

      // Format horizontal rules
      .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')

      // Format bullet points with specific emojis
      .replace(/^-\s+\*\*([^:]+):\*\*\s*(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-gray-400 mt-1">•</span><div class="flex-1"><strong>$1:</strong> $2</div></div>')
      .replace(/^[•●-]\s+([^\n]+)/gm, '<div class="flex items-start gap-2 my-1"><span class="text-gray-400 mt-1">•</span><span class="flex-1">$1</span></div>')

      // Format time indicators
      .replace(/(?:⏰|🌞|🌅)\s+([^\n]+)/g, '<div class="flex items-center gap-2 mt-4 mb-2"><span class="text-xl">$1</span></div>')

      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Format paragraphs (simple version)
      .replace(/([^\n]+)/g, '<p class="my-2 leading-relaxed">$1</p>');

    return formattedText;
  };

  // Update the message rendering in the Chat component
  const renderMessage = (message: Message) => {
    if (message.isUser) {
      return (
        <div className="bg-black text-white rounded-[20px] rounded-br-[4px] px-4 py-3">
          <p className="text-[15px] font-medium leading-snug">{message.text}</p>
        </div>
      );
    }

    // Handle link clicks to fix broken booking URLs
    const handleMessageClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href.includes('ostrovok.ru/hotel/')) {
        console.log('[handleMessageClick] Link clicked:', link.href);
        
        // Check if it's a test hotel
        if (isTestHotelUrl(link.href)) {
          e.preventDefault();
          e.stopPropagation();
          alert('⚠️ Это тестовый отель (test_hotel / test_hotel_do_not_book).\n\nОн доступен только для API тестирования и не существует в публичной базе Ostrovok.\n\nДля реальных бронирований используйте реальные отели.\n\nСсылка: ' + link.href);
          return false;
        }
        
        const fixedUrl = fixBookingUrl(link.href);
        console.log('[handleMessageClick] Fixed URL:', fixedUrl);
        
        // Always prevent default and open fixed URL
        e.preventDefault();
        e.stopPropagation();
        
        // Add timestamp to bypass cache
        const urlWithCache = fixedUrl + '&_t=' + Date.now();
        console.log('[handleMessageClick] Opening URL:', urlWithCache);
        
        // Try different methods to open the link
        try {
          const newWindow = window.open(urlWithCache, '_blank', 'noopener,noreferrer');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocked, try location.assign
            console.log('[handleMessageClick] Popup blocked, using location.assign');
            window.location.assign(urlWithCache);
          }
        } catch (err) {
          console.error('[handleMessageClick] Error opening link:', err);
          // Fallback: create a temporary link and click it
          const tempLink = document.createElement('a');
          tempLink.href = urlWithCache;
          tempLink.target = '_blank';
          tempLink.rel = 'noopener noreferrer';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
        }
        
        return false;
      }
    };

    return (
      <div className="bg-gray-50 rounded-2xl rounded-bl-[4px] p-4" onClick={handleMessageClick}>
        <style>{`
          .hotels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            margin: 16px 0;
          }
          @media (min-width: 1024px) {
            .hotels-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          @media (min-width: 1280px) {
            .hotels-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .hotel-card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .hotel-card .hotel-image {
            width: 100%;
            height: 160px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 8px;
          }
          .hotel-card .hotel-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .hotel-card .hotel-header {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 4px;
          }
          .hotel-card .hotel-number {
            background: #000;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
          }
          .hotel-card .hotel-name {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.3;
            margin: 0;
            color: #111;
          }
          .hotel-card .hotel-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #4b5563;
          }
          .hotel-card .hotel-info.price {
            color: #059669;
            font-weight: 600;
          }
          .hotel-card .info-label {
            font-size: 16px;
          }
          .hotel-card .hotel-desc {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .hotel-card .hotel-book-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 16px;
            background: #000;
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            margin-top: auto;
            transition: background 0.2s;
          }
          .hotel-card .hotel-book-btn:hover {
            background: #374151;
          }
        `}</style>
        <div 
          className="prose prose-sm max-w-none text-gray-900"
          dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
        />
      </div>
    );
  };

  // Улучшенная функция извлечения информации о перелете
  const extractFlightInfo = (message: string) => {
    // Поиск города отправления
    const originPatterns = [
      /(?:из|от)\s+([A-Za-zА-Яа-я\s-]+)(?:\s+в|\s+до|\s+на|$)/i,
      /(?:вылет|отправление)\s+из\s+([A-Za-zА-Яа-я\s-]+)/i,
      /найди.*?(?:из|от)\s+([A-Za-zА-Яа-я\s-]+)/i
    ];
    
    // Поиск города назначения (улучшенные паттерны с учетом падежей)
    const destinationPatterns = [
      /(?:в|во|до|на|по)\s+([A-Za-zА-Яа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)(?=\s|$|[.,!?])/i,
      /прилет\s+в\s+([A-Za-zА-Яа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)/i,
      /найди.*?(?:в|до|на|по)\s+([A-Za-zА-Яа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)(?=\s|$|[.,!?])/i,
      /(?:где|куда|остановиться|отель|отели|гостиница|гостиницы)\s+(?:в|во|на|по|в)\s+([A-Za-zА-Яа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)/i,
      /(?:🏨|✈️|🎯|🍽️|🏛️).*?(?:в|во|на|по)\s+([A-Za-zА-Яа-яё\-]+(?:е|а|у|ом|ой|и|ы)?)/i
    ];

    // Поиск даты
    const datePatterns = [
      /(?:на|)\s+(\d{1,2}(?:\s+|\.)\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+\d{4})?)/i,
      /(\d{1,2}\.\d{1,2}(?:\.\d{4})?)/,
      /(\d{4}-\d{2}-\d{2})/
    ];

    // Поиск обратной даты
    const returnDatePatterns = [
      /обратно\s+(\d{1,2}(?:\s+|\.)\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+\d{4})?)/i,
      /назад\s+(\d{1,2}\.\d{1,2}(?:\.\d{4})?)/i,
      /вернуться\s+(\d{1,2}\.\d{1,2}(?:\.\d{4})?)/i
    ];

    // Поиск количества пассажиров
    const passengersPattern = /(\d+)\s*(?:взрослых|пассажиров?|человек|чел)?/i;
    const childrenPattern = /(\d+)\s*(?:реб[её]нка|детей|дет)/i;
    const infantsPattern = /(\d+)\s*(?:младенц[а-я]{1,2}|груднич[к-я]{2,3})/i;

    // Поиск класса обслуживания
    const businessClassPatterns = [
      /бизнес[-\s]класс/i,
      /business[-\s]class/i
    ];

    // Извлечение данных
    const origin = originPatterns.map(pattern => message.match(pattern)?.[1]?.trim()).find(Boolean);
    const destination = destinationPatterns
      .map(pattern => {
        const match = message.match(pattern);
        return match ? match[1].trim() : null;
      })
      .find(Boolean);
    const dateMatch = datePatterns.map(pattern => message.match(pattern)?.[1]).find(Boolean);
    const returnDateMatch = returnDatePatterns.map(pattern => message.match(pattern)?.[1]).find(Boolean);
    
    const passengers = {
      adults: parseInt(message.match(passengersPattern)?.[1] || '1'),
      children: parseInt(message.match(childrenPattern)?.[1] || '0'),
      infants: parseInt(message.match(infantsPattern)?.[1] || '0')
    };

    const hasBusiness = businessClassPatterns.some(pattern => pattern.test(message));
    const tripClass = hasBusiness ? 'C' : 'Y';

    // Проверка на наличие обратного билета
    const isRoundTrip = message.toLowerCase().includes('обратно') || 
                       message.toLowerCase().includes('туда и обратно') ||
                       !!returnDateMatch;

    return {
      origin,
      destination,
      date: dateMatch,
      returnDate: returnDateMatch,
      passengers,
      tripClass,
      isRoundTrip
    };
  };

  // Улучшенная функция парсинга русской даты
  const parseRussianDate = (dateStr: string) => {
    if (!dateStr) return '';

    // Если дата уже в формате YYYY-MM-DD
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
      return dateStr;
    }

    // Если дата в формате DD.MM.YYYY
    if (dateStr.match(/^[0-9]{1,2}\.[0-9]{1,2}(?:\.[0-9]{4})?$/)) {
      const [day, month, year = new Date().getFullYear()] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const months: Record<string, number> = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
      'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3,
      'май': 4, 'июн': 5, 'июл': 6, 'авг': 7,
      'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
    };

    // Парсинг даты в формате "DD месяц YYYY" или "DD месяц"
    const match = dateStr.toLowerCase().match(/(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?/);
    if (match) {
      const [_, day, monthStr, year = new Date().getFullYear()] = match;
      const month = months[monthStr];
      if (month === undefined) {
        console.error('Неверный формат месяца:', monthStr);
        return '';
      }
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }

    return '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add new function to generate itinerary based on duration
  const generateItinerary = (location: string, duration: number) => {
    const message = `
День 1: Прибытие и знакомство с городом
✈️ Аэропорт(airport) — прибытие в ${location}
🏨 Отель(hotel) — заселение и отдых
🍽️ Ресторан(restaurant) — обед в местном ресторане
🎯 Обзорная экскурсия(attraction) — первое знакомство с городом

${Array.from({ length: duration - 2 }, (_, i) => `
День ${i + 2}: Исследование города
🏛️ Музей(museum) — утренний осмотр экспозиции
🍽️ Кафе(cafe) — обед в уютном месте
🏰 Достопримечательность(attraction) — послеобеденная экскурсия
🌳 Парк(park) — вечерняя прогулка`).join('\n')}

День ${duration}: Завершение путешествия
☕ Кафе(cafe) — завтрак
🎯 Сувенирные магазины(attraction) — покупка подарков
🍽️ Ресторан(restaurant) — прощальный обед
✈️ Аэропорт(airport) — вылет домой`;

    setCurrentMessage(message);
    setShowTripBuilder(true);
  };

  // Update duration change handler
  const handleDurationChange = (value: number) => {
    setDateFilter({
      type: 'duration',
      duration: value
    });
    
    // Generate itinerary if location is set
    if (filters.location) {
      generateItinerary(filters.location, value);
    }
  };

  // Update location change handler
  const handleTripGenClick = () => {
    if (dateFilter.type === 'duration' && dateFilter.duration && filters.location) {
      generateItinerary(filters.location, dateFilter.duration);
    } else {
      setShowTripBuilder(true);
    }
  };

  // Function to format date filter display
  const getDateFilterDisplay = () => {
    switch (dateFilter.type) {
      case 'specific':
        if (dateFilter.startDate && dateFilter.endDate) {
          return `${format(dateFilter.startDate, 'dd.MM.yyyy')} - ${format(dateFilter.endDate, 'dd.MM.yyyy')}`;
        }
        if (dateFilter.startDate) {
          return format(dateFilter.startDate, 'dd.MM.yyyy');
        }
        return 'Выберите даты';
      case 'duration':
        return dateFilter.duration ? `${dateFilter.duration} дней` : 'Укажите длительность';
      case 'month':
        if (dateFilter.month) {
          return format(new Date(dateFilter.month.year, dateFilter.month.month), 'LLLL yyyy', { locale: ru });
        }
        return 'Выберите месяц';
      default:
        return 'Когда';
    }
  };

  // Function to handle month selection
  const handleMonthSelection = (month: number, year: number) => {
    setDateFilter({
      type: 'month',
      month: { month, year }
    });
  };

  // Add this function to generate itinerary from recommendations
  const generateItineraryFromRecommendations = (text: string) => {
    const places: { [key: string]: string[] } = {
      attractions: [],
      restaurants: [],
      hotels: []
    };

    // Extract places from different sections
    const sections = text.split('#');
    sections.forEach(section => {
      if (section.includes('🎯 Рекомендации') || section.includes('🏨 Главные достопримечательности')) {
        const matches = section.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of matches) {
          places.attractions.push(`🎯 ${match[1]}(${match[2]}) — Интересная достопримечательность`);
        }
      }
      if (section.includes('🍽️ Где поесть')) {
        const matches = section.matchAll(/\[([^\]]+)\]\(restaurant\)|🍽️\s+([^—]+)/g);
        for (const match of matches) {
          const name = match[1] || match[2];
          if (name) places.restaurants.push(`🍽️ ${name.trim()}(restaurant) — Отличное место для обеда`);
        }
      }
      if (section.includes('🏨 Где остановиться')) {
        const matches = section.matchAll(/\[([^\]]+)\]\(hotel\)|🏨\s+([^—]+)/g);
        for (const match of matches) {
          const name = match[1] || match[2];
          if (name) places.hotels.push(`🏨 ${name.trim()}(hotel) — Комфортное размещение`);
        }
      }
    });

    // Create 3-day itinerary
    const itinerary = `
День 1: Прибытие и знакомство с городом
✈️ Аэропорт(airport) — Прибытие в ${filters.location}
${places.hotels[0] || '🏨 Отель(hotel) — Заселение и отдых'}
${places.restaurants[0] || '🍽️ Ресторан(restaurant) — Обед в местном ресторане'}
${places.attractions[0] || '🎯 Обзорная экскурсия(attraction) — Первое знакомство с городом'}

День 2: Исследование достопримечательностей
${places.attractions[1] || '🏛️ Музей(museum) — Утренний осмотр экспозиции'}
${places.restaurants[1] || '🍽️ Кафе(cafe) — Обед в уютном месте'}
${places.attractions[2] || '🏰 Достопримечательность(attraction) — Послеобеденная экскурсия'}
${places.attractions[3] || '🌳 Парк(park) — Вечерняя прогулка'}

День 3: Завершение путешествия
${places.attractions[4] || '☕ Кафе(cafe) — Завтрак'}
${places.attractions[5] || '🎯 Сувенирные магазины(attraction) — Покупка подарков'}
${places.restaurants[2] || '🍽️ Ресторан(restaurant) — Прощальный обед'}
✈️ Аэропорт(airport) — Вылет домой`;

    return itinerary;
  };

  useEffect(() => {
    // Add the createRoute function to the window object
    (window as any).createRoute = () => {
      const lastAssistantMessage = messages.find((m: Message) => !m.isUser && m.role === 'assistant');
      if (lastAssistantMessage) {
        const itinerary = generateItineraryFromRecommendations(lastAssistantMessage.text);
        setCurrentMessage(itinerary);
        setShowTripBuilder(true);
      }
    };

    return () => {
      delete (window as any).createRoute;
    };
  }, [messages, filters.location]);

  // Обновляем обработчик выбора вопроса
  const handleSelectQuestion = (text: string) => {
    handleSendMessage(text);
  };

  // Заглушка для сохранения маршрута
  const handleSaveRoute = (_message: Message) => {
    // TODO: Реализовать сохранение маршрута
    alert('Маршрут сохранён!');
  };

  // Сброс чата при нажатии 'Новый чат' в сайдбаре
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam) {
      setMessages([
        {
          id: Date.now() + Math.random(),
          text: "Привет! 👋 Я помогу спланировать твое идеальное путешествие. Выбери интересующий вопрос или спроси меня о чем угодно, что связано с поездкой.",
          isUser: false,
          role: 'assistant'
        }
      ]);
      setInputText('');
      setShowTripBuilder(false);
      setFilters({
        location: '',
        travelers: 2,
        children: 0,
        pets: 0,
        budget: {
          min: 0,
          max: 10000
        }
      });
      setDateFilter({ type: 'specific' });
      setHasInteracted(false);
    }
  }, [searchParams.get('new')]);

  return (
    <div className={`h-full flex flex-col bg-white transition-all duration-300 w-full ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
      <div className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 flex flex-col min-h-0">
          {/* Top Navigation */}
          <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 md:sticky md:z-10 ${mobileOpen ? 'hidden' : ''} w-full`}>
            <div className="max-w-3xl md:max-w-4xl md:ml-12 md:mr-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Mobile Navigation */}
                <div className="flex items-center gap-2 md:hidden">
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-black hover:bg-gray-100 transition-colors"
                    aria-label="Открыть меню"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Фильтры</span>
                  </button>
                  <button
                    onClick={() => setShowTripBuilder(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
                  >
                    <img src={AILogo} alt="TripGen" className="w-5 h-5" />
                    <span>Маршрут</span>
                  </button>
                </div>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                  <ChatFilters
                    filters={filters}
                    setFilters={setFilters}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    handleLocationChange={handleLocationChange}
                    handleTravelersChange={handleTravelersChange}
                    handleChildrenChange={handleChildrenChange}
                    handlePetsChange={handlePetsChange}
                    handleBudgetChange={handleBudgetChange}
                    handleDurationChange={handleDurationChange}
                    handleMonthSelection={handleMonthSelection}
                    getDateFilterDisplay={getDateFilterDisplay}
                  />
                  <button
                    onClick={handleTripGenClick}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
                  >
                    <img src={AILogo} alt="TripGen" className="w-6 h-6" />
                    <span>TRIPGEN МАРШРУТ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 pt-[56px] pb-0 md:pt-0 md:pb-0 w-full">
            <div className="flex-1 p-6 overflow-y-auto pb-32 md:pb-24 w-full">
              <div className="max-w-3xl md:max-w-4xl md:ml-12 md:mr-auto space-y-6">
                {/* Показываем приветственное сообщение и подсказки до взаимодействия */}
                {!hasInteracted && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start items-end gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src={AILogo2} 
                            alt="TRIPGEN Assistant" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="max-w-[85%] w-full overflow-hidden">
                        <div className="bg-gray-50 rounded-2xl rounded-bl-[4px] p-4">
                          <div className="prose prose-sm max-w-none text-gray-900">
                            {messages[0].text}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <SuggestedQuestions onSelectQuestion={handleSelectQuestion} />
                    </motion.div>
                  </>
                )}
                
                {/* Показываем остальные сообщения только после взаимодействия */}
                {hasInteracted && messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-3`}
                  >
                    {!message.isUser && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src={AILogo2} 
                            alt="TRIPGEN Assistant" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div 
                      className={`
                        ${message.isUser ? 'items-end' : 'items-start'}
                        ${message.isUser ? 'max-w-[320px]' : 'max-w-[95%] md:max-w-3xl'}
                        w-full overflow-hidden
                      `}
                    >
                      {renderMessage(message)}
                      {/* Кнопка 'Сохранить маршрут' только для ассистента, не для приветственного сообщения и только на десктопе */}
                      {!message.isUser && message.id !== messages[0].id && (
                        <div className="mt-3 flex md:justify-end justify-center">
                          <button
                            className="hidden md:flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors shadow"
                            onClick={() => handleSaveRoute(message)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z"/></svg>
                            <span>Сохранить маршрут</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          
          {/* Chat Input (fixed on mobile, static on desktop) */}
          <div className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4">
            <div className="max-w-3xl md:max-w-4xl md:ml-12 md:mr-auto">
              <div className="w-full flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Напишите ваш вопрос..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputText.trim()}
                  className="shrink-0 w-11 h-11 flex items-center justify-center bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showTripBuilder && (
          <TripBuilder
            message={currentMessage}
            duration={dateFilter.type === 'duration' ? `${dateFilter.duration} days` : 'Custom dates'}
            travelers={filters.travelers}
            onClose={() => setShowTripBuilder(false)}
          />
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Модальное окно фильтров для мобильных */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm md:hidden">
          <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-5 animate-fade-in-up">
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setShowMobileFilters(false)}
              aria-label="Закрыть фильтры"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Фильтры</h2>
            <ChatFilters
              filters={filters}
              setFilters={setFilters}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              handleLocationChange={handleLocationChange}
              handleTravelersChange={handleTravelersChange}
              handleChildrenChange={handleChildrenChange}
              handlePetsChange={handlePetsChange}
              handleBudgetChange={handleBudgetChange}
              handleDurationChange={handleDurationChange}
              handleMonthSelection={handleMonthSelection}
              getDateFilterDisplay={getDateFilterDisplay}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
