import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, DollarSign, Users, Star, ChevronRight, ArrowRight, Coins, Gift, Share2, Trophy, Users2, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import CreatorNavbar from './CreatorNavbar';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: Globe,
    title: 'Глобальная аудитория',
    description: 'Делитесь своими путешествиями с людьми со всего мира'
  },
  {
    icon: DollarSign,
    title: 'Монетизация',
    description: 'Зарабатывайте на своих путешествиях и рекомендациях'
  },
  {
    icon: Users,
    title: 'Сообщество',
    description: 'Станьте частью сообщества путешественников и создателей контента'
  },
  {
    icon: Star,
    title: 'Эксклюзивные возможности',
    description: 'Получите доступ к специальным предложениям и мероприятиям'
  }
];

const requirements = [
  'Опыт путешествий и создания контента',
  'Качественные фото и видеоматериалы',
  'Умение интересно рассказывать о местах',
  'Активность в социальных сетях',
  'Желание делиться опытом'
];

const earningWays = [
  {
    icon: Coins,
    title: 'Комиссия с бронирований',
    description: 'Получайте процент от каждого бронирования по вашим рекомендациям отелей, туров и активностей',
    percentage: '10%'
  },
  {
    icon: Gift,
    title: 'Эксклюзивные предложения',
    description: 'Создавайте специальные предложения и промокоды для ваших подписчиков',
    percentage: '15%'
  },
  {
    icon: Share2,
    title: 'Партнерские программы',
    description: 'Зарабатывайте на рекомендациях авиабилетов, страховок и других туристических услуг',
    percentage: '8%'
  },
  {
    icon: Trophy,
    title: 'Бонусная программа',
    description: 'Получайте дополнительные бонусы за активность и качественный контент',
    percentage: '+5%'
  }
];

const inspirationSteps = [
  {
    number: '01',
    title: 'Создавайте маршруты',
    description: 'Делитесь своими любимыми местами и создавайте уникальные маршруты путешествий'
  },
  {
    number: '02',
    title: 'Вдохновляйте других',
    description: 'Ваши истории и рекомендации помогут другим путешественникам открыть новые места'
  },
  {
    number: '03',
    title: 'Получайте доход',
    description: 'Зарабатывайте на бронированиях и рекомендациях от благодарных путешественников'
  }
];

const CreatorPage = () => {
  return (
    <>
      <CreatorNavbar />
      <div className="min-h-screen bg-[#FAFAFA] pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
          <div className="relative max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Создавайте контент.<br />
                  Вдохновляйте.<br />
                  Зарабатывайте.
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Станьте частью TripGen — платформы для креативных путешественников, которые хотят делиться своим опытом и зарабатывать на этом.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-all inline-flex items-center gap-2"
                >
                  Стать создателем
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80"
                    alt="Creator background"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg max-w-xs">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100" />
                    <div>
                      <div className="font-medium">Анна Петрова</div>
                      <div className="text-sm text-gray-500">Travel Creator</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    "TripGen помог мне превратить мою страсть к путешествиям в успешный бизнес"
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 tracking-tight">
                Преимущества для создателей
              </h2>
              <p className="text-xl text-gray-600">
                Откройте для себя новые возможности с TripGen
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Earning Ways Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 tracking-tight">
                Как зарабатывать на TripGen
              </h2>
              <p className="text-xl text-gray-600">
                Множество способов монетизации вашего контента
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {earningWays.map((way, index) => (
                <motion.div
                  key={way.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <way.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold">{way.title}</h3>
                        <span className="text-2xl font-bold text-green-500">{way.percentage}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{way.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Станьте VIP-создателем</h3>
                  <p className="text-gray-300">Получите доступ к повышенным комиссиям и эксклюзивным возможностям</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-all inline-flex items-center gap-2"
                >
                  Подробнее
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { number: '150+', label: 'Активных создателей' },
                { number: '₽50K+', label: 'Средний месячный доход' },
                { number: '1.2M', label: 'Просмотров в месяц' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group cursor-default"
                >
                  <div className="text-6xl font-bold mb-3 group-hover:text-gray-800 transition-colors">
                    {stat.number}
                  </div>
                  <p className="text-gray-600 text-lg">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-8 tracking-tight">
                  Что нужно для начала
                </h2>
                <ul className="space-y-6">
                  {requirements.map((req, index) => (
                    <motion.li
                      key={req}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                      <span className="text-lg text-gray-600">{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
                    alt="Creator working"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 right-6 bg-white p-6 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 text-lg font-medium">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span>4.9/5 рейтинг создателей</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Inspiration to Action Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-4 tracking-tight">
                  Превратите вдохновение<br />в действие
                </h2>
                <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                  Станьте частью сообщества креативных путешественников и начните делиться своими историями уже сегодня
                </p>

                <div className="space-y-12">
                  {inspirationSteps.map((step, index) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-8 group"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                          {step.number}
                        </div>
                        {index < inspirationSteps.length - 1 && (
                          <div className="absolute top-12 left-1/2 w-px h-12 bg-gray-200 transform -translate-x-1/2" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-12"
                >
                  <button className="group bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-all inline-flex items-center gap-2">
                    Начать создавать
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80"
                    alt="Creator inspiration"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-lg max-w-xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div>
                      <div className="font-medium">Михаил Смирнов</div>
                      <div className="text-sm text-gray-500">1.2M подписчиков</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">Доход за месяц</div>
                      <div className="text-xl font-bold">₽127,500</div>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold mb-6 tracking-tight"
              >
                Готовы начать свое путешествие?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-300 mb-8"
              >
                Присоединяйтесь к сообществу креативных путешественников уже сегодня
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-all inline-flex items-center gap-2"
              >
                Подать заявку
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CreatorPage; 