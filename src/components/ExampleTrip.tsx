import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users2, Clock } from 'lucide-react';

interface TourStop {
  id: number;
  time: string;
  title: string;
  description: string;
  image: string;
  duration: string;
}

const ExampleTrip = () => {
  return (
    <section className="py-32 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">
            Примеры маршрутов
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Посмотрите, какие уникальные путешествия мы создаем для наших клиентов
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Алтай */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1634553569595-6bd04eae3187?w=1200&q=80"
                alt="Алтай"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-3xl flex flex-col justify-end p-8">
              <h3 className="text-2xl font-semibold mb-2">7 дней на Алтае</h3>
              <p className="text-gray-300">От 85 000 ₽</p>
            </div>
          </motion.div>

          {/* Байкал */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551845041-63e8e76836ea?w=1200&q=80"
                alt="Байкал"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-3xl flex flex-col justify-end p-8">
              <h3 className="text-2xl font-semibold mb-2">5 дней на Байкале</h3>
              <p className="text-gray-300">От 65 000 ₽</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-16 text-center"
        >
          <a
            href="#trip-form"
            className="inline-block px-8 py-4 bg-white text-black rounded-full text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Создать свой маршрут
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ExampleTrip; 