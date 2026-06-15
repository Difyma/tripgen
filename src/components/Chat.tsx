import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  MapPin, 
  Users,
  Calendar as CalendarIcon,
  RussianRuble,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AuthModal } from './AuthModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
const AILogo = '/images/TRIPGEN_logo_white.png';
const AILogo2 = '/images/TRIPGEN_logo_2.png';
import TripBuilder from './TripBuilder';
import { useFlightInfo } from '../hooks/useFlightInfo';
import {
  buildHotelPageLink,
  buildSerpLink,
  looksLikeHid,
  getRegionIdForCityName,
  rewriteOstrovokHybridHotelPathToSerp,
  rewriteOstrovokHotelPathToRooms,
  normalizeHotelPreviewImageUrl,
  etgHotelImageOptionsFromImportMeta,
  DEFAULT_ETG_IMAGE_PREVIEW_SIZE,
} from '@/lib/ostrovok';
import { HotelCard } from './HotelCard';
import { 
  getUserChats,
  getSafeAuthSession,
  createChat,
  getChatMessages,
  addChatMessage,
  generateChatTitle,
  type Chat,
  type ChatMessageDB
} from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import creatorChatApi from '../services/creatorChatApi';

interface AssistantHotel {
  id: string;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  price: number;
  currency: string;
  images?: { category: string; url: string }[];
  bookingUrl?: string;
  distanceToCenter?: number;
  taxesAndFees?: string;
  mealType?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  checkInTime?: string;
  checkOutTime?: string;
  metapolicyHighlights?: string[];
  roomName?: string;
  roomAmenities?: string[];
  amenities?: string[];
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  role?: 'system' | 'user' | 'assistant';
  showCreateRoute?: boolean;
  hotels?: AssistantHotel[];
  /** Структурированный маршрут по дням из JSON-ответа AI (для TripBuilder) */
  itinerary?: import('../types/tripPlan').TripPlanDay[];
}

type StoredAssistantMeta = {
  hotels?: AssistantHotel[];
  itinerary?: import('../types/tripPlan').TripPlanDay[];
};

const STORED_META_PREFIX = '<!--TRIPGEN_META_B64:';
const STORED_META_SUFFIX = '-->';

function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64Utf8(input: string): string {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function packStoredAssistantMessage(content: string, meta?: StoredAssistantMeta): string {
  const hasHotels = Array.isArray(meta?.hotels) && meta.hotels.length > 0;
  const hasItinerary = Array.isArray(meta?.itinerary) && meta.itinerary.length > 0;
  if (!hasHotels && !hasItinerary) return content;
  try {
    const payload = JSON.stringify({
      hotels: hasHotels ? meta?.hotels : undefined,
      itinerary: hasItinerary ? meta?.itinerary : undefined
    });
    return `${content}\n${STORED_META_PREFIX}${toBase64Utf8(payload)}${STORED_META_SUFFIX}`;
  } catch {
    return content;
  }
}

function unpackStoredAssistantMessage(content: string): { text: string; meta?: StoredAssistantMeta } {
  if (!content) return { text: '' };
  const re = /\n?<!--TRIPGEN_META_B64:([A-Za-z0-9+/=]+)-->$/;
  const match = content.match(re);
  if (!match?.[1]) return { text: content };
  const text = content.replace(re, '').trimEnd();
  try {
    const parsed = JSON.parse(fromBase64Utf8(match[1])) as StoredAssistantMeta;
    const hotels = Array.isArray(parsed?.hotels) ? parsed.hotels : undefined;
    const itinerary = Array.isArray(parsed?.itinerary) ? parsed.itinerary : undefined;
    return { text, meta: { hotels, itinerary } };
  } catch {
    return { text };
  }
}

const OSTROVOK_PARTNER_SLUG =
  import.meta.env.VITE_OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';
const CERT_MODE = import.meta.env.VITE_CERT_MODE || 'real';
const FORCE_TEST_HOTELS = CERT_MODE === 'test_hotels';
const WELCOME_MESSAGE_TEXT =
  "Привет! 👋 Я помогу спланировать твое идеальное путешествие. Выбери интересующий вопрос или спроси меня о чем угодно, что связано с поездкой.";
const AI_PROGRESS_STEPS = [
  'Анализирую запрос',
  'Собираю данные по направлению',
  'Формирую рекомендации',
  'Проверяю детали маршрута',
  'Готовлю финальный ответ',
] as const;

interface FilterState {
  location: string;
  travelers: number;
  children: number;
  childrenAges: number[];
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

⚠️⚠️⚠️ КРИТИЧЕСКИ ВАЖНО — ПРАВИЛА ССЫЛОК НА ОТЕЛИ:
1. Используй ТОЛЬКО ссылки из поля bookingUrl в предоставленных данных отелей
2. НИКОГДА не генерируй ссылки на отели самостоятельно — не придумывай URL!
3. Если bookingUrl отсутствует или пустой — не показывай кнопку бронирования вообще
4. Не используй формат https://ostrovok.ru/hotel/{id}/ — это неправильный формат
5. Правильные ссылки содержат partner_slug и utm_medium=partners
6. Если нет bookingUrl в данных — напиши "Бронирование недоступно" или предложи поискать отели на Ostrovok.ru самостоятельно

ПРАВИЛА ССЫЛОК НА РЕКОМЕНДОВАННЫЕ МЕСТА:
1. Для ключевых рекомендаций (достопримечательности, музеи, парки, рестораны) добавляй кликабельную ссылку
2. Формат: [Название места](https://www.google.com/maps/search/?api=1&query=НАЗВАНИЕ+МЕСТА+ГОРОД)
3. Добавляй ссылки только для реально упомянутых в ответе мест, без выдумывания несуществующих объектов
4. Для каждого дня достаточно 2-4 ссылок на главные точки маршрута, не перегружай ответ
5. Не подменяй и не генерируй bookingUrl для отелей — правило выше остаётся приоритетным

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
const SuggestedQuestions = ({ onSelectQuestion, isCreatorChat }: { onSelectQuestion: (text: string) => void; isCreatorChat?: boolean }) => {
  // Не показываем популярные вопросы в чатах с организаторами
  if (isCreatorChat) return null;
  
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
  handleChildAgeChange,
  handlePetsChange,
  handleBudgetChange,
  handleDurationChange,
  handleMonthSelection,
  getDateFilterDisplay
}: any) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full min-w-0">
      {/* Location Filter */}
      <div className="relative flex-1 min-w-0 md:min-w-[200px]">
        <input
          type="text"
          placeholder="Куда едем"
          value={filters.location}
          onChange={handleLocationChange}
          className="w-full min-w-0 pl-8 pr-3 h-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 placeholder:text-gray-400"
        />
        <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
      </div>
      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 min-w-0 md:min-w-[200px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
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
          <button className="flex-1 min-w-0 md:min-w-[160px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
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
                <div className="text-sm text-gray-500">0-17 лет</div>
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
            {filters.children > 0 && (
              <div className="space-y-2">
                {Array.from({ length: filters.children }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-700">Возраст ребенка {idx + 1}</div>
                    <select
                      value={filters.childrenAges[idx] ?? 0}
                      onChange={(e) => handleChildAgeChange(idx, Number(e.target.value))}
                      className="h-8 border border-gray-200 rounded-md px-2 text-sm"
                    >
                      {Array.from({ length: 18 }).map((__, age) => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
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
          <button className="flex-1 min-w-0 md:min-w-[160px] h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50 text-left relative">
            <RussianRuble className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2 flex-shrink-0" />
            <span className="block truncate mt-[7px] min-w-0" title={`${filters.budget.min}₽ - ${filters.budget.max}₽`}>
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
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  // Ленивая инициализация messages - проверяем URL параметры
  const [messages, setMessages] = useState<Message[]>(() => {
    const params = new URLSearchParams(location.search);
    const hasChatId = params.get('chat');
    const creatorChatId = params.get('creatorChat');
    const creatorId = params.get('creatorId');
    
    // Если есть параметры чата - начинаем с пустого массива (история загрузится)
    if (hasChatId || creatorChatId || creatorId) {
      return [];
    }
    
    // Иначе - приветственное сообщение
    return [{
      id: Date.now() + Math.random(),
      text: WELCOME_MESSAGE_TEXT,
      isUser: false,
      role: 'assistant'
    }];
  });
  
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    travelers: 2,
    children: 0,
    childrenAges: [],
    pets: 0,
    budget: {
      min: 0,
      max: 10000
    }
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [currentItinerary, setCurrentItinerary] = useState<import('../types/tripPlan').TripPlanDay[] | null>(null);
  const [showTripBuilder, setShowTripBuilder] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'specific' });
  const { getFlightInfoForGPT } = useFlightInfo();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const isFirstMount = useRef(true);
  const lastSentText = useRef<string | null>(null);
  
  // Creator chat state (для чатов с организаторами туров)
  const [creatorChatId, setCreatorChatId] = useState<string | null>(null);
  const [isCreatorChat, setIsCreatorChat] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAiProgressStep(0);
      return;
    }
    const maxAutoStep = AI_PROGRESS_STEPS.length - 2;
    const id = setInterval(() => {
      setAiProgressStep(prev => (prev < maxAutoStep ? prev + 1 : prev));
    }, 1300);
    return () => clearInterval(id);
  }, [isLoading]);

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

  const extractDurationDaysFromText = (text: string): number | undefined => {
    if (!text) return undefined;
    const match = text
      .toLowerCase()
      .match(/(?:^|\s)(\d{1,2})\s*(?:дн(?:я|ей)?|дня|дней|д\.?|day|days)(?:\s|$)/i);
    if (!match?.[1]) return undefined;
    const days = Number(match[1]);
    if (!Number.isFinite(days) || days <= 0) return undefined;
    return Math.min(30, Math.round(days));
  };

  const resolveDateRangeForRequest = (value: DateFilter, durationOverride?: number) => {
    const toIso = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const diffDays = (start: Date, end: Date) =>
      Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const baseStart = value.startDate ? new Date(value.startDate) : new Date();
    const safeDuration = Math.max(1, durationOverride || value.duration || 7);

    if (value.type === 'specific') {
      const start = value.startDate ? new Date(value.startDate) : new Date();
      const hasEnd = Boolean(value.endDate);
      const endCandidate = hasEnd ? new Date(value.endDate as Date) : addDays(start, safeDuration);
      const end = endCandidate.getTime() > start.getTime() ? endCandidate : addDays(start, safeDuration);
      const durationDays = hasEnd && endCandidate.getTime() > start.getTime() ? diffDays(start, endCandidate) : safeDuration;
      return { startIso: toIso(start), endIso: toIso(end), durationDays };
    }

    if (value.type === 'duration') {
      const start = baseStart;
      const end = addDays(start, safeDuration);
      return { startIso: toIso(start), endIso: toIso(end), durationDays: safeDuration };
    }

    if (value.type === 'month' && value.month) {
      const start = new Date(value.month.year, value.month.month, 1);
      const end = new Date(value.month.year, value.month.month + 1, 1);
      const durationDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      );
      return { startIso: toIso(start), endIso: toIso(end), durationDays };
    }

    const start = new Date();
    const end = addDays(start, safeDuration);
    return { startIso: toIso(start), endIso: toIso(end), durationDays: safeDuration };
  };

  // Автоматическое заполнение направления по тексту
  // Возвращает найденную локацию для использования в запросе
  const extractLocationFromText = (messageText: string): string => {
    const invalidLocationWords = new Set([
      'день', 'дня', 'дней', 'сутки', 'суток', 'неделя', 'недели', 'недель', 'месяц', 'месяца', 'месяцев',
      'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      'сегодня', 'завтра', 'послезавтра'
    ]);
    const sanitizeLocationCandidate = (value: string): string => {
      const trimmed = value.trim().replace(/[.,!?;:]+$/g, '');
      if (!trimmed) return '';
      const lowered = trimmed.toLowerCase();
      if (invalidLocationWords.has(lowered)) return '';
      // Drop obviously non-destination short fragments / pure numbers
      if (/^\d+$/.test(trimmed) || trimmed.length < 2) return '';
      return trimmed;
    };
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
    // Location extraction debug removed
    if (newLocation) {
      const normalized = normalizeLocation(newLocation);
      return sanitizeLocationCandidate(normalized);
    }
    return '';
  };

  // Автоматическое заполнение направления по тексту (для обновления фильтров)
  const autoFillLocation = (messageText: string) => {
    const extractedLocation = extractLocationFromText(messageText);
    if (extractedLocation) {
      // Location filter updated
      setFilters((prev: FilterState) => ({ ...prev, location: extractedLocation }));
    } else {
      console.log('No location found in message text');
    }
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || inputText;
    if (!messageText.trim()) return;
    const durationDaysFromMessage = extractDurationDaysFromText(messageText);
    const flightInfoFromMessage = extractFlightInfo(messageText);
    if (filters.children > 0) {
      const validAges = filters.childrenAges.filter((age) => Number.isFinite(age) && age >= 0 && age <= 17);
      if (validAges.length !== filters.children) {
        const errorText = 'Укажите точный возраст каждого ребенка (0-17), чтобы выполнить поиск отелей.';
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text: errorText, isUser: false, role: 'assistant' }]);
        return;
      }
    }

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

    let effectiveDateFilterForRequest: DateFilter = dateFilter;

    // 2. В фильтре подставлять текущую дату только если пользователь не задал даты вообще
    if (
      !durationDaysFromMessage &&
      !flightInfoFromMessage.date &&
      dateFilter.type === 'specific' &&
      !dateFilter.startDate &&
      !dateFilter.endDate
    ) {
      const today = new Date();
      effectiveDateFilterForRequest = { type: 'specific', startDate: today, endDate: undefined };
      setDateFilter(effectiveDateFilterForRequest);
    }

    // 2.1. Если в сообщении есть даты, подставить их в фильтр
    const parsedChildrenAges = extractChildrenAgesFromText(messageText);
    if (parsedChildrenAges.length > 0) {
      setFilters((prev: FilterState) => ({
        ...prev,
        children: parsedChildrenAges.length,
        childrenAges: parsedChildrenAges,
      }));
    }
    if (flightInfoFromMessage.date && flightInfoFromMessage.returnDate) {
      const startDate = parseRussianDateToDate(flightInfoFromMessage.date);
      const endDate = parseRussianDateToDate(flightInfoFromMessage.returnDate);
      if (startDate && endDate) {
        effectiveDateFilterForRequest = { type: 'specific', startDate, endDate };
        setDateFilter(effectiveDateFilterForRequest);
      }
    } else if (durationDaysFromMessage) {
      const hasExplicitSpecificRange =
        effectiveDateFilterForRequest.type === 'specific' &&
        Boolean(effectiveDateFilterForRequest.startDate) &&
        Boolean(effectiveDateFilterForRequest.endDate);
      if (!hasExplicitSpecificRange) {
        effectiveDateFilterForRequest = {
          type: 'duration',
          duration: durationDaysFromMessage,
          startDate: effectiveDateFilterForRequest.startDate || new Date(),
        };
        setDateFilter(effectiveDateFilterForRequest);
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

    // Создаём новый чат при первом сообщении
    let chatId = currentChatId;

    // Если пришли по кнопке "Задать вопрос" с детальной страницы тура,
    // форсируем создание отдельного нового чата тура
    const params = new URLSearchParams(location.search);
    const isNewTourChat = params.get('newTour') === '1';
    if (isNewTourChat) {
      chatId = null;
    }

    if (!chatId && user) {
      chatId = await startNewChat(messageText);
    }

    // Сохраняем сообщение пользователя
    if (chatId && user) {
      await saveMessageToCurrentChat(chatId, 'user', messageText);
    }

    // Если это чат с создателем тура - отправляем напрямую через WebSocket
    if (isCreatorChat && creatorChatId && user) {
      try {
        // Сообщение пользователя уже добавлено в UI выше (newMessage)
        // Отправляем через WebSocket
        await creatorChatApi.sendMessage(creatorChatId, messageText);
        // Ответ от организатора придёт через onMessage подписку
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('Error sending message to creator:', err);
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          text: 'Не удалось отправить сообщение организатору. Проверьте подключение и попробуйте снова.',
          isUser: false,
          role: 'assistant'
        }]);
        setIsLoading(false);
        return;
      }
    }

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

      const requestDateRange = resolveDateRangeForRequest(
        effectiveDateFilterForRequest,
        durationDaysFromMessage
      );

      // Показываем отдельный прогресс выполнения, а ответ выводим только после полной готовности
      const streamMessageId = Date.now() + Math.random();
      setStreamingMessageId(streamMessageId);
      setAiProgressStep(1);

      const configuredApiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      // Когда VITE_API_URL не задан, используем относительный путь и Vite proxy.
      const apiBase = configuredApiBase;
      const currentSession = await getSafeAuthSession();
      const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentSession?.access_token) {
        requestHeaders['Authorization'] = `Bearer ${currentSession.access_token}`;
      }
      const response = await fetch(`${apiBase}/api/openai`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          messages: messagesToSend,
          // Не показываем частичный текст — только готовый финальный ответ.
          stream: false,
          filters: {
            destination: destinationLocation,
            dates: {
              start: requestDateRange.startIso,
              end: requestDateRange.endIso
            },
            durationDays: requestDateRange.durationDays,
            budget: {
              min: filters.budget.min,
              max: filters.budget.max
            },
            travelers: filters.travelers,
            children: filters.children,
            childrenAges: filters.childrenAges,
            preferences: []
          }
        }),
      });

      const contentType = response.headers.get('Content-Type') || '';
      const isStream = contentType.includes('text/event-stream');
      setAiProgressStep(2);

      if (!response.ok && !isStream) {
        // В проде ответ может быть не JSON (HTML/текст), поэтому читаем body один раз
        const responseText = await response.text().catch(() => '');
        let errData: any = {};

        try {
          if (responseText) {
            errData = JSON.parse(responseText);
          }
        } catch {
          // ignore JSON parse errors
        }

        const errorMessage =
          errData?.error ||
          errData?.message ||
          responseText?.trim() ||
          `Server error: ${response.status}`;

        // Чтобы было проще дебажить продовые 500
        console.error('OpenAI proxy error:', {
          status: response.status,
          contentType,
          responseText: responseText?.slice(0, 500),
          parsed: errData,
        });

        throw new Error(errorMessage);
      }

      if (isStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let hotelsFromStream: AssistantHotel[] | undefined;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let lineEnd = buffer.indexOf('\n');
            while (lineEnd !== -1) {
              const line = buffer.slice(0, lineEnd).trim();
              buffer = buffer.slice(lineEnd + 1);
              lineEnd = buffer.indexOf('\n');

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '' || data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'hotels' && Array.isArray(parsed.hotels)) {
                    hotelsFromStream = parsed.hotels as AssistantHotel[];
                    continue;
                  }
                  if (parsed.error) {
                    throw new Error(parsed.error.message || parsed.error);
                  }
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (typeof content === 'string') {
                    fullText += content;
                  }
                } catch {
                  // ignore JSON parse errors (e.g. SSE comments or incomplete chunks)
                }
              }
            }
          }
        } finally {
          reader.releaseLock?.();
          setStreamingMessageId(null);
        }

        if (fullText) {
          setAiProgressStep(4);
          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: fullText,
            isUser: false,
            role: 'assistant',
            hotels: hotelsFromStream
          }]);
        }
        if (chatId && user && fullText) {
          await saveMessageToCurrentChat(chatId, 'assistant', fullText, {
            hotels: hotelsFromStream
          });
        }
        return;
      }

      let data: { text?: string; response?: string; hotels?: AssistantHotel[]; itinerary?: import('../types/tripPlan').TripPlanDay[]; error?: string; message?: string };
      try {
        const responseText = await response.text();
        if (!responseText?.trim()) throw new Error('Empty response from server');
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }

      const responseText = data.response || data.text;
      if (!responseText) throw new Error('Empty response from GPT');

      const hotelsFromApi: AssistantHotel[] | undefined = Array.isArray(data.hotels)
        ? data.hotels
        : undefined;
      const itineraryFromApi = Array.isArray(data.itinerary) && data.itinerary.length > 0
        ? data.itinerary as import('../types/tripPlan').TripPlanDay[]
        : undefined;

      setStreamingMessageId(null);
      setAiProgressStep(4);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: responseText,
        isUser: false,
        role: 'assistant' as const,
        hotels: hotelsFromApi,
        itinerary: itineraryFromApi
      }]);

      if (chatId && user) {
        await saveMessageToCurrentChat(chatId, 'assistant', responseText, {
          hotels: hotelsFromApi,
          itinerary: itineraryFromApi
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setStreamingMessageId(null);
      const errorMessage: Message = {
        id: Date.now() + Math.random(),
        text: error instanceof Error
          ? (
              error.message.includes('Лимит запросов') || error.message.includes('rate_limit') || error.message.includes('бесплатных запросов')
                ? `${error.message}\n\nЗарегистрируйтесь — это бесплатно и даёт неограниченный доступ к чату.`
                : error.message.includes('Failed to fetch')
                ? 'Не удалось подключиться к серверу чата. Проверьте, что backend запущен (порт 3001), и попробуйте снова.'
                : `Извините, произошла ошибка: ${error.message}. Пожалуйста, попробуйте еще раз.`
            )
          : 'Извините, произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.',
        isUser: false,
        role: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Сохраняем сообщение об ошибке
      if (chatId && user) {
        await saveMessageToCurrentChat(chatId, 'assistant', errorMessage.text);
      }
    } finally {
      setIsLoading(false);
      setAiProgressStep(0);
    }
  }, [messages, inputText, filters, dateFilter, getFlightInfoForGPT, currentChatId, user, location.search]);

  // Reset chat state when URL changes (only if no chatId in URL)
  useEffect(() => {
    if (isFirstMount.current) {
      const hasChatId = new URLSearchParams(location.search).get('chat');
      const creatorChatId = new URLSearchParams(location.search).get('creatorChat');
      const creatorId = new URLSearchParams(location.search).get('creatorId');
      
      // Не сбрасываем сообщения если есть chatId или creator чат — история загрузится отдельно
      // Также не сбрасываем если messages уже содержат данные
      const hasExistingMessages = messages.length > 0;
      
      if (!hasChatId && !creatorChatId && !creatorId && !hasExistingMessages) {
        setMessages([{
          id: Date.now() + Math.random(),
          text: WELCOME_MESSAGE_TEXT,
          isUser: false,
          role: 'assistant'
        }]);
      }
      setInputText('');
      setShowTripBuilder(false);
      setFilters({
        location: '',
        travelers: 2,
        children: 0,
        childrenAges: [],
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
    // ВАЖНО:
    // - обычные автозапросы (например, с главной страницы) должны уходить даже без user
    // - для "Задать вопрос" по туру (newTour=1) ждём user, чтобы создать и сохранить отдельный тур-чат
    const params = new URLSearchParams(location.search);
    const isNewTourChat = params.get('newTour') === '1' || Boolean(params.get('tourTitle'));
    
    // Если это чат с организатором тура - не отправляем запрос к AI
    const isCreatorChatMode = Boolean(params.get('creatorChat')) || Boolean(params.get('creatorId'));
    if (isCreatorChatMode) return;
    
    if (isNewTourChat && !user) return;

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
  }, [initialQuery, messages, handleSendMessage, user, location.search]);

  // Загрузка creator чата из URL (если есть)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const creatorChatIdFromUrl = params.get('creatorChat');
    
    if (creatorChatIdFromUrl && user) {
      setCreatorChatId(creatorChatIdFromUrl);
      setIsCreatorChat(true);
      
      // Подключаемся к WebSocket
      creatorChatApi.connect().then(() => {
        // Подписываемся на новые сообщения
        const unsubscribe = creatorChatApi.onMessage((message: any) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => String(m.id) === String(message.id))) return prev;
            return [...prev, {
              id: message.id,
              text: message.content,
              isUser: message.sender_type === 'client',
              role: message.sender_type === 'client' ? 'user' : 'assistant'
            }];
          });
        });
        
        return () => unsubscribe();
      });
      
      // Загружаем сообщения creator чата
      const loadCreatorMessages = async () => {
        try {
          const messages = await creatorChatApi.getMessages(creatorChatIdFromUrl);
          const formattedMessages: Message[] = messages.map((msg: any) => {
            const content = typeof msg.content === 'string' ? msg.content : String(msg.content ?? '');
            const unpacked: { text: string; meta?: StoredAssistantMeta } =
              msg.sender_type === 'client'
                ? { text: content }
                : unpackStoredAssistantMessage(content);
            return {
              id: msg.id,
              text: unpacked.text,
              isUser: msg.sender_type === 'client',
              role: msg.sender_type === 'client' ? 'user' : 'assistant',
              hotels: unpacked.meta?.hotels,
              itinerary: unpacked.meta?.itinerary
            };
          });
          setMessages(formattedMessages.length > 0 ? formattedMessages : [{
            id: Date.now(),
            text: 'Чат с организатором тура. Задавайте ваши вопросы.',
            isUser: false,
            role: 'assistant' as const
          }]);
        } catch (err) {
          console.error('Error loading creator chat messages:', err);
        }
      };
      
      loadCreatorMessages();
    }
  }, [location.search, user, isCreatorChat]);

  // Загрузка/создание чата при входе
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatIdFromUrl = params.get('chat');
    const creatorChatIdFromUrl = params.get('creatorChat');
    const creatorIdFromUrl = params.get('creatorId');
    const tourTitleFromUrl = params.get('tourTitle');
    
    // Если есть creatorId - создаём чат с организатором
    if (creatorIdFromUrl && user && !isCreatorChat) {
      console.log('Creating creator chat with:', creatorIdFromUrl);
      
      const createChat = async () => {
        try {
          await creatorChatApi.connect();
          const { chat_id: wsChatId } = await creatorChatApi.joinChat(creatorIdFromUrl, tourTitleFromUrl || undefined);

          setCreatorChatId(wsChatId);
          setIsCreatorChat(true);
          setMessages([{
            id: Date.now(),
            text: `Вы начали чат с организатором тура "${tourTitleFromUrl || ''}". Задавайте ваши вопросы напрямую организатору.`,
            isUser: false,
            role: 'assistant'
          }]);

          // Добавляем в список чатов
          const newChat: Chat = {
            id: wsChatId,
            title: tourTitleFromUrl ? `Тур: ${tourTitleFromUrl}` : 'Чат с организатором',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.id,
            isCreatorChat: true,
            creatorChatId: wsChatId,
            unread_count: 0
          };
          setUserChats(prev => [newChat, ...prev]);

          // Обновляем URL
          const newParams = new URLSearchParams(location.search);
          newParams.set('creatorChat', wsChatId);
          newParams.delete('creatorId');
          newParams.delete('new');
          navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
          
        } catch (err) {
          console.error('Error creating chat:', err);
        }
      };
      
      createChat();
      return;
    }
    
    // Если есть creatorChat в URL - загружаем существующий
    if (creatorChatIdFromUrl && user) {
      setCreatorChatId(creatorChatIdFromUrl);
      setIsCreatorChat(true);
      return;
    }
    
    // Обычный чат
    if (chatIdFromUrl && user && chatIdFromUrl !== currentChatId) {
      if (params.get('new')) {
        const cleanedParams = new URLSearchParams(params);
        cleanedParams.delete('new');
        navigate({ pathname: location.pathname, search: cleanedParams.toString() }, { replace: true });
      }
      const chat = userChats.find(c => c.id === chatIdFromUrl);
      if (chat?.isCreatorChat) {
        setCreatorChatId(chat.creatorChatId || chatIdFromUrl);
        setIsCreatorChat(true);
        setCurrentChatId(chatIdFromUrl);
        return;
      }
      loadChat(chatIdFromUrl);
    }
  }, [location.search, user]);

  // Загрузка списка чатов при входе пользователя
  useEffect(() => {
    const loadUserChats = async () => {
      if (user) {
        try {
          // Загружаем обычные AI чаты
          const chats = await getUserChats();
          
          // Подключаемся к WebSocket и загружаем чаты с организаторами
          try {
            await creatorChatApi.connect();
            const creatorChats = await creatorChatApi.getChats();
            
            // Преобразуем чаты с организаторами в формат Chat
            const formattedCreatorChats: Chat[] = creatorChats.map((c: any) => ({
              id: c.chat_id,
              title: c.tourTitle ? `Тур: ${c.tourTitle}` : 'Чат с организатором',
              created_at: c.created_at || new Date().toISOString(),
              updated_at: c.last_message_at || new Date().toISOString(),
              user_id: user.id,
              isCreatorChat: true,
              creatorChatId: c.chat_id,
              unread_count: c.unread_count || 0
            }));
            
            // Объединяем чаты
            setUserChats([...formattedCreatorChats, ...chats]);
          } catch (wsError) {
            console.error('Error loading creator chats:', wsError);
            setUserChats(chats);
          }
        } catch (error) {
          console.error('Error loading user chats:', error);
        }
      }
    };

    loadUserChats();
  }, [user]);

  // Загрузка конкретного чата
  const loadChat = async (chatId: string) => {
    if (!user) return;
    if (chatId === currentChatId && messages.length > 1) return; // Уже загружен
    
    console.log('Loading chat messages for:', chatId);
    
    try {
      const loadedMessages = await getChatMessages(chatId);
      console.log('Loaded messages:', loadedMessages.length, loadedMessages);
      
      if (loadedMessages.length > 0) {
        const formattedMessages: Message[] = loadedMessages.map((msg: ChatMessageDB, index: number) => {
          const content = typeof msg.content === 'string' ? msg.content : String(msg.content ?? '');
          const unpacked = msg.role === 'assistant'
            ? unpackStoredAssistantMessage(content)
            : { text: content };
          return {
            id: index,
            text: unpacked.text,
            isUser: msg.role === 'user',
            role: msg.role as 'user' | 'assistant' | 'system',
            hotels: unpacked.meta?.hotels,
            itinerary: unpacked.meta?.itinerary
          };
        });
        setMessages(formattedMessages);
      } else {
        // Если сообщений нет, показываем приветственное
        setMessages([{
          id: Date.now() + Math.random(),
          text: WELCOME_MESSAGE_TEXT,
          isUser: false,
          role: 'assistant'
        }]);
      }
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // Создание нового чата
  const startNewChat = async (firstMessage?: string) => {
    if (!user) return null;
    
    try {
      // Пытаемся определить, что это чат по туру
      const params = new URLSearchParams(location.search);
      const tourTitleFromUrl = params.get('tourTitle');
      const creatorIdFromUrl = params.get('creatorId');
      
      // Если есть creatorId - создаём чат с создателем тура через WebSocket
      if (creatorIdFromUrl) {
        try {
          // Подключаемся к WebSocket
          await creatorChatApi.connect();
          
          // Создаём/присоединяемся к чату
          const { chat_id: wsChatId } = await creatorChatApi.joinChat(creatorIdFromUrl, tourTitleFromUrl || undefined);
          setCreatorChatId(wsChatId);
          setIsCreatorChat(true);

          // Добавляем системное сообщение о начале чата
          setMessages([{
            id: Date.now(),
            text: `Вы начали чат с организатором тура "${tourTitleFromUrl || ''}". Задавайте ваши вопросы напрямую организатору.`,
            isUser: false,
            role: 'assistant'
          }]);

          // Добавляем чат в список (чтобы он появился в левой панели)
          const newChat: Chat = {
            id: wsChatId,
            title: tourTitleFromUrl ? `Тур: ${tourTitleFromUrl}` : 'Чат с организатором',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.id,
            isCreatorChat: true,
            creatorChatId: wsChatId,
            unread_count: 0
          };
          setUserChats(prev => [newChat, ...prev]);

          // Обновляем URL
          const newParams = new URLSearchParams(location.search);
          newParams.set('creatorChat', wsChatId);
          newParams.delete('creatorId');
          newParams.delete('newTour');
          newParams.delete('new');
          navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });

          return wsChatId;
        } catch (err) {
          console.error('Error creating creator chat:', err);
          // Fallback к обычному чату если не удалось создать creator чат
        }
      }

      let title: string;
      if (tourTitleFromUrl) {
        // Явно переданный заголовок тура из URL
        title = `Тур: ${tourTitleFromUrl}`;
      } else if (firstMessage && firstMessage.includes('Вопрос организатору по туру "')) {
        // Резервный вариант: извлечь название тура из текста вопроса
        const match = firstMessage.match(/Вопрос организатору по туру "([^"]+)"/);
        if (match && match[1]) {
          title = `Тур: ${match[1]}`;
        } else {
          title = firstMessage ? generateChatTitle(firstMessage) : 'Новый чат';
        }
      } else {
        title = firstMessage ? generateChatTitle(firstMessage) : 'Новый чат';
      }

      const chat = await createChat(title);
      if (chat) {
        setCurrentChatId(chat.id);
        setUserChats(prev => [chat, ...prev]);
        
        // Добавляем приветственное сообщение в новый чат
        await addChatMessage(chat.id, 'assistant', WELCOME_MESSAGE_TEXT);

        // Обновляем URL, чтобы прокинуть chatId — это триггерит
        // повторную загрузку списка чатов в сайдбаре
        try {
          const params = new URLSearchParams(location.search);
          params.set('chat', chat.id);
          params.delete('newTour');
          params.delete('new');
          navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
        } catch (e) {
          console.error('Error updating URL with new chatId:', e);
        }

        return chat.id;
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
    return null;
  };

  // Сохранение сообщения в текущий чат
  const saveMessageToCurrentChat = async (
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    meta?: StoredAssistantMeta
  ) => {
    console.log('Saving message:', { role, content: content.slice(0, 50) + '...', chatId, user: !!user });
    
    if (!user || !chatId) {
      console.log('Cannot save: no user or chatId');
      return;
    }
    
    try {
      const payload = role === 'assistant' ? packStoredAssistantMessage(content, meta) : content;
      await addChatMessage(chatId, role, payload);
      console.log('Message saved successfully');
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

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
    setFilters((prev: FilterState) => {
      const nextChildren = increment ? prev.children + 1 : Math.max(0, prev.children - 1);
      const nextAges = increment
        ? [...prev.childrenAges, 0]
        : prev.childrenAges.slice(0, nextChildren);
      return {
        ...prev,
        children: nextChildren,
        childrenAges: nextAges
      };
    });
  };

  const handleChildAgeChange = (index: number, age: number) => {
    setFilters((prev: FilterState) => {
      const next = [...prev.childrenAges];
      next[index] = Math.max(0, Math.min(17, age));
      return { ...prev, childrenAges: next };
    });
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

  /** Числовой region id в query (регистр ключа q не важен). Fallback по сырой строке — на случай дублей/нестандартного query. */
  const getOstrovokNumericQ = (u: URL): string | null => {
    for (const [k, v] of u.searchParams.entries()) {
      if (k.toLowerCase() !== 'q') continue;
      const t = String(v).trim();
      if (/^\d+$/.test(t)) return t;
    }
    const raw = u.search.match(/(?:^|[?&])q=(\d+)(?:&|#|$)/i);
    return raw ? raw[1] : null;
  };

  // Порядок параметров как на ostrovok.ru: utm_medium → partner_slug → utm_source
  const normalizeOstrovokQueryOrder = (url: string): string => {
    try {
      const pre = rewriteOstrovokHybridHotelPathToSerp(url) || url;
      let u = new URL(pre);
      const order = ['utm_medium', 'partner_slug', 'utm_source'];
      const rest: [string, string][] = [];
      u.searchParams.forEach((v, k) => {
        if (!order.includes(k)) rest.push([k, v]);
      });
      const newUrl = new URL(u.origin + u.pathname);
      for (const k of order) {
        const v = u.searchParams.get(k);
        if (v) newUrl.searchParams.set(k, v);
      }
      rest.forEach(([k, v]) => newUrl.searchParams.set(k, v));
      return newUrl.toString();
    } catch {
      return url;
    }
  };

  // Fix booking URLs — партнёрская разметка + корректный HP/SERP (без принудительного test_hotel).
  const fixBookingUrl = (url: string, checkInDate?: string, checkOutDate?: string, hotelSlug?: string): string => {
    const safeHotelSlug = String(hotelSlug || '').trim();
    if ((!url || !url.includes('ostrovok.ru')) && (!safeHotelSlug || looksLikeHid(safeHotelSlug))) {
      return url;
    }

    const roomsCanonical = rewriteOstrovokHotelPathToRooms(url);
    if (roomsCanonical) {
      url = roomsCanonical;
    }

    const unhybrid = rewriteOstrovokHybridHotelPathToSerp(url);
    if (unhybrid) {
      url = unhybrid;
    }

    const resolveDates = (): { checkIn: string; checkOut: string } => {
      if (checkInDate && checkOutDate) {
        return { checkIn: checkInDate, checkOut: checkOutDate };
      }
      if (dateFilter.type === 'specific' && dateFilter.startDate) {
        const s = dateFilter.startDate.toISOString().split('T')[0];
        const e = (dateFilter.endDate || dateFilter.startDate).toISOString().split('T')[0];
        return { checkIn: s, checkOut: e };
      }
      const today = new Date().toISOString().split('T')[0];
      const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { checkIn: today, checkOut: week };
    };

    let { checkIn, checkOut } = resolveDates();
    if (checkIn === checkOut) {
      const d = new Date(`${checkIn}T12:00:00`);
      d.setDate(d.getDate() + 1);
      checkOut = d.toISOString().split('T')[0];
    }
    const roomsArg = [{ adults: filters.travelers, childrenAges: filters.childrenAges }];

    if (FORCE_TEST_HOTELS) {
      return buildHotelPageLink('test_hotel', {
        partnerSlug: OSTROVOK_PARTNER_SLUG,
        checkIn,
        checkOut,
        rooms: roomsArg,
      });
    }

    const withNorm = (u: string) => normalizeOstrovokQueryOrder(u);
    if (safeHotelSlug && !looksLikeHid(safeHotelSlug)) {
      try {
        return withNorm(
          buildHotelPageLink(safeHotelSlug, {
            partnerSlug: OSTROVOK_PARTNER_SLUG,
            checkIn,
            checkOut,
            rooms: roomsArg,
          })
        );
      } catch {
        /* fall through to URL-based recovery */
      }
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return url;
    }

    const resolveRegionId = (): number | undefined => {
      const fromFilter = getRegionIdForCityName((filters.location || '').trim());
      if (fromFilter != null) return fromFilter;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (!m.isUser) continue;
        const loc = extractLocationFromText(m.text);
        if (loc) {
          const id = getRegionIdForCityName(loc.trim());
          if (id != null) return id;
        }
      }
      return undefined;
    };

    const regionId = resolveRegionId();
    /** SERP без q= на ostrovok.ru даёт 404 — всегда передаём регион (fallback Москва, как на бэкенде). */
    const buildSerpForContext = (rid: number) =>
      withNorm(
        buildSerpLink(String(rid), {
          partnerSlug: OSTROVOK_PARTNER_SLUG,
          checkIn,
          checkOut,
          rooms: roomsArg,
        })
      );

    const qParam = getOstrovokNumericQ(parsed);
    if (qParam) {
      return withNorm(
        buildSerpLink(qParam, {
          partnerSlug: OSTROVOK_PARTNER_SLUG,
          checkIn,
          checkOut,
          rooms: roomsArg,
        })
      );
    }

    const extractHotelSlugFromPath = (pathname: string): string | null => {
      const parts = pathname
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length < 2 || parts[0].toLowerCase() !== 'hotel') return null;

      // /hotel/{slug}
      if (parts.length === 2) return parts[1] || null;

      // /hotel/{country}/{city}/mid123456/{hotel_slug}/
      for (let i = parts.length - 1; i >= 1; i -= 1) {
        const seg = parts[i];
        if (!seg) continue;
        if (/^mid\d+$/i.test(seg)) continue;
        if (/^(hotel|hotels|rooms)$/i.test(seg)) continue;
        return seg;
      }
      return null;
    };

    const hotelSeg = extractHotelSlugFromPath(parsed.pathname);
    if (hotelSeg) {
      if (looksLikeHid(hotelSeg)) {
        return buildSerpForContext(regionId ?? 1);
      }
      try {
        return withNorm(
          buildHotelPageLink(hotelSeg, {
            partnerSlug: OSTROVOK_PARTNER_SLUG,
            checkIn,
            checkOut,
            rooms: roomsArg,
          })
        );
      } catch {
        /* fallthrough */
      }
    }

    const roomsSeg = parsed.pathname.match(/\/rooms\/([^/?]+)/)?.[1];
    if (roomsSeg) {
      if (looksLikeHid(roomsSeg)) {
        return buildSerpForContext(regionId ?? 1);
      }
      try {
        return withNorm(
          buildHotelPageLink(roomsSeg, {
            partnerSlug: OSTROVOK_PARTNER_SLUG,
            checkIn,
            checkOut,
            rooms: roomsArg,
          })
        );
      } catch {
        return withNorm(url);
      }
    }

    if (parsed.pathname.endsWith('/hotels/') || parsed.pathname === '/hotels') {
      return buildSerpForContext(regionId ?? 1);
    }

    return withNorm(url);
  };

  const formatMessage = (text: string): string => {
    if (!text) return '';

    const autoLinkPlaceMentions = (raw: string): string => {
      const destination = (filters.location || '').trim();

      const withRestaurantLinks = raw.replace(
        /(Обед в ресторане|Ужин в ресторане)\s+[«"]([^"»\n]+)[»"]/gi,
        (full, prefix: string, placeName: string) => {
          if (/^\s*#{1,6}\s/.test(full)) return full;
          if (/\]\(https?:\/\/[^\)]+\)/i.test(full)) return full;
          const restaurantQuery = `ресторан ${placeName.trim()}`;
          const query = encodeURIComponent(
            destination ? `${restaurantQuery}, ${destination}` : restaurantQuery
          );
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
          return `${prefix} [${placeName}](${mapsUrl})`;
        }
      );

      return withRestaurantLinks;
    };

    // First, normalize escaped markdown links and fix broken booking URLs in raw text
    let fixedText = autoLinkPlaceMentions(text)
      // В ответе чата не показываем кнопку/строку сохранения маршрута.
      .replace(/^\s*\[[^\]]*сохранить маршрут[^\]]*\]\([^)]+\)\s*$/gmi, '')
      .replace(/^\s*.*сохранить маршрут.*$/gmi, '')
      // GPT иногда экранирует markdown как \[text\](url) — приводим к обычному виду
      .replace(/\\\[((?:\\.|[^\]])+?)\\\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => {
        const cleanLabel = String(label).replace(/\\([()[\]])/g, '$1');
        const cleanUrl = String(url).replace(/\\+$/, '');
        return `[${cleanLabel}](${cleanUrl})`;
      })
      .replace(
        /\\\[([^\]]+?)\\\]\((https?:\/\/[^)\s]+)\)/g,
        (_, label, url) => `[${label}](${String(url).replace(/\\+$/, '')})`
      )
      .replace(
        /\[([^\]]+?)\]\\\((https?:\/\/[^)\s]+)\\\)/g,
        (_, label, url) => `[${label}](${String(url).replace(/\\+$/, '')})`
      )
      .replace(
      /\[([^\]]*🛎️[^\]]*)\]\((https?:\/\/ostrovok\.ru\/hotel\/[^)]+)\)/g,
      (_, label, url) => {
        const fixedUrl = fixBookingUrl(url);
        return `[${label}](${fixedUrl})`;
      }
    );

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
      // Удаляем пустые markdown-маркеры заголовков, чтобы они не попадали в UI как "###".
      .replace(/^\s*#{1,6}\s*$/gm, '')
      // Format images (non-hotel photos)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="w-full max-w-md rounded-xl shadow-lg object-cover aspect-video" loading="lazy" /></div>')
      
      // Format markdown links [text](url) - must be before other replacements
      // Handle booking button with emoji - capture full URL including & and =
      .replace(/\[\s*🛎️\s*([^\]]+?)\s*\]\(\s*(https?:\/\/[^)]+)\)/g, (_, label, url) => {
        const fixedUrl = fixBookingUrl(url.trim());
        return `<div class="my-3"><a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"><span>🛎️</span><span>${label.trim()}</span></a></div>`;
      })
      
      // Остальные markdown-ссылки (в т.ч. бронь без 🛎️ в тексте — иначе href остаётся гибридом /hotel/slug/?q=53)
      .replace(/\[([^\]]+?)\]\(\s*(https?:\/\/[^)]+)\)/g, (_, label: string, url: string) => {
        const trimmed = url.trim();
        const href =
          /ostrovok\.ru\/(hotel|rooms)\//i.test(trimmed) ? fixBookingUrl(trimmed) : trimmed;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">${label}</a>`;
      })
      
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
      
      // Format paragraphs (не оборачиваем уже сформированные HTML-теги).
      .replace(/^(?!\s*<)([^\n]+)$/gm, '<p class="my-2 leading-relaxed">$1</p>');

    return formattedText;
  };

  // Parse hotel data from message text
  const parseHotelsFromText = (text: string): Array<{
    name: string;
    stars: number;
    rating?: number;
    reviewCount?: number;
    address: string;
    distanceToCenter?: string;
    distanceToMetro?: string;
    price: number;
    currency: string;
    imageUrl?: string;
    bookingUrl: string;
    amenities?: string[];
    isTop?: boolean;
    description?: string;
  }> => {
    if (!text || typeof text !== 'string') return [];

    const hotels: Array<{
      name: string;
      stars: number;
      rating?: number;
      reviewCount?: number;
      address: string;
      distanceToCenter?: string;
      distanceToMetro?: string;
      price: number;
      currency: string;
      imageUrl?: string;
      bookingUrl: string;
      amenities?: string[];
      isTop?: boolean;
      description?: string;
    }> = [];

    const normalizeCurrency = (raw?: string) => {
      if (!raw) return 'RUB';
      const v = raw.trim();
      if (v === '₽') return 'RUB';
      if (v === '€') return 'EUR';
      if (v === '$') return 'USD';
      return v.toUpperCase();
    };

    const parseStarsFromTitle = (title: string): number => {
      const stars = (title.match(/⭐/g) || []).length;
      if (stars > 0) return stars;
      const m = title.match(/\b([1-5])\s*[- ]?\s*зв/i);
      return m ? Number(m[1]) : 0;
    };

    const extractFirstImage = (block: string): string | undefined => {
      const m = block.match(/!\[[^\]]*\]\(([^)]+)\)/);
      return m?.[1]?.trim();
    };

    const extractBookingUrl = (block: string): string => {
      const mEmoji = block.match(/\[\s*🛎️[^\]]*\]\(([^)]+)\)/);
      if (mEmoji) return fixBookingUrl(mEmoji[1].trim());
      const mO = block.match(/\]\((https?:\/\/[^)]*ostrovok\.ru\/(?:hotel|rooms)\/[^)]+)\)/i);
      return mO ? fixBookingUrl(mO[1].trim()) : '';
    };

    const extractAddress = (block: string): string => {
      const m = block.match(/-\s*\*\*Адрес:\*\*\s*([^\n]+)/i);
      return (m?.[1] || '').trim();
    };

    const extractDistanceToCenter = (block: string): string | undefined => {
      const m = block.match(/-\s*\*\*До центра:\*\*\s*([^\n]+)/i);
      return m?.[1]?.trim();
    };

    const extractDistanceToMetro = (block: string): string | undefined => {
      const m = block.match(/-\s*\*\*(?:До метро|Метро):\*\*\s*([^\n]+)/i);
      return m?.[1]?.trim();
    };

    const extractRating = (block: string): { rating?: number; reviewCount?: number } => {
      const ratingMatch = block.match(/-\s*\*\*Рейтинг:\*\*\s*(\d+(\.\d+)?)/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      // "246 отзывов" or "(246 отзывов)" etc.
      const reviewsMatch = block.match(/(\d{1,6})\s*отзыв/i);
      const reviewCount = reviewsMatch ? parseInt(reviewsMatch[1], 10) : undefined;

      return { rating, reviewCount };
    };

    const extractPrice = (block: string): { price: number; currency: string } => {
      // Variants:
      // - "- **Цена:** от 12 345 RUB"
      // - "💰 **Цена:** от 104 € за ночь"
      const m =
        block.match(/(?:-|\u2022)?\s*(?:💰\s*)?\*\*Цена:\*\*\s*от\s*([\d\s]+)\s*([A-Za-z]{3}|₽|€|\$)?/i) ||
        block.match(/(?:-|\u2022)?\s*(?:💰\s*)?Цена:\s*от\s*([\d\s]+)\s*([A-Za-z]{3}|₽|€|\$)?/i);
      const price = m ? parseInt(m[1].replace(/\s/g, ''), 10) : 0;
      const currency = normalizeCurrency(m?.[2]);
      return { price, currency };
    };

    const extractAmenities = (block: string): string[] | undefined => {
      const m = block.match(/-\s*\*\*(?:Удобства|Amenities):\*\*\s*([^\n]+)/i);
      if (!m?.[1]) return undefined;
      const list = m[1]
        .split(/[,•·]/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      return list.length ? list : undefined;
    };

    const extractDescription = (block: string): string | undefined => {
      const m = block.match(/(?:-|\u2022)?\s*(?:[^\s]*\s*)?(?:\*\*)?Описание:\s*\*?\*?\s*([^\n]+)/i);
      const raw = m?.[1]?.trim();
      if (!raw) return undefined;
      return raw.length > 200 ? raw.slice(0, 197) + '…' : raw;
    };

    const extractIsTop = (titleLine: string, block: string) => {
      return /TOP|Топ/i.test(titleLine) || /\btop\b/i.test(block);
    };

    const collectBlock = (titleLine: string, block: string) => {
      const bookingUrl = extractBookingUrl(block);
      if (!bookingUrl) return;

      const stars = parseStarsFromTitle(titleLine);
      const name = titleLine
        .replace(/^###\s*\d+\.\s*/i, '')
        .replace(/^##\s*🏨\s*/i, '')
        .replace(/⭐+/g, '')
        .replace(/\s*\bTOP\b\s*/gi, ' ')
        .replace(/["“”]/g, '')
        .trim();

      const imageUrl = extractFirstImage(block);
      const address = extractAddress(block);
      const { rating, reviewCount } = extractRating(block);
      const { price, currency } = extractPrice(block);
      const distanceToCenter = extractDistanceToCenter(block);
      const distanceToMetro = extractDistanceToMetro(block);
      const amenities = extractAmenities(block);
      const isTop = extractIsTop(titleLine, block);
      const description = extractDescription(block);

      if (!name) return;

      hotels.push({
        name,
        stars,
        rating,
        reviewCount,
        address,
        distanceToCenter,
        distanceToMetro,
        price,
        currency,
        imageUrl,
        bookingUrl,
        amenities,
        isTop,
        description,
      });
    };

    // Split into blocks by hotel headers.
    // Supports:
    // - ### 1. Name ⭐⭐⭐
    // - ## 🏨 Hotel "Name" ⭐⭐⭐
    const headerRe = /^(###\s*\d+\.\s*[^\n]+|##\s*🏨\s*[^\n]+)$/gmi;
    const headers: Array<{ index: number; line: string }> = [];
    let hm: RegExpExecArray | null;
    while ((hm = headerRe.exec(text)) !== null) {
      headers.push({ index: hm.index, line: hm[1] });
    }

    if (headers.length === 0) return hotels;

    for (let i = 0; i < headers.length; i++) {
      const start = headers[i].index;
      const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
      const block = text.slice(start, end).trim();
      const firstLine = headers[i].line.trim();
      collectBlock(firstLine, block);
    }

    return hotels;
  };

  // Update the message rendering in the Chat component
  const renderMessage = (message: Message) => {
    const safeText = typeof message.text === 'string' ? message.text : String(message.text ?? '');

    if (message.isUser) {
      return (
        <div className="bg-black text-white rounded-[20px] rounded-br-[4px] px-4 py-3">
          <p className="text-[15px] font-medium leading-snug">{safeText}</p>
        </div>
      );
    }

    // Handle link clicks: открываем фактическую ссылку из ответа
    const handleMessageClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      const isOstrovok = link && /ostrovok\.ru/i.test(link.href);
      if (isOstrovok && link) {
        e.preventDefault();
        e.stopPropagation();
        const urlToOpen = fixBookingUrl(link.href);
        try {
          const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
          // Если попап заблокирован — откроем в этой же вкладке.
          // Важно: не проверяем newWindow.closed / typeof, т.к. в некоторых браузерах
          // это может давать ложные срабатывания и приводить к двойному открытию.
          if (!newWindow) {
            window.location.assign(urlToOpen);
          }
        } catch {
          const tempLink = document.createElement('a');
          tempLink.href = urlToOpen;
          tempLink.target = '_blank';
          tempLink.rel = 'noopener noreferrer';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
        }
        return false;
      }
    };

    // Prefer structured hotels from API, fallback to parsing text
    const hotelsFromApi = message.hotels && message.hotels.length > 0
      ? message.hotels.map(h => {
          const mainImage =
            h.images?.find(img => img.category === 'exterior' || img.category === 'hotel_front') ||
            h.images?.[0];
          const imageUrl = normalizeHotelPreviewImageUrl(
            mainImage?.url,
            DEFAULT_ETG_IMAGE_PREVIEW_SIZE,
            etgHotelImageOptionsFromImportMeta()
          );
          let distanceToCenter: string | undefined;
          if (typeof h.distanceToCenter === 'number' && h.distanceToCenter > 0) {
            const km = h.distanceToCenter / 1000;
            distanceToCenter =
              km < 1 ? `${Math.round(h.distanceToCenter)} м` : `${km.toFixed(1)} км от центра`;
          }
          return {
            name: h.name,
            stars: h.stars,
            rating: h.rating,
            reviewCount: undefined,
            address: h.address,
            distanceToCenter,
            distanceToMetro: undefined,
            price: h.price,
            currency: h.currency,
            imageUrl,
            bookingUrl: fixBookingUrl(h.bookingUrl || '', undefined, undefined, h.id),
            amenities: h.amenities,
            roomAmenities: h.roomAmenities,
            taxesAndFees: h.taxesAndFees,
            mealType: h.mealType,
            cancellationPolicy: h.cancellationPolicy,
            cancellationDeadline: h.cancellationDeadline,
            checkInTime: h.checkInTime,
            checkOutTime: h.checkOutTime,
            metapolicyHighlights: h.metapolicyHighlights,
            roomName: h.roomName,
            isTop: false,
          };
        })
      : null;

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
        <div className="space-y-4" style={{ contain: 'layout style paint' }}>
          {/* Обработка отелей и текста без useMemo */}
          {(() => {
            try {
              const parsedHotels = hotelsFromApi ?? parseHotelsFromText(safeText);

              // Всегда убираем из текста блоки с деталями отелей
              const isHotelDetailBlock = (s: string) =>
                /Адрес:|Цена:|Описание:/i.test(s) && (/Цена:/i.test(s) || /Описание:/i.test(s));
              let textWithoutHotels = safeText;
              if (parsedHotels?.length) {
                parsedHotels.forEach(hotel => {
                  const escapedName = hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const patternOld = new RegExp(
                    `###\\s*\\d+\\.\\s*${escapedName}[\\s\\S]*?(?=###\\s*\\d+\\.|##\\s*🏨|\\n---\\s*\\n|$)`,
                    'gmi'
                  );
                  const patternNew = new RegExp(
                    `##\\s*🏨\\s*${escapedName}[\\s\\S]*?(?=##\\s*🏨|###\\s*\\d+\\.|\\n---\\s*\\n|$)`,
                    'gmi'
                  );
                  textWithoutHotels = textWithoutHotels.replace(patternOld, '');
                  textWithoutHotels = textWithoutHotels.replace(patternNew, '');
                });
              }
              // Блоки с заголовком ### N. или ##
              textWithoutHotels = textWithoutHotels.replace(
                /(?:^|\n)((?:###\s*\d+\.\s*[^\n]+|##\s[^\n]+)\n[\s\S]*?)(?=\n(?:###\s*\d+\.|##\s|\n---\s*\n)|$)/gim,
                (fullMatch, block) => (isHotelDetailBlock(block) ? '\n' : fullMatch)
              );
              // Блоки без заголовка
              textWithoutHotels = textWithoutHotels.replace(
                /(?:^|\n)((!\[[^\]]*\]\([^)]+\)\s*\n[\s\S]*?))(?=\n\n|(?:\n###|\n##)\s|\n---\s*\n|$)/gim,
                (fullMatch, block) => (isHotelDetailBlock(block) ? '\n' : fullMatch)
              );
              // Блоки с произвольным заголовком
              textWithoutHotels = textWithoutHotels.replace(
                /(?:^|\n\n)([\s\S]*?)(?=\n\n|\n(?:###|##)\s|\n---\s*\n|$)/gim,
                (fullMatch, segment) => (isHotelDetailBlock(segment) ? '\n\n' : fullMatch)
              );
              // Доп. очистка от markdown-блоков отелей, чтобы не дублировать карточки и не рендерить битые изображения
              if (parsedHotels?.length) {
                textWithoutHotels = textWithoutHotels
                  .replace(/!\[[^\]]*\]\([^)]+\)\s*/g, '')
                  .replace(/^\s*\[\s*🛎️[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/gmi, '')
                  .replace(/^\s*\[[^\]]*Забронировать[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/gmi, '')
                  .replace(
                    /^\s*[-•]?\s*\*\*(Адрес|Рейтинг|Цена|До центра|До метро|Налоги\/сборы|Питание|Отмена|Дедлайн отмены|Check-in\/out|Номер|Удобства номера|Удобства отеля|Важные ограничения)\*\*:\s*.*$/gmi,
                    ''
                  )
                  .replace(
                    /^\s*(?:[📍⭐🎯💰🛎️🍽️⛔⏰]|\uD83C[\uDF00-\uDFFF])?\s*\*?\*?\s*(Адрес|Рейтинг|Цена|До центра|До метро|Налоги\/сборы|Питание|Отмена|Дедлайн отмены|Check-in\/out|Номер|Удобства номера|Удобства отеля|Важные ограничения)\*?\*?\s*:\s*.*$/gmi,
                    ''
                  )
                  .replace(
                    /^\s*(?:[-•*]\s*)?(?:[📍⭐🎯💰🛎️🍽️⛔⏰✅]\s*)?(Адрес|Рейтинг|Цена|До центра|До метро|Налоги\/сборы|Питание|Отмена|Дедлайн отмены|Check-?in\/?out|Номер|Удобства номера|Удобства отеля|Важные ограничения)\s*:\s*.*$/gmi,
                    ''
                  )
                  .replace(
                    /^\s*(?:[#>*\-•]\s*)?(?:[🏨⭐✅]\s*)?(Где остановиться|Рекомендуемые отели)\b.*$/gmi,
                    ''
                  )
                  .replace(/^\s*(?:[-•*]\s*)?(?:[📍]\s*)?\*{0,2}(?:Адрес|Address)\*{0,2}\s*:\s*.*$/gmi, '')
                  .replace(/^\s*\[[^\]]*сохранить маршрут[^\]]*\]\([^)]+\)\s*$/gmi, '')
                  .replace(/^\s*.*сохранить маршрут.*$/gmi, '')
                  .replace(/^###\s*\d+\.\s*.*$/gmi, '')
                  .replace(/^##\s*🏨.*$/gmi, '')
                  .replace(/^\s*#{1,6}\s*$/gmi, '')
                  .replace(/^\s*---\s*$/gmi, '')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim();

                // Remove loose one-line mentions of hotel names above cards.
                for (const hotel of parsedHotels) {
                  const escapedName = hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const hotelNameLine = new RegExp(
                    `^\\s*(?:[#>*\\-•\\d.)]\\s*)?(?:[🏨⭐✅]\\s*)?${escapedName}\\s*(?:[⭐✅\\d./\\-\\s]*)$`,
                    'gmi'
                  );
                  textWithoutHotels = textWithoutHotels.replace(hotelNameLine, '');
                }
                textWithoutHotels = textWithoutHotels.replace(/\n{3,}/g, '\n\n').trim();
                // Дополнительная зачистка: адресные строки над карточками нам не нужны
                textWithoutHotels = textWithoutHotels
                  .replace(/^\s*(?:[-•*]\s*)?(?:📍\s*)?Адрес\s*:\s*.*$/gmi, '')
                  .replace(/^\s*(?:[-•*]\s*)?(?:📍\s*)?Address\s*:\s*.*$/gmi, '')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim();
              }

              if (!parsedHotels || parsedHotels.length === 0) {
                return (
                  <div
                    className="prose prose-sm max-w-none text-gray-900"
                    style={{ contain: 'content' }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(textWithoutHotels) }}
                  />
                );
              }

              const seenKeys = new Set<string>();
              const uniqueHotels = parsedHotels.filter((h, idx) => {
                const key = `${(h.name || '').trim().toLowerCase()}|${(h.bookingUrl || '').trim().toLowerCase()}|${idx}`;
                if (seenKeys.has(key)) return false;
                seenKeys.add(key);
                return true;
              });
              const hotelsToRender = uniqueHotels.slice(0, 10);
              const descBullets = hotelsToRender
                .map(h =>
                  'description' in h && typeof h.description === 'string'
                    ? h.description.trim()
                    : ''
                )
                .filter(Boolean)
                .slice(0, 3)
                .map(d => `• ${d}`)
                .join('\n');
              const validPrices = hotelsToRender
                .map(h => Number(h.price))
                .filter(p => Number.isFinite(p) && p > 0);
              const minPrice = validPrices.length ? Math.min(...validPrices) : null;
              const maxPrice = validPrices.length ? Math.max(...validPrices) : null;
              const currency = hotelsToRender.find(h => h.currency)?.currency || 'RUB';
              const areas = Array.from(
                new Set(
                  hotelsToRender
                    .map(h => (h.address || '').split(',')[0].trim())
                    .filter(Boolean)
                )
              ).slice(0, 3);

              const looksThinNarrative =
                textWithoutHotels.trim().length < 260 ||
                /адрес\s*:/i.test(textWithoutHotels) ||
                /(оптимальный|бюджетный|premium)\s+вариант/i.test(textWithoutHotels);
              const hasRouteNarrative =
                /(?:\bдень\s*\d+\b|маршрут|утро|вечер|достопримечательност|что посмотреть|план)/i.test(
                  safeText
                );

              if (looksThinNarrative && !hasRouteNarrative) {
                const intro = `Я собрал подборку из ${hotelsToRender.length} отелей с разным уровнем бюджета и форматом размещения.`;
                const budget =
                  minPrice != null && maxPrice != null
                    ? `По цене ориентир — от ${new Intl.NumberFormat('ru-RU').format(minPrice)} до ${new Intl.NumberFormat('ru-RU').format(maxPrice)} ${currency} за ночь.`
                    : '';
                const areaHint = areas.length
                  ? `По локациям стоит смотреть варианты в районах: ${areas.join(', ')}.`
                  : '';
                const extra = descBullets ? `\n\n💡 Кратко по вариантам:\n${descBullets}` : '';
                textWithoutHotels = [intro, budget, areaHint].filter(Boolean).join(' ') + extra;
              } else if (descBullets && textWithoutHotels.trim().length < 420) {
                textWithoutHotels = `${textWithoutHotels.trim()}\n\n💡 Кратко по вариантам:\n${descBullets}`.trim();
              }

              const hasNarrative = textWithoutHotels.trim().length > 0;

              return (
                <>
                  {hasNarrative ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-900"
                      style={{ contain: 'content' }}
                      dangerouslySetInnerHTML={{ __html: formatMessage(textWithoutHotels) }}
                    />
                  ) : null}
                  <div className="mt-4" style={{ contain: 'layout' }}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🏨 Рекомендуемые отели</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hotelsToRender.map((hotel, index) => (
                        <HotelCard
                          key={`${hotel.name}-${index}`}
                          variant="mini"
                          onBookingClick={(e) => {
                            e.preventDefault();
                            window.open(
                              fixBookingUrl(e.currentTarget.href),
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }}
                          name={hotel.name}
                          stars={hotel.stars}
                          rating={hotel.rating}
                          reviewCount={hotel.reviewCount}
                          address={hotel.address}
                          price={hotel.price}
                          currency={hotel.currency}
                          imageUrl={hotel.imageUrl}
                          bookingUrl={fixBookingUrl(
                            hotel.bookingUrl || '',
                            undefined,
                            undefined,
                            'id' in hotel ? String(hotel.id || '') : undefined
                          )}
                          distanceToCenter={hotel.distanceToCenter}
                          distanceToMetro={hotel.distanceToMetro}
                          amenities={hotel.amenities}
                          roomAmenities={('roomAmenities' in hotel ? hotel.roomAmenities : undefined)}
                          taxesAndFees={('taxesAndFees' in hotel ? hotel.taxesAndFees : undefined)}
                          mealType={('mealType' in hotel ? hotel.mealType : undefined)}
                          cancellationPolicy={('cancellationPolicy' in hotel ? hotel.cancellationPolicy : undefined)}
                          cancellationDeadline={('cancellationDeadline' in hotel ? hotel.cancellationDeadline : undefined)}
                          checkInTime={('checkInTime' in hotel ? hotel.checkInTime : undefined)}
                          checkOutTime={('checkOutTime' in hotel ? hotel.checkOutTime : undefined)}
                          metapolicyHighlights={('metapolicyHighlights' in hotel ? hotel.metapolicyHighlights : undefined)}
                          roomName={('roomName' in hotel ? hotel.roomName : undefined)}
                          isTop={hotel.isTop}
                          description={'description' in hotel ? hotel.description : undefined}
                        />
                      ))}
                    </div>
                  </div>
                </>
              );
            } catch (renderError) {
              console.error('[Chat] renderMessage failed, fallback to plain text', renderError, message);
              return (
                <div className="prose prose-sm max-w-none text-gray-900">
                  <p className="my-2 leading-relaxed whitespace-pre-wrap">{safeText}</p>
                </div>
              );
            }
          })()}
        </div>
        {streamingMessageId === message.id && (
          <span 
            className="inline-block w-2 h-4 ml-0.5 bg-gray-800 animate-pulse rounded-sm align-text-bottom" 
            style={{ willChange: 'opacity' }}
            aria-hidden 
          />
        )}
      </div>
    );
  };

  // Улучшенная функция извлечения информации о перелете
  const extractFlightInfo = (message: string) => {
    const nonDestinationWords = new Set([
      'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      'сегодня', 'завтра', 'послезавтра'
    ]);
    const normalizeCandidate = (value?: string | null): string | null => {
      if (!value) return null;
      const cleaned = value.trim().toLowerCase().replace(/[.,!?;:]+$/g, '');
      if (!cleaned || nonDestinationWords.has(cleaned)) return null;
      return value.trim();
    };
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
      .map((pattern) => normalizeCandidate(message.match(pattern)?.[1]))
      .find((v): v is string => Boolean(v));
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

  const extractChildrenAgesFromText = (message: string): number[] => {
    const lower = message.toLowerCase();
    const ageMatches = Array.from(lower.matchAll(/(\d{1,2})\s*(?:лет|года|год|г\.)/g));
    const ages = ageMatches
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);
    // Reduce false positives by requiring explicit child context nearby.
    if (!/(реб|дет|подрост)/i.test(lower)) return [];
    return ages.slice(0, 4);
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

  // Smart scroll: only auto-scroll if user is near bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', force = false) => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = scrollBottom < 100; // Within 100px of bottom
    
    // Only scroll if forced, user is near bottom, or not streaming
    if (force || isNearBottom || !streamingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };
  
  // Track user scrolling
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const currentScrollTop = chatContainerRef.current.scrollTop;
    isUserScrollingRef.current = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;
  }, []);

  useEffect(() => {
    scrollToBottom(streamingMessageId != null ? 'auto' : 'smooth');
  }, [messages, streamingMessageId]);

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

  // Извлечь из ответов чата блок с маршрутом по дням (День 1, День 2, ...)
  const extractRouteFromMessages = (): string | null => {
    const dayPattern = /(?:^|\n)(?:#+\s*)?(?:📅\s*)?День\s*\d+/i;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.isUser || !msg.text?.trim()) continue;
      const idx = msg.text.search(dayPattern);
      if (idx === -1) continue;
      let block = msg.text.slice(idx);
      const cut = block.search(/\n(?:Если у тебя|Если у вас|Если есть вопросы|💡 Полезные советы|⚡ Важно знать|Если будут вопросы)/i);
      if (cut !== -1) block = block.slice(0, cut);
      // Нормализация для парсера TripBuilder: "День N:"
      const normalized = block.replace(/(?:#+\s*)?(?:📅\s*)?День\s*(\d+)\s*:?\s*/gi, 'День $1: ');
      if (/День\s*1\s*:/i.test(normalized)) return normalized.trim();
    }
    return null;
  };

  // Данные маршрута всегда берём из сообщений текущего чата (в котором мы находимся)
  const syncBuilderFromCurrentChat = useCallback(() => {
    const lastWithItinerary = [...messages].reverse().find(m => !m.isUser && m.itinerary?.length);
    if (lastWithItinerary?.itinerary?.length) {
      setCurrentItinerary(lastWithItinerary.itinerary);
      setCurrentMessage(lastWithItinerary.text);
    } else {
      setCurrentItinerary(null);
      setCurrentMessage(extractRouteFromMessages() || '');
    }
  }, [messages]);

  // При открытии билдера и при смене чата — показываем маршрут именно этого чата
  useEffect(() => {
    if (showTripBuilder) syncBuilderFromCurrentChat();
  }, [showTripBuilder, syncBuilderFromCurrentChat]);

  const handleTripGenClick = () => {
    syncBuilderFromCurrentChat();
    setShowTripBuilder(true);
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
  const generateItineraryFromRecommendations = (text: string = '') => {
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
        const itinerary = generateItineraryFromRecommendations(
          typeof lastAssistantMessage.text === 'string' ? lastAssistantMessage.text : ''
        );
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

  // Сброс чата при нажатии 'Новый чат' в сайдбаре
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newParam = params.get('new');
    const hasChatId = params.get('chat');
    const hasCreatorChatId = params.get('creatorChat');
    const hasCreatorId = params.get('creatorId');
    if (newParam && !hasChatId && !hasCreatorChatId && !hasCreatorId) {
      setMessages([
        {
          id: Date.now() + Math.random(),
          text: WELCOME_MESSAGE_TEXT,
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
        childrenAges: [],
        pets: 0,
        budget: {
          min: 0,
          max: 10000
        }
      });
      setDateFilter({ type: 'specific' });
      setHasInteracted(false);
    }
  }, [location.search]);

  const currentChatTitle = currentChatId ? (userChats.find(c => c.id === currentChatId)?.title ?? 'Чат') : null;

  return (
    <div className={`h-full flex flex-col bg-white transition-all duration-300 w-full ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
      <div className="w-full flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 flex flex-col min-h-0">
          {/* Top Navigation */}
          <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 md:sticky md:z-10 ${mobileOpen ? 'hidden' : ''} w-full`}>
            <div className="max-w-3xl md:max-w-6xl md:ml-12 md:mr-auto px-4 py-3">
              {currentChatTitle != null && (
                <div className="mb-2 md:mb-1">
                  <h1
                    className="text-sm font-medium text-gray-900 truncate max-w-[min(100%,40rem)]"
                    title={currentChatTitle}
                  >
                    {currentChatTitle}
                  </h1>
                </div>
              )}
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
                    onClick={handleTripGenClick}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
                  >
                    <img src={AILogo} alt="TripGen" className="w-5 h-5" />
                    <span>Маршрут</span>
                  </button>
                </div>
                {/* Desktop Navigation: широкая зона, фильтры слева (макс. ширина), кнопка прижата вправо */}
                <div className="hidden md:flex items-center justify-between w-full min-w-0 gap-6">
                  <div className="min-w-0 flex-1 max-w-4xl">
                    <ChatFilters
                      filters={filters}
                      setFilters={setFilters}
                      dateFilter={dateFilter}
                      setDateFilter={setDateFilter}
                      handleLocationChange={handleLocationChange}
                      handleTravelersChange={handleTravelersChange}
                      handleChildrenChange={handleChildrenChange}
                      handleChildAgeChange={handleChildAgeChange}
                      handlePetsChange={handlePetsChange}
                      handleBudgetChange={handleBudgetChange}
                      handleDurationChange={handleDurationChange}
                      handleMonthSelection={handleMonthSelection}
                      getDateFilterDisplay={getDateFilterDisplay}
                    />
                  </div>
                  <button
                    onClick={handleTripGenClick}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors flex-shrink-0"
                  >
                    <img src={AILogo} alt="TripGen" className="w-6 h-6 flex-shrink-0" />
                    <span className="whitespace-nowrap">TRIPGEN МАРШРУТ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 pt-[56px] pb-0 md:pt-0 md:pb-0 w-full">
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-6 overflow-y-auto pb-32 md:pb-24 w-full"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="max-w-3xl md:max-w-4xl md:ml-12 md:mr-auto space-y-6">
                {/* Показываем приветственное сообщение и подсказки до взаимодействия */}
                {!hasInteracted && !currentChatId && (
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
                            {WELCOME_MESSAGE_TEXT}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <SuggestedQuestions onSelectQuestion={handleSelectQuestion} isCreatorChat={isCreatorChat} />
                    </motion.div>
                  </>
                )}
                
                {/* Показываем сообщения после взаимодействия или при загрузке чата */}
                {(hasInteracted || currentChatId) && messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={streamingMessageId === message.id ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-3`}
                    style={{ 
                      willChange: 'transform, opacity',
                      contain: 'layout style paint'
                    }}
                    layout={false}
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
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
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
                    <div className="max-w-[95%] md:max-w-3xl w-full overflow-hidden">
                      <div className="bg-gray-50 rounded-2xl rounded-bl-[4px] p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Готовлю ответ...</p>
                        <div className="space-y-2">
                          {AI_PROGRESS_STEPS.map((step, idx) => {
                            const done = idx < aiProgressStep;
                            const active = idx === aiProgressStep;
                            return (
                              <div key={step} className="flex items-center gap-2 text-sm">
                                <span
                                  className={
                                    done
                                      ? 'text-green-600'
                                      : active
                                      ? 'text-black animate-pulse'
                                      : 'text-gray-400'
                                  }
                                >
                                  {done ? '✓' : active ? '•' : '○'}
                                </span>
                                <span
                                  className={
                                    done
                                      ? 'text-gray-800'
                                      : active
                                      ? 'text-gray-900 font-medium'
                                      : 'text-gray-400'
                                  }
                                >
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
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
          <>
            <div
              className="fixed top-[72px] left-0 right-0 bottom-0 bg-black/30 z-[45]"
              aria-hidden
              onClick={() => setShowTripBuilder(false)}
            />
            <div className="fixed top-[72px] left-0 right-0 bottom-0 z-[46] flex justify-end pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl h-full bg-white border-l border-gray-200 shadow-xl flex flex-col overflow-hidden">
                {(currentMessage.trim() || (currentItinerary && currentItinerary.length > 0)) ? (
                  <TripBuilder
                    message={currentMessage}
                    itinerary={currentItinerary ?? undefined}
                    duration={dateFilter.type === 'duration' ? `${dateFilter.duration} дней` : 'Выберите даты'}
                    travelers={filters.travelers}
                    onClose={() => setShowTripBuilder(false)}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    getDateFilterDisplay={getDateFilterDisplay}
                    onDurationChange={handleDurationChange}
                    onMonthSelection={handleMonthSelection}
                  />
                ) : (
                  <div className="flex flex-col flex-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowTripBuilder(false)}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Закрыть"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                      <div className="max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Маршрут по дням</h3>
                      <p className="text-gray-600 mb-6">
                        В ответах чата пока нет детального маршрута по дням. Попросите ассистента составить маршрут, например:
                      </p>
                      <p className="text-left bg-gray-50 rounded-xl p-4 text-sm text-gray-800 mb-6 font-medium">
                        «Составь маршрут по {filters.location || 'городу'} на {dateFilter.type === 'duration' && dateFilter.duration ? dateFilter.duration : 5} дней»
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const prompt = `Составь детальный маршрут по ${filters.location || 'этому городу'} на ${dateFilter.type === 'duration' && dateFilter.duration ? dateFilter.duration : 5} дней с расписанием по дням.`;
                          setInputText(prompt);
                          setShowTripBuilder(false);
                        }}
                        className="px-5 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                      >
                        Отправить запрос в чат
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTripBuilder(false)}
                        className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </>
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
              handleChildAgeChange={handleChildAgeChange}
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
