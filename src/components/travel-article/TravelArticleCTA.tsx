import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export function TravelArticleCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-white py-16 md:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-6">
          <MessageCircle className="w-14 h-14 text-gray-800 mx-auto" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
          Планируйте поездку с TRIPGEN
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Составьте персональный маршрут за минуту с помощью ИИ — отели, достопримечательности и советы под ваш бюджет и даты.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full text-base font-medium hover:bg-gray-900 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Создать маршрут
        </Link>
      </div>
    </motion.section>
  );
}
