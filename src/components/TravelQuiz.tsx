'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import TravelQuizModal from './TravelQuizModal';

interface QuizResults {
  travelStyle: string;
  preferences: string[];
  budget: string;
}

const TravelQuiz = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleQuizComplete = (results: QuizResults) => {
    console.log('Quiz results:', results);
    // Here you can handle the quiz results, for example:
    // - Send them to an API
    // - Update user preferences
    // - Show personalized recommendations
    setIsModalOpen(false);
  };

  return (
    <section className="py-20 bg-[#FBFBFD]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] lg:aspect-auto lg:h-[600px] -ml-[50vw] pl-[50vw]"
          >
            <div className="absolute inset-4 right-4 left-0 rounded-r-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80"
                alt="Luxury travel experience"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute inset-0 right-4 left-0 bg-black/5 rounded-r-3xl -z-10 transform translate-x-4 translate-y-4" />
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:pl-12 px-4 sm:px-0"
          >
            <h2 className="text-4xl lg:text-5xl font-semibold mb-6 tracking-tight text-center lg:text-left">
              Какой вы путешественник ?
            </h2>
            <p className="text-xl text-gray-600 mb-8 text-center lg:text-left">
              Пройдите наш быстрый тест, и мы подберем идеальные направления и активности, 
              основываясь на ваших предпочтениях и стиле путешествий.
            </p>
            
            <div className="flex justify-center lg:justify-start">
              <motion.button
                onClick={handleOpenModal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Пройти тест
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Features */}
            <div className="mt-12 grid gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Минуты на прохождение</h3>
                  <p className="text-gray-600">Быстрый тест для точных рекомендаций</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-semibold">5</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Простых вопросов</h3>
                  <p className="text-gray-600">Определим ваш идеальный стиль путешествий</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Travel Quiz Modal */}
      <TravelQuizModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onComplete={handleQuizComplete}
      />
    </section>
  );
};

export default TravelQuiz; 