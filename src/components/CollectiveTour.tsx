import { motion } from 'framer-motion';
import { Users, MessageSquare, Link2, Calendar, MapPin, Share2 } from 'lucide-react';
import { FC } from 'react';

const CollectiveTour: FC = () => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 py-24">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-medium mb-6 flex items-center justify-center gap-3 flex-wrap"
          >
            Делитесь с друзьями и семьей
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              СКОРО
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-600 text-lg"
          >
            Совместное планирование путешествия с друзьями и семьей никогда не было таким веселым и простым. Просто пригласите их проверить ваш маршрут или сразу окунитесь в процесс планирования вместе.
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">+3</span>
                    </div>
                  </div>
                  <span className="font-medium">TripGen Planning</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                      <p className="text-sm">Как насчет того, чтобы мы начали в Париже, а затем отправились в Ниццу? 🇫🇷</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">2:45 PM</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 text-right">
                    <div className="bg-black text-white rounded-2xl rounded-tr-none p-4 inline-block">
                      <p className="text-sm">Отлично! Я посмотрю, какие отели 🏨</p>
                    </div>
                    <span className="block text-xs text-gray-500 mt-1">2:47 PM</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Открыть чат</span>
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Скопировать ссылку</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Ocean Background */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=80"
              alt="Ocean view"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
            
            {/* Feature Badges */}
            <div className="absolute top-6 left-6 right-6 flex flex-wrap gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Групповое планирование</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Синхронизация расписания</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Обновления в реальном времени</span>
              </div>
            </div>

            {/* Friends Photos */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      <img 
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80" 
                        alt="Friend" 
                        className="w-10 h-10 rounded-lg border-2 border-white object-cover relative z-30"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80"
                        alt="Friend"
                        className="w-10 h-10 rounded-lg border-2 border-white object-cover relative z-20"
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80"
                        alt="Friend"
                        className="w-10 h-10 rounded-lg border-2 border-white object-cover relative z-10"
                      />
                      <div className="w-10 h-10 rounded-lg border-2 border-white bg-black flex items-center justify-center relative z-0">
                        <span className="text-white text-xs font-medium">+4</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Путешествие на Бали</p>
                      <p className="text-xs text-gray-500">7 друзей присоединились</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-black text-white text-sm rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    Присоединиться
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CollectiveTour; 