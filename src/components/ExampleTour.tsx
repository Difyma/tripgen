import { MapPin, Calendar, Users2, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TourStop {
  id: number;
  time: string;
  title: string;
  description: string;
  image: string;
  duration: string;
}

const ExampleTour = () => {
  const tourStops: TourStop[] = [
    {
      id: 1,
      time: "09:00",
      title: "Красная площадь",
      description: "Начните день с посещения главной площади страны. Осмотрите Собор Василия Блаженного, ГУМ и Кремль.",
      image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800",
      duration: "2 часа"
    },
    {
      id: 2,
      time: "11:30",
      title: "Парк Зарядье",
      description: "Современный парк с уникальной архитектурой и потрясающим видом на город. Посетите Парящий мост.",
      image: "https://images.unsplash.com/photo-1541447271487-09612b3f3555?w=800",
      duration: "1.5 часа"
    },
    {
      id: 3,
      time: "13:30",
      title: "Обед в Кафе Пушкинъ",
      description: "Насладитесь традиционной русской кухней в одном из самых известных ресторанов Москвы.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
      duration: "1.5 часа"
    }
  ];

  return (
    <section className="py-20 bg-[#FBFBFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/images/TRIPGEN_logo_2.png" alt="AI Assistant" className="w-6 h-6" />
            <span className="text-sm font-medium">AI TRIPGEN</span>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-semibold mb-4"
          >
            Умный планировщик маршрутов
          </motion.h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Искусственный интеллект анализирует ваши предпочтения и создает идеальный маршрут путешествия с учетом всех деталей.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Tour Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-1/2 bg-white rounded-3xl shadow-lg overflow-hidden"
          >
            {/* Tour Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-semibold">Московские контрасты</h3>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-black text-white rounded-full hover:bg-gray-900 transition-colors">
                  Создать маршрут
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <img src="/images/TRIPGEN_logo_2.png" alt="AI" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Рекомендация TRIPGEN</p>
                    <p className="text-sm text-gray-600">Маршрут оптимизирован по времени и расстоянию между локациями для максимального комфорта.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Москва</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>1 день</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4" />
                  <span>2-4 человека</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>5 часов</span>
                </div>
              </div>
            </div>

            {/* Tour Timeline */}
            <div className="p-6">
              <div className="space-y-6">
                {tourStops.map((stop, index) => (
                  <div key={stop.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      {index < tourStops.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 my-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{stop.time}</span>
                          <span className="px-2 py-1 bg-black text-white rounded-full text-xs">
                            {stop.duration}
                          </span>
                        </div>
                        <h4 className="text-lg font-medium mb-2">{stop.title}</h4>
                        <p className="text-gray-600 text-sm">{stop.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tour Footer */}
            <div className="p-6 bg-gray-50 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  <img src="/images/TRIPGEN_logo_white.png" alt="AI Assistant" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI TRIPGEN</p>
                  <p className="text-sm text-gray-600">Персональные рекомендации</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-colors">
                Начать планирование
              </button>
            </div>
          </motion.div>

          {/* Right Column - Map Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-1/2 relative"
          >
            <div className="sticky top-8 h-full rounded-3xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=1200"
                alt="Москва с высоты"
                className="w-full h-full object-cover"
              />
              {/* Map Points */}
              {tourStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="absolute z-20"
                  style={{
                    top: `${25 + (index * 25)}%`,
                    left: `${30 + (index * 15)}%`
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-black rounded-full" />
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-black rounded-full animate-ping opacity-20" />
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                      <div className="w-48">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{stop.time}</span>
                          <span className="text-xs text-gray-500">{stop.duration}</span>
                        </div>
                        <h5 className="text-sm font-medium">{stop.title}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* AI Analysis Overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 z-20">
                <div className="flex items-start gap-3">
                  <img src="/images/TRIPGEN_logo_2.png" alt="AI" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm font-medium mb-1">Оптимальный маршрут</p>
                    <p className="text-xs text-gray-600">Маршрут построен с учетом пробок, времени работы и загруженности мест. Расстояние между точками оптимизировано для комфортной прогулки.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ExampleTour; 