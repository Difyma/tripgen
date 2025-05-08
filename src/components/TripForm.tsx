'use client';

import { motion } from 'framer-motion';
import { Sparkles, ClipboardList, Settings } from 'lucide-react';

const TripForm = () => {
  return (
    <section id="trip-form" className="py-20 bg-[#FBFBFD]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">
            Ваше путешествие
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Расскажите о своих предпочтениях, и мы создадим идеальный маршрут
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Куда хотите поехать?
                </label>
                <input
                  type="text"
                  placeholder="Например: Алтай, Байкал, Камчатка"
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваши интересы
                </label>
                <textarea
                  placeholder="Расскажите, что вам нравится: активный отдых, спокойный отдых, экскурсии..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бюджет
                  </label>
                  <input
                    type="text"
                    placeholder="Примерный бюджет"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Длительность
                  </label>
                  <input
                    type="text"
                    placeholder="Количество дней"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Создать маршрут
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              title: 'Персонализация',
              description: 'Маршрут создается с учетом ваших интересов и предпочтений',
              icon: Sparkles
            },
            {
              title: 'Детализация',
              description: 'Полное описание мест, активностей и рекомендаций',
              icon: ClipboardList
            },
            {
              title: 'Гибкость',
              description: 'Возможность корректировать маршрут в реальном времени',
              icon: Settings
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 relative shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute -top-3 left-6 px-3 py-1 bg-black text-white text-sm rounded-full">
                <feature.icon className="w-4 h-4 inline-block mr-1" />
                {feature.title}
              </div>
              <div className="pt-4">
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TripForm; 