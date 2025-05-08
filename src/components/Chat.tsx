import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Users,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CreateTripModal } from './CreateTripModal';
// import AILogo from '../images/TRIPGEN_logo_2.png';
const AILogo = '/images/TRIPGEN_logo_2.png';
import TripBuilder from './TripBuilder';

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

const SYSTEM_PROMPT = `Ты — профессиональный турагент по путешествиям по России. Твоя задача — давать краткие, структурированные рекомендации.

Формат ответа:
# ⏱️ Оптимальная продолжительность
• Рекомендуемое количество дней: [число] дней
• Минимум для осмотра основных мест: [число] дней
• Комфортный темп осмотра: [число] дней
• Для полного погружения: [число] дней

# 🎯 Рекомендации
✈️ [Место](airport) — краткое описание
🏨 [Отель](hotel) — краткое описание
🍽️ [Ресторан](restaurant) — краткое описание
🎯 [Достопримечательность](attraction) — краткое описание

# 🌟 Главные достопримечательности
• 🏛️ [Музей](museum) — что особенного
• 👑 [Дворец](palace) — что особенного
• 🌳 [Парк](park) — что особенного
• 🎯 [Достопримечательность](attraction) — что особенного

# 🍽️ Где поесть
• 🍽️ [Ресторан](restaurant) — кухня, ценовой диапазон
• ☕ [Кафе](cafe) — особенности, атмосфера

# 🏨 Где остановиться
• 🏨 [Отель](hotel) — уровень, особенности
• 🏨 [Отель](hotel) — уровень, особенности

# ❓ Уточняющие вопросы
1. На сколько дней планируете поездку?
2. Какой бюджет на человека?
3. Что больше интересует: история, природа, активный отдых?
4. В каком темпе предпочитаете осматривать достопримечательности?

Правила для рекомендации продолжительности:
1. Учитывай размер города/региона
2. Учитывай количество достопримечательностей
3. Учитывай расстояния между местами
4. Учитывай сезон и погоду
5. Предлагай варианты для разных темпов осмотра
6. Если место большое (например, Москва) - предлагай больше дней
7. Если место компактное - предлагай меньше дней
8. Учитывай время на дорогу и акклиматизацию

Доступные типы мест:
- museum (музей) 🏛️
- palace (дворец) 👑
- park (парк) 🌳
- cafe (кафе) ☕
- restaurant (ресторан) 🍽️
- hotel (отель) 🏨
- airport (аэропорт) ✈️
- attraction (достопримечательность) 🎯

Правила:
1. Используй Markdown разметку (#, •, 1.)
2. Отмечай места с эмодзи и типом: ✈️ [Место](тип)
3. Давай краткие, но информативные описания
4. Добавляй эмодзи к заголовкам
5. Задавай уточняющие вопросы при необходимости`;

const Chat = () => {
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

  const handleBudgetChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [type]: value
      }
    }));
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

  const formatAIMessage = (text: string) => {
    // Check if the message contains recommendations that can be turned into an itinerary
    const hasRecommendations = text.includes('# 🎯 Рекомендации') || 
                              text.includes('# 🌟 Главные достопримечательности') ||
                              text.includes('# 🍽️ Где поесть');

    // Форматируем заголовки с эмодзи
    let formattedText = text
      .replace(
        /^(?:# |##\s*)([🎯🌟🍽️🏨❓📍⏱️][^\n]*)/gm,
        '<h3 class="flex items-center gap-2 text-[15px] font-semibold text-gray-900 mt-4 mb-2.5">$1</h3>'
      )
      .replace(
        /^(?:# |##\s*)([^\n]*)/gm,
        '<h3 class="text-[15px] font-semibold text-gray-900 mt-4 mb-2.5">$1</h3>'
      );

    // Форматируем места с иконками и верификацией
    formattedText = formattedText.replace(
      /(?:✈️|🏨|🍽️|🏰|🏛️|⛪|🎯|📍|[☕])\s+([^—\n]+?)(?:\s+(?:✓|✔️|☑️|✅|\(verified\)))?\s*(?:—|-)\s*([^\n]+)/g,
      (match, name, description) => {
        const placeUrl = generatePlaceUrl(name);
        const icon = match.charAt(0);
        return `<div class="flex items-start gap-2.5 mb-2">
          <a href="${placeUrl}" target="_blank" rel="noopener noreferrer" class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/50 border border-gray-100 hover:bg-white hover:border-gray-200 rounded-lg transition-all group">
            <span class="text-base group-hover:scale-110 transition-transform">${icon}</span>
            <span class="font-medium text-[14px] text-gray-900">${name}</span>
            <span class="inline-flex items-center justify-center w-3.5 h-3.5 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors">
              <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </span>
          </a>
          <span class="text-[14px] leading-[1.4] text-gray-600">${description}</span>
        </div>`;
      }
    );

    // Форматируем списки
    formattedText = formattedText
      .replace(
        /^[•*-]\s+([^\n]+)/gm,
        '<div class="flex items-start gap-2 mb-1.5"><span class="text-gray-400 mt-0.5 text-sm">•</span><span class="flex-1 text-[14px] leading-[1.4] text-gray-600">$1</span></div>'
      )
      .replace(
        /^(\d+)\.\s+([^\n]+)/gm,
        '<div class="flex items-start gap-2 mb-1.5"><span class="text-gray-400 shrink-0 text-[14px]">$1.</span><span class="flex-1 text-[14px] leading-[1.4] text-gray-600">$2</span></div>'
      );

    // Форматируем оставшиеся параграфы
    formattedText = formattedText
      .replace(/\n{2,}/g, '\n\n')
      .replace(/([^>])\n\n/g, '$1</p><p class="text-[14px] leading-[1.4] text-gray-600 mb-2">')
      .replace(/^([^<\n][^\n]*(?:\n(?!<)[^\n]+)*)/gm, '<p class="text-[14px] leading-[1.4] text-gray-600 mb-2">$1</p>');

    const createRouteButton = hasRecommendations ? `
      <div class="mt-4">
        <button onclick="window.createRoute()" class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Создать маршрут
        </button>
      </div>
    ` : '';

    return `<div class="space-y-1">${formattedText}${createRouteButton}</div>`;
  };

  const handleSendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      try {
        setIsLoading(true);
        
        // Check if message contains duration
        const durationMatch = inputText.match(/на (\d+) д[еня]/i);
        if (durationMatch && filters.location) {
          const duration = parseInt(durationMatch[1]);
          setDateFilter({
            type: 'duration',
            duration: duration
          });
          generateItinerary(filters.location, duration);
        }

        // Add user's message
        const userMessage: Message = {
          id: Date.now(),
          text: inputText,
          isUser: true,
          role: 'user'
        };
        setMessages(prev => [...prev, userMessage]);

        // Get last 5 messages for context
        const recentMessages = messages
          .slice(-5)
          .map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            text: msg.text
          }));
        
        const areFiltersEmpty = () => {
          return !filters.location && 
                 !filters.date && 
                 filters.travelers <= 1 && 
                 filters.budget.min === 0 && 
                 filters.budget.max === 10000;
        };

        const messageWithContext = {
          modelUri: `gpt://yandexgpt/latest`,
          completionOptions: {
            stream: true,
            temperature: 0.7,
            maxTokens: 1000,
            partialResults: true,
          },
          messages: [
            {
              role: 'system',
              text: SYSTEM_PROMPT
            },
            ...recentMessages,
            {
              role: 'user',
              text: `Контекст запроса:
${filters.location ? `🌍 Место: ${filters.location}` : ''}
${filters.date ? `📅 Даты: ${format(new Date(filters.date), 'dd.MM.yyyy')}` : ''}
${filters.travelers ? `👥 Количество путешественников: ${filters.travelers}` : ''}
${filters.budget.min > 0 || filters.budget.max < 10000 ? `💰 Бюджет: ${filters.budget.min}₽ - ${filters.budget.max}₽` : ''}

Параметры для учета в рекомендациях:
${filters.location ? `- Все места и активности в локации: ${filters.location}` : ''}
${filters.date ? `- Рекомендации актуальны для даты ${format(new Date(filters.date), 'dd.MM.yyyy')} (учитывай сезон и погоду)` : ''}
${filters.travelers > 1 ? `- Подбор активностей для группы из ${filters.travelers} человек` : ''}
${filters.budget.min > 0 || filters.budget.max < 10000 ? `- Все рекомендации в диапазоне ${filters.budget.min}₽ - ${filters.budget.max}₽` : ''}

Вопрос пользователя: ${inputText}

${areFiltersEmpty() ? 'Если нужно что-то уточнить - задай вопросы.' : 'Основные параметры указаны, дай конкретные рекомендации по существу без уточняющих вопросов.'}`
            }
          ]
        };

        let accumulatedText = '';
        let lastReceivedText = '';
        let questionMessageId: number | null = null;

        const extractQuestions = (text: string) => {
          // Ищем секцию с вопросами (после эмодзи ❓ или слова "Уточняющие вопросы")
          const questionsMatch = text.match(/(?:# ❓|# Уточняющие вопросы:?)([^]*?)(?=$)/i);
          if (questionsMatch && areFiltersEmpty()) {
            // Если фильтры пустые, показываем вопросы
            const mainText = text.replace(questionsMatch[0], '');
            const questions = `# ❓ Уточняющие вопросы${questionsMatch[1]}`.trim();
            return { mainText, questions };
          }
          // Если фильтры заполнены, не показываем секцию с вопросами
          return null;
        };

        // Add initial AI message
        const aiMessageId = Date.now() + 1;
        const aiMessage: Message = {
          id: aiMessageId,
          text: '',
          isUser: false,
          role: 'assistant'
        };
        setMessages(prev => [...prev, aiMessage]);

        try {
          // Call Yandex GPT API with streaming
          const response = await fetch('http://localhost:3001/yandex-gpt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageWithContext)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response from API');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('Failed to get response reader');
          }

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('Received SSE data:', data);
                  
                  if (data.type === 'chunk' && data.text && data.text !== lastReceivedText) {
                    lastReceivedText = data.text;
                    
                    // Проверяем наличие уточняющих вопросов
                    const extracted = extractQuestions(data.text);
                    if (extracted) {
                      // Обновляем основной текст
                      accumulatedText = extracted.mainText;
                      setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { ...msg, text: accumulatedText }
                          : msg
                      ));
                      
                      // Обновляем или создаем сообщение с вопросами
                      if (questionMessageId) {
                        // Если сообщение с вопросами уже существует, обновляем его
                        setMessages(prev => prev.map(msg =>
                          msg.id === questionMessageId
                            ? { ...msg, text: extracted.questions }
                            : msg
                        ));
                      } else {
                        // Создаем новое сообщение с вопросами
                        const newQuestionId = Date.now();
                        questionMessageId = newQuestionId;
                        const questionMessage: Message = {
                          id: newQuestionId,
                          text: extracted.questions,
                          isUser: false,
                          role: 'assistant'
                        };
                        setMessages(prev => [...prev, questionMessage]);
                      }
                    } else {
                      accumulatedText = data.text;
                      setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { ...msg, text: accumulatedText }
                          : msg
                      ));
                    }

                    // Show TripBuilder if the message contains day-by-day itinerary
                    if (data.text.includes('Day 1:') || data.text.includes('День 1:')) {
                      setShowTripBuilder(true);
                      setCurrentMessage(data.text);
                    }
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                  throw e;
                }
              }
            }
          }

          setInputText('');
        } catch (error) {
          const err = error as Error;
          console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
          });
          // Add error message
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: `Ошибка: ${err.message}` }
              : msg
          ));
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        const err = error as Error;
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        // Add error message
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "Извините, возникла проблема с получением ответа. Пожалуйста, попробуйте позже.",
          isUser: false
        }]);
      }
    }
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
            <div className="relative flex-1 min-w-[160px]">
              <div className="w-full h-10 pl-8 pr-3 border border-gray-200 rounded-lg text-sm bg-gray-50/50 flex items-center justify-between">
                <Users className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                <span className="text-gray-600">{filters.travelers} человек</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleTravelersChange(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                    disabled={filters.travelers <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleTravelersChange(true)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

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
                          src={AILogo} 
                          alt="TRIPGEN Assistant" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <div 
                    className={`
                      ${message.isUser ? 'items-end' : 'items-start'}
                      ${message.isUser ? 'max-w-[320px]' : 'max-w-[75%]'}
                    `}
                  >
                    <div 
                      className={`
                        relative
                        w-full
                        ${message.isUser 
                          ? 'bg-black text-white rounded-[20px] rounded-br-[4px] px-4 py-3' 
                          : 'bg-gray-50 rounded-2xl rounded-bl-[4px] p-3'
                        }
                      `}
                    >
                      <div 
                        className={`
                          ${message.isUser ? 'text-white' : 'text-gray-900'}
                          text-[14px] leading-tight tracking-[-0.2px]
                          font-normal
                          [&>div]:last:mb-0
                          [&_h3]:text-[16px]
                          [&_h3]:font-semibold
                          [&_h3]:tracking-[-0.4px]
                          [&_h3]:mb-1
                          [&>div]:mb-1.5
                          [&_button]:transition-all
                          [&_button]:duration-200
                          [&_button]:ease-in-out
                          [&_button.inline-flex]:items-center
                          [&_button.inline-flex]:gap-1
                          [&_button]:bg-white
                          [&_button]:border
                          [&_button]:border-gray-100
                          [&_button]:shadow-sm
                          [&_button:hover]:bg-white
                          [&_button:hover]:border-gray-200
                          [&_p]:mb-1
                          [&_p]:last:mb-0
                          [&_p]:leading-snug
                          [&_ul]:mt-0.5
                          [&_ul]:mb-1
                          [&_li]:mb-0.5
                          [&_li]:leading-snug
                          whitespace-pre-wrap
                        `}
                        dangerouslySetInnerHTML={
                          message.isUser 
                            ? { __html: `<p class="text-[15px] font-medium leading-snug">${message.text}</p>` }
                            : { __html: formatAIMessage(message.text) }
                        }
                      />
                    </div>
                  </div>
                  {message.isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t border-gray-100 p-4 bg-white">
            <div className="max-w-6xl mx-auto flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Ask anything..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl border border-gray-100 focus:border-gray-200 transition-colors duration-200 focus:outline-none text-[15px] tracking-[-0.2px]"
                  disabled={isLoading}
                />
                <Plus className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              <button 
                onClick={handleSendMessage} 
                className={`
                  p-3 rounded-xl transition-colors duration-200
                  ${isLoading 
                    ? 'bg-gray-50 cursor-not-allowed' 
                    : 'hover:bg-gray-100 active:bg-gray-200'
                  }
                `}
                disabled={isLoading}
              >
                <Send className={`w-5 h-5 ${isLoading ? 'text-gray-300' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar / TripBuilder */}
        {showTripBuilder ? (
          <TripBuilder
            message={currentMessage}
            location={filters.location || 'Your Destination'}
            duration={filters.date ? format(new Date(filters.date), 'dd.MM.yyyy') : '7 days'}
            travelers={filters.travelers}
            onClose={() => setShowTripBuilder(false)}
          />
        ) : (
          <div className="w-96 border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">For you in Innenstadt</h2>
                <button className="flex items-center gap-1 text-sm text-gray-600">
                  Map
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-2">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="group cursor-pointer">
                      <div className="aspect-square rounded-xl overflow-hidden mb-2">
                        <img 
                          src={rec.image} 
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-xs truncate">{rec.title}</h3>
                      <p className="text-xs text-gray-500">{rec.type}</p>
                    </div>
                  ))}
                </div>

                <h2 className="text-lg font-semibold pt-4">Jump back in</h2>
                <div className="grid grid-cols-3 gap-2">
                  {jumpBackItems.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-square rounded-xl overflow-hidden mb-2">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-xs font-medium truncate">{item.title}</h3>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <h2 className="text-lg font-semibold">Get inspired</h2>
                  <button className="text-sm text-gray-600">See all</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {inspiredItems.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-square rounded-xl overflow-hidden mb-2">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-xs font-medium truncate">{item.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onSubmit={handleCreateTrip}
      />
    </div>
  );
};

export default Chat; 