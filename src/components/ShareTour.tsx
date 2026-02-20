import { motion } from 'framer-motion';
import { Users, MessageSquare, Mail, MapPin, Camera, Calendar, Map } from 'lucide-react';

const ShareTour = () => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <section className="py-24 bg-white relative">
      {/* СКОРО Overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4 border border-gray-100"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">СКОРО</h3>
          <p className="text-gray-600 mb-4">
            Функция совместного планирования путешествий с друзьями находится в разработке
          </p>
          <span className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            Ожидается весной 2026
          </span>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg">Путешествуйте вместе</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-medium mb-4"
          >
            Планируйте маршрут с друзьями
            <span className="ml-3 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              СКОРО
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Приглашайте друзей и создавайте незабываемые путешествия вместе
          </motion.p>
        </div>

        {/* Основной контент */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Левая колонка - Возможности */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Карточка приглашения */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Пригласите друзей</h3>
                  <p className="text-gray-600">Отправьте приглашение или поделитесь ссылкой</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2.5 bg-black text-white text-sm rounded-xl hover:bg-gray-900 transition-colors text-center"
                >
                  Отправить email
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-900 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center"
                >
                  Копировать ссылку
                </motion.button>
              </div>
            </div>

            {/* Карточка обсуждения */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Обсуждайте детали</h3>
                  <p className="text-gray-600">Общайтесь и планируйте маршрут в групповом чате</p>
                </div>
              </div>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-black text-white text-sm rounded-xl hover:bg-gray-900 transition-colors text-center"
              >
                Открыть чат
              </motion.button>
            </div>

            {/* Карточка планирования */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Планируйте маршрут</h3>
                  <p className="text-gray-600">Отмечайте места и создавайте расписание</p>
                </div>
              </div>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-black text-white text-sm rounded-xl hover:bg-gray-900 transition-colors text-center"
              >
                Начать планирование
              </motion.button>
            </div>
          </motion.div>

          {/* Правая колонка - Превью */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-50 rounded-2xl p-6">
              {/* Превью маршрута */}
              <div className="rounded-xl overflow-hidden relative mb-6 aspect-[4/3]">
                <img 
                  src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&q=80"
                  alt="Друзья путешествуют"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-white mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Москва → Санкт-Петербург</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>7 дней</span>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="Участник" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="Участник" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" alt="Участник" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs font-medium">+2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Возможности */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mb-2">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm mb-0.5">Фотоотчеты</h4>
                  <p className="text-xs text-gray-500">Сохраняйте моменты</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mb-2">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm mb-0.5">Расписание</h4>
                  <p className="text-xs text-gray-500">Планируйте дни</p>
                </div>
              </div>

              {/* Действия */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-black text-white text-sm rounded-xl hover:bg-gray-900 transition-colors text-center"
              >
                Присоединиться к маршруту
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ShareTour; 