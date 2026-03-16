import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  Star, 
  ArrowLeft, 
  Check, 
  X, 
  Mountain,
  Utensils,
  Bed,
  Info,
  MessageSquare,
  Share2,
  Heart,
  Ticket
} from 'lucide-react';
import { getTourById } from '../data/readyTours';
import { MainNavbar } from '../components/MainNavbar';
import { Footer } from '../components/Footer';
import { BookingModal } from '../components/BookingModal';
import { useState } from 'react';

export function ReadyTourDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'includes'>('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const tour = id ? getTourById(id) : undefined;

  if (!tour) {
    return (
      <div className="min-h-screen bg-[#FBFBFD]">
        <MainNavbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Тур не найден</h1>
          <button
            onClick={() => navigate('/#tours')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к турам
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const difficultyLabels = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };
  
  const handleBookTour = () => {
    setIsBookingModalOpen(true);
  };

  const handleAskQuestion = () => {
    const query = `Вопрос организатору по туру "${tour.title}" в регионе ${tour.region}.`;
    navigate(
      `/chat?q=${encodeURIComponent(query)}&tourTitle=${encodeURIComponent(
        tour.title
      )}&newTour=1`
    );
  };

  const handleStartAiChat = () => {
    const query =
      `Я перешёл из детальной страницы тура "${tour.title}" в регионе ${tour.region}. ` +
      `Помоги как AI-ассистент подобрать и сравнить готовые туры на сайте TRIPGEN, ` +
      `а также ответить на вопросы по бронированию. Сначала задай пару уточняющих вопросов ` +
      `про даты, бюджет и формат отдыха, а потом предложи варианты туров.`;
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <MainNavbar />
      
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/#tours')}
          className="absolute top-20 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к турам
        </button>

        {/* Actions */}
        <div className="absolute top-20 right-4 md:right-8 flex gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  {tour.categoryName}
                </span>
                {tour.difficulty && (
                  <span className={`px-3 py-1 text-sm rounded-full ${difficultyColors[tour.difficulty]}`}>
                    {difficultyLabels[tour.difficulty]}
                  </span>
                )}
                {tour.reviews && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{tour.reviews.rating}</span>
                    <span className="text-sm opacity-80">({tour.reviews.count} отзывов)</span>
                  </div>
                )}
                {tour.spotsLeft <= 3 ? (
                  <div className="flex items-center gap-1 px-3 py-1 bg-red-500 rounded-full text-white">
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm font-medium">Осталось {tour.spotsLeft} {tour.spotsLeft === 1 ? 'место' : 'места'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-500 rounded-full text-white">
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm font-medium">{tour.spotsLeft} мест</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {tour.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{tour.location}, {tour.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg">
                    {new Date(tour.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(tour.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            >
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Clock className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Длительность</p>
                <p className="font-semibold text-gray-900">{tour.duration}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Users className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Группа</p>
                <p className="font-semibold text-gray-900">{tour.groupSize}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Calendar className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Даты тура</p>
                <p className="font-semibold text-gray-900">
                  {new Date(tour.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {new Date(tour.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Mountain className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Регион</p>
                <p className="font-semibold text-gray-900">{tour.region}</p>
              </div>
              <div className={`rounded-xl p-4 shadow-sm ${tour.spotsLeft <= 3 ? 'bg-red-50' : 'bg-green-50'}`}>
                <Ticket className={`w-5 h-5 mb-2 ${tour.spotsLeft <= 3 ? 'text-red-500' : 'text-green-500'}`} />
                <p className="text-sm text-gray-500">Осталось мест</p>
                <p className={`font-semibold ${tour.spotsLeft <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                  {tour.spotsLeft} {tour.spotsLeft === 1 ? 'место' : tour.spotsLeft <= 4 ? 'места' : 'мест'}
                </p>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="flex border-b">
                {[
                  { id: 'overview', label: 'Обзор' },
                  { id: 'itinerary', label: 'Программа' },
                  { id: 'includes', label: 'Что включено' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-gray-900 border-b-2 border-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">О туре</h3>
                      <p className="text-gray-600 whitespace-pre-line">{tour.description}</p>
                    </div>

                    {tour.highlights && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Основные моменты</h3>
                        <div className="flex flex-wrap gap-2">
                          {tour.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {tour.activities && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Активности</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tour.activities.map((activity) => (
                            <li key={activity} className="flex items-center gap-2 text-gray-600">
                              <Check className="w-4 h-4 text-green-500" />
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tour.accommodation && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Проживание</h3>
                        <div className="space-y-3">
                          {tour.accommodation.map((acc, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <Bed className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900">{acc.name}</p>
                                <p className="text-sm text-gray-500">{acc.type}</p>
                                <p className="text-sm text-gray-600 mt-1">{acc.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tour.guideInfo && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Гид</h3>
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tour.guideInfo.name}</p>
                            <p className="text-sm text-gray-500">{tour.guideInfo.experience}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Языки: {tour.guideInfo.languages.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'itinerary' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {tour.itinerary.map((day, index) => (
                      <div
                        key={day.day}
                        className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                          {day.day}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{day.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{day.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Utensils className="w-4 h-4" />
                            <span>{day.meals.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'includes' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Включено в стоимость</h3>
                      <ul className="space-y-2">
                        {tour.includes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-gray-600">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Не включено</h3>
                      <ul className="space-y-2">
                        {tour.excludes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-gray-600">
                            <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {tour.requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Требования</h3>
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <ul className="space-y-2">
                            {tour.requirements.map((req) => (
                              <li key={req} className="flex items-start gap-2 text-gray-700">
                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 space-y-4"
            >
              {/* Price Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Стоимость тура</p>
                  <p className="text-3xl font-bold text-gray-900">{tour.price}</p>
                  <p className="text-sm text-gray-500">за человека</p>
                </div>

                {/* Tour Dates */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-700">Даты тура</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    {new Date(tour.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — {new Date(tour.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Spots Left */}
                <div className={`mb-4 p-3 rounded-xl ${tour.spotsLeft <= 3 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                  <div className="flex items-center gap-2">
                    <Ticket className={`w-5 h-5 ${tour.spotsLeft <= 3 ? 'text-red-500' : 'text-green-500'}`} />
                    <span className={`font-medium ${tour.spotsLeft <= 3 ? 'text-red-700' : 'text-green-700'}`}>
                      {tour.spotsLeft <= 3 ? 'Осталось' : 'Доступно'}: {tour.spotsLeft} {tour.spotsLeft === 1 ? 'место' : tour.spotsLeft <= 4 ? 'места' : 'мест'}
                    </span>
                  </div>
                  {tour.spotsLeft <= 3 && (
                    <p className="text-xs text-red-600 mt-1">Спешите! Места заканчиваются</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBookTour}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Забронировать
                  </button>
                  <button
                    onClick={handleAskQuestion}
                    className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Задать вопрос
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Помощь с бронированием:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">AI-ассистент</p>
                      <p className="text-sm text-gray-500">Ответит за 30 секунд</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h4 className="font-semibold mb-2">Нужна помощь?</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Наш AI-ассистент поможет подобрать тур и ответит на все вопросы
                </p>
                <button
                  onClick={handleStartAiChat}
                  className="w-full py-3 bg-white/10 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Начать чат
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        tour={tour}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
}
