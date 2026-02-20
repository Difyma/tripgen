import { motion } from 'framer-motion';
import { useState } from 'react';
import { Globe, DollarSign, Users, Star, ChevronRight, ArrowRight, MapPin, Briefcase, Calendar, Award } from 'lucide-react';
import { MainNavbar } from './MainNavbar';
import Footer from './Footer';
import { CreatorForm } from './CreatorForm';
import { AuthModal } from './AuthModal';

const benefits = [
  {
    icon: Globe,
    title: 'Прямые клиенты',
    description: 'Получайте заявки от путешественников со всей России, ищущих готовые туры'
  },
  {
    icon: DollarSign,
    title: 'Никакой комиссии',
    description: '0% комиссии платформы — все деньги от бронирований идут напрямую вам'
  },
  {
    icon: Users,
    title: 'Готовая аудитория',
    description: 'Доступ к тысячам пользователей, которые уже ищут туры по России'
  },
  {
    icon: Star,
    title: 'Репутация и отзывы',
    description: 'Собирайте отзывы от туристов и становитесь топовым гидом или туроператором'
  }
];

const requirements = [
  'Опыт проведения туров от 1 года',
  'Лицензия туроператора или статус гида',
  'Готовые маршруты и программы',
  'Фото и видеоматериалы туров',
  'Готовность работать с онлайн-бронированиями'
];

const earningWays = [
  {
    icon: MapPin,
    title: 'Продажа готовых туров',
    description: 'Размещайте свои авторские туры и получайте 100% стоимости бронирования',
    percentage: '100%'
  },
  {
    icon: Briefcase,
    title: 'Корпоративные заказы',
    description: 'Получайте заявки на организацию корпоративных мероприятий и тимбилдингов',
    percentage: 'VIP'
  },
  {
    icon: Calendar,
    title: 'Индивидуальные маршруты',
    description: 'Создавайте персонализированные туры под запросы конкретных клиентов',
    percentage: 'Заказ'
  },
  {
    icon: Award,
    title: 'Премиум-размещение',
    description: 'Выделите свои туры в топе выдачи и получайте больше просмотров',
    percentage: 'Топ'
  }
];

const inspirationSteps = [
  {
    number: '01',
    title: 'Зарегистрируйтесь',
    description: 'Создайте профиль гида или туроператора, заполнив информацию о себе и своих турах'
  },
  {
    number: '02',
    title: 'Разместите туры',
    description: 'Добавьте свои маршруты с фото, описанием, программой и ценами'
  },
  {
    number: '03',
    title: 'Получайте бронирования',
    description: 'Клиенты бронируют туры напрямую, а вы получаете уведомления и оплату'
  }
];

const CreatorPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <MainNavbar onAuthClick={handleAuthClick} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
                  Размещайте свои туры.<br />
                  Получайте клиентов.<br />
                  Зарабатывайте.
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  TripGen — это платформа для гидов и туроператоров, где вы можете разместить свои туры и получать прямых клиентов без комиссии.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-all inline-flex items-center gap-2"
                  onClick={() => setIsFormOpen(true)}
                >
                  Разместить туры
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80"
                    alt="Tour guide in mountains"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg max-w-xs">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">🏔️</span>
                    </div>
                    <div>
                      <div className="font-medium">Алексей Горный</div>
                      <div className="text-sm text-gray-500">Гид по Алтаю</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    "За 6 месяцев на TripGen я получил 45 бронирований на свои туры"
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
                Преимущества для гидов и туроператоров
              </h2>
              <p className="text-xl text-gray-600">
                Развивайте свой турбизнес вместе с TripGen
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
                Несколько способов монетизации ваших туров
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
                  <h3 className="text-2xl font-bold mb-2">Станьте партнером TripGen</h3>
                  <p className="text-gray-300">Получите персонального менеджера и приоритетную поддержку</p>
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
                { number: '200+', label: 'Гидов и туроператоров' },
                { number: '₽50K+', label: 'Средний доход за тур' },
                { number: '15K+', label: 'Бронирований в месяц' }
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
                    src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80"
                    alt="Tour guide with group"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 right-6 bg-white p-6 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 text-lg font-medium">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span>4.9/5 средний рейтинг гидов</span>
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
                  Начните продавать туры<br />уже сегодня
                </h2>
                <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                  Присоединяйтесь к платформе, где тысячи путешественников ищут готовые туры по России
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
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="group bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-all inline-flex items-center gap-2"
                  >
                    Разместить туры
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
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80"
                    alt="Tour group in nature"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-lg max-w-xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <div className="font-medium">Мария Иванова</div>
                      <div className="text-sm text-gray-500">Туроператор</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">За месяц</div>
                      <div className="text-xl font-bold">23 бронирования</div>
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
                Готовы получать новых клиентов?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-300 mb-8"
              >
                Присоединяйтесь к TripGen и начните продавать свои туры уже сегодня
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFormOpen(true)}
                className="group bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-all inline-flex items-center gap-2"
              >
                Подать заявку
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </section>

        <CreatorForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      </div>
      <Footer />
    </>
  );
};

export default CreatorPage;
