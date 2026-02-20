'use client';

import { motion } from 'framer-motion';
import { MessageSquare, MapPin, Calendar } from 'lucide-react';

const HowItWorks = () => {
  return (
    <section className="pt-12 pb-8 bg-white overflow-visible">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          {/* Left Content */}
          <motion.div 
            className="lg:w-1/2 lg:pr-20 mb-12 lg:mb-0"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold mb-8">
              Как это работает
            </h2>
            <div className="text-xl text-gray-600 space-y-6">
              <p>
                Планируйте своё идеальное путешествие с помощью простого и интуитивно понятного сервиса. Мы поможем вам создать незабываемые впечатления и подобрать лучшие маршруты.
              </p>
              <p>
                Выберите направление, даты и интересующие активности — всё остальное мы сделаем за вас!
              </p>
            </div>
            <div className="mt-8 flex">
              <a
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-base font-medium shadow-lg hover:bg-gray-900 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Начать в чате
              </a>
            </div>
          </motion.div>

          {/* Right Images Grid */}
          <div className="lg:w-1/2 relative h-[500px]">
            {/* Activity Cards */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-4 w-40 h-40 md:w-56 md:h-56"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative group">
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80"
                    alt="Search"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 left-4 px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium text-sm">Общение</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute right-1/2 translate-x-1/2 top-4 w-40 h-40 md:w-56 md:h-56"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative group">
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80"
                    alt="Calendar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 right-4 px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium text-sm">Выбор дат</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-[60%] -translate-y-1/2 w-36 h-36 md:w-52 md:h-52"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative group">
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&q=80"
                    alt="Activities"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 left-4 px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium text-sm">Активности</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute right-1/2 translate-x-1/2 top-[60%] -translate-y-1/2 w-36 h-36 md:w-52 md:h-52"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative group">
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
                    alt="Journey"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 right-4 px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium text-sm">Начать путешествие</span>
                </div>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border-2 border-gray-100/30 -z-10"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border-2 border-gray-100/50 -z-10"></div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 