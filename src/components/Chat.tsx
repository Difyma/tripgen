import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MapPin, 
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CreateTripModal } from './CreateTripModal';
import { AuthModal } from './AuthModal';
import { useLocation } from 'react-router-dom';
const AILogo = '/images/TRIPGEN_logo_white.png';
const AILogo2 = '/images/TRIPGEN_logo_2.png';
import TripBuilder from './TripBuilder';
import { useFlightInfo } from '../hooks/useFlightInfo';
import { useHotelInfo } from '../hooks/useHotelInfo';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  role?: 'system' | 'user' | 'assistant';
  showCreateRoute?: boolean;
}

interface Recommendation {
  id: number;
  title: string;
  image: string;
  type: string;
  location?: string;
}

interface FilterState {
  location: string;
  date: string;
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

const SYSTEM_PROMPT = `Ты — профессиональный турагент и travel-блогер с обширным опытом путешествий по всему миру. 
Помоги пользователю спланировать незабываемую поездку в любую точку мира. 

ВАЖНО: Когда я предоставляю информацию о рейсах в формате "# ✈️ Информация о рейсах", используй ТОЛЬКО эту информацию для рекомендаций по перелетам.
Не говори, что у тебя нет доступа к данным. Вся необходимая информация будет в сообщении.

Когда пользователь спрашивает о перелетах:
1. Анализируй предоставленные варианты и давай рекомендации:
   - Сравни самый выгодный и самый быстрый варианты
   - Объясни преимущества и недостатки каждого варианта
   - Порекомендуй оптимальный выбор с учетом соотношения цена/время
   - Если есть обратные рейсы, проанализируй их тоже

2. Дополняй свой ответ полезной информацией:
   - Особенности выбранных авиакомпаний
   - Правила провоза багажа и ручной клади
   - Дополнительные услуги на борту
   - Советы по выбору места в самолете
   - Рекомендации по времени прибытия в аэропорт
   - Информация о терминалах и трансфере между ними

3. Учитывай контекст запроса:
   - Если это деловая поездка, обрати внимание на удобство времени вылета/прилета
   - Для отпуска важнее цена и комфорт
   - При путешествии с детьми рекомендуй прямые рейсы
   - Для длительных перелетов обращай внимание на качество сервиса

4. Давай дополнительные советы:
   - Лучшее время для покупки билетов
   - Возможности накопления миль
   - Особенности регистрации на рейс
   - Правила безопасности и требования авиакомпаний

При ответе ОБЯЗАТЕЛЬНО используй предоставленную информацию о конкретных рейсах и дополняй её своими экспертными рекомендациями.
Если информация о рейсах предоставлена, НИКОГДА не говори, что у тебя нет доступа к данным.

Форматируй свои ответы, используя эмодзи и markdown для лучшей читаемости.`;

const Chat = () => {
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Привет, где бы ты хотел побывать? Я помогу тебе спланировать твое путешествие. Спрашивай меня о чем угодно, что связано с поездкой.",
      isUser: false,
      role: 'assistant'
    }
  ]);
  
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    date: '',
    travelers: 2,
    children: 0,
    pets: 0,
    budget: {
      min: 0,
      max: 10000
    }
  });

  const [inputText, setInputText] = useState('');
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [showTripBuilder, setShowTripBuilder] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'specific' });
  const { getFlightInfoForGPT } = useFlightInfo();
  const { getHotelInfoForGPT } = useHotelInfo();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Reset chat state when URL changes
  useEffect(() => {
    setMessages([{
      id: 1,
      text: "Привет, где бы ты хотел побывать? Я помогу тебе спланировать твое путешествие. Спрашивай меня о чем угодно, что связано с поездкой.",
      isUser: false,
      role: 'assistant'
    }]);
    setInputText('');
    setShowTripBuilder(false);
    setFilters({
      location: '',
      date: '',
      travelers: 2,
      children: 0,
      pets: 0,
      budget: {
        min: 0,
        max: 10000
      }
    });
    setDateFilter({ type: 'specific' });
  }, [location.search]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setFilters(prev => ({ ...prev, location: newLocation }));
    
    // Generate itinerary if duration is set
    if (dateFilter.type === 'duration' && dateFilter.duration) {
      generateItinerary(newLocation, dateFilter.duration);
    }
  };

  const handleTravelersChange = (increment: boolean) => {
    setFilters(prev => ({
      ...prev,
      travelers: increment ? prev.travelers + 1 : Math.max(1, prev.travelers - 1)
    }));
  };

  const handleChildrenChange = (increment: boolean) => {
    setFilters(prev => ({
      ...prev,
      children: increment ? prev.children + 1 : Math.max(0, prev.children - 1)
    }));
  };

  const handlePetsChange = (increment: boolean) => {
    setFilters(prev => ({
      ...prev,
      pets: increment ? prev.pets + 1 : Math.max(0, prev.pets - 1)
    }));
  };

  const handleBudgetChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [type]: value
      }
    }));
  };

  const validateRequiredFields = () => {
    const errors = [];
    
    if (!filters.location) {
      errors.push("Пожалуйста, укажите место назначения");
    }

    // Проверка даты/длительности/месяца
    const hasDateInfo = (
      (dateFilter.type === 'specific' && dateFilter.startDate) ||
      (dateFilter.type === 'duration' && dateFilter.duration) ||
      (dateFilter.type === 'month' && dateFilter.month)
    );
    if (!hasDateInfo) {
      errors.push("Пожалуйста, укажите даты поездки или длительность");
    }

    if (filters.travelers < 1) {
      errors.push("Укажите количество путешественников");
    }

    if (filters.budget.min === 0 && filters.budget.max === 10000) {
      errors.push("Пожалуйста, укажите предполагаемый бюджет");
    }

    return errors;
  };

  const recommendations: Recommendation[] = [
    {
      id: 1,
      title: "Maruyasu Frankfurt Hauptwache",
      image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&q=80",
      type: "Japanese",
      location: "Innenstadt"
    },
    {
      id: 2,
      title: "Hauptwache",
      image: "https://images.unsplash.com/photo-1577351594944-209b3c0f2179?w=800&q=80",
      type: "Attraction",
      location: "Innenstadt"
    },
    {
      id: 3,
      title: "Helium",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      type: "International",
      location: "Innenstadt"
    }
  ];

  const jumpBackItems = [
    {
      id: 1,
      title: "Exploring Moscow Region: June...",
      image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80"
    },
    {
      id: 2,
      title: "Take our travel quiz",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
    },
    {
      id: 3,
      title: "Create a trip",
      image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"
    }
  ];

  const inspiredItems = [
    {
      id: 1,
      title: "FREE: Ultimate Street Food Guide",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
    },
    {
      id: 2,
      title: "COPENHAGEN: Secret Spots, Hidden Gems",
      image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80"
    },
    {
      id: 3,
      title: "8 Days Nepal Cultural Tour",
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80"
    }
  ];

  // Функция для генерации URL места
  const generatePlaceUrl = (place: string): string => {
    const encodedPlace = encodeURIComponent(place.trim());
    return `https://www.google.com/maps/search/?api=1&query=${encodedPlace}`;
  };

  const formatMessage = (text: string): string => {
    if (!text) return '';

    let formattedText = text
      // Format headers with emojis
      .replace(/^(Day \d+:.*)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      
      // Format location names with icons and verification badges
      .replace(/(?:✈️|🛫)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">✈️</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      .replace(/(?:🏨|🏰)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🏨</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      .replace(/(?:🍽️|🍴)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🍽️</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      .replace(/(?:🏛️|⛪)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">🏛️</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      .replace(/(?:📍)\s+([^,\n]+)/g, '<div class="flex items-center gap-2 my-2"><span class="text-xl">📍</span><span class="font-medium">$1</span><span class="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full ml-1"><svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></span></div>')
      
      // Format section headers
      .replace(/^#\s+([^\n]+)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      
      // Format bullet points
      .replace(/^\*\s+([^\n]+)/gm, '<div class="flex items-start gap-2 my-2"><span class="text-gray-400 mt-1">•</span><span class="flex-1">$1</span></div>')
      
      // Format time indicators
      .replace(/(?:🌞|🌅)\s+\*\*([^*]+)\*\*:/g, '<div class="flex items-center gap-2 mt-4 mb-2"><span class="text-xl">$1</span><span class="font-semibold text-gray-700">$2:</span></div>')
      
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
      // Format paragraphs
      .replace(/([^\n]+)(?:\n|$)/g, '<p class="my-2">$1</p>');

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

    return (
      <div className="bg-gray-50 rounded-2xl rounded-bl-[4px] p-4">
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
    
    // Поиск города назначения
    const destinationPatterns = [
      /(?:в|во|до)\s+([A-Za-zА-Яа-я\s-]+)(?:\s+на|$)/i,
      /прилет\s+в\s+([A-Za-zА-Яа-я\s-]+)/i,
      /найди.*?(?:в|до)\s+([A-Za-zА-Яа-я\s-]+)/i
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
    const destination = destinationPatterns.map(pattern => message.match(pattern)?.[1]?.trim()).find(Boolean);
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
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Если дата в формате DD.MM.YYYY
    if (dateStr.match(/^\d{1,2}\.\d{1,2}(?:\.\d{4})?$/)) {
      const [day, month, year = new Date().getFullYear()] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const months: { [key: string]: string } = {
      'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
      'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
      'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
      'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04',
      'май': '05', 'июн': '06', 'июл': '07', 'авг': '08',
      'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12'
    };

    // Парсинг даты в формате "DD месяц YYYY" или "DD месяц"
    const match = dateStr.toLowerCase().match(/(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?/);
    if (match) {
      const [_, day, monthStr, year = new Date().getFullYear()] = match;
      const month = months[monthStr];
      if (!month) {
        console.error('Неверный формат месяца:', monthStr);
        return '';
      }
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }

    return '';
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      role: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Извлекаем информацию о перелете из сообщения пользователя
      const flightInfo = extractFlightInfo(inputText);
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
          role: msg.role,
          text: msg.text
        })),
        {
          role: 'user',
          text: inputText + flightData
        }
      ];

      const response = await fetch('/api/yandex-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from GPT');
      }

      const data = await response.json();
      
      // Добавляем ответ от GPT
      const assistantMessage: Message = {
        id: messages.length + 2,
        text: data.text,
        isUser: false,
        role: 'assistant'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.',
        isUser: false,
        role: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Добавляем функцию для извлечения локации из текста
  const extractLocationFromText = (text: string): string => {
    const locationMatch = text.match(/(?:в|во|для|про)\s+([А-Яа-я\-]+(?:\s+[А-Яа-я\-]+)*)/i);
    return locationMatch ? locationMatch[1] : 'Москва'; // По умолчанию используем Москву
  };

  const handleCreateTrip = (data: any) => {
    console.log('Creating trip with data:', data);
    setIsCreateTripModalOpen(false);
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
      if (section.includes('🎯 Рекомендации') || section.includes('🌟 Главные достопримечательности')) {
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

  const handleInviteFriends = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      // Handle inviting friends when user is authenticated
      console.log('Implement invite friends functionality');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
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
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        dateFilter.type === 'specific' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Даты
                    </button>
                    <button
                      onClick={() => setDateFilter({ type: 'duration' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        dateFilter.type === 'duration' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Длительность
                    </button>
                    <button
                      onClick={() => setDateFilter({ type: 'month' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        dateFilter.type === 'month' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Месяц
                    </button>
                  </div>
                </div>

                {dateFilter.type === 'specific' && (
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateFilter.startDate,
                      to: dateFilter.endDate
                    }}
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
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              dateFilter.duration === days
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
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
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            dateFilter.month?.month === i
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
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

            {/* TripGen Generate Button */}
            <div className="flex items-center gap-2">
            <button
              onClick={handleTripGenClick}
              className="flex-1 min-w-[160px] h-10 flex items-center justify-center gap-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <img src={AILogo} alt="TripGen" className="w-6 h-6" />
              TripGen Builder
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex min-h-0">
        <div className={`flex-1 flex flex-col min-h-0 ${showTripBuilder ? 'max-w-[calc(100%-600px)]' : ''}`}>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {messages.map((message) => (
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
                      ${message.isUser ? 'max-w-[320px]' : 'max-w-[85%]'}
                      w-full overflow-hidden
                    `}
                  >
                    {renderMessage(message)}
                    </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2">
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
                onClick={handleSendMessage} 
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
    </div>
  );
};

export default Chat; 