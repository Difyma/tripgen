import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, Globe, DollarSign, Users, Star, TrendingUp, ChevronRight } from 'lucide-react';

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

const CreatorPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white py-32">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80"
            alt="Creator background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Станьте создателем контента в TripGen
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Делитесь своими путешествиями, вдохновляйте других и зарабатывайте на своем опыте
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Подать заявку
            </motion.button>
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
            <h2 className="text-4xl font-bold mb-4">
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
                className="bg-gray-50 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-2">150+</div>
              <p className="text-gray-600">Активных создателей</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-2">₽50K+</div>
              <p className="text-gray-600">Средний месячный доход</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-5xl font-bold mb-2">1.2M</div>
              <p className="text-gray-600">Просмотров в месяц</p>
            </motion.div>
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
              <h2 className="text-4xl font-bold mb-8">
                Что нужно для начала
              </h2>
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <motion.li
                    key={req}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                    <span>{req}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
                alt="Creator working"
                className="w-full h-full object-cover"
              />
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
              className="text-4xl font-bold mb-6"
            >
              Готовы начать?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-300 mb-8"
            >
              Присоединяйтесь к сообществу создателей контента TripGen и начните делиться своими путешествиями уже сегодня
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Подать заявку
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorPage; 