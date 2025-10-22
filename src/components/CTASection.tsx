'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative bg-white py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <div className="mb-6">
            <Heart className="w-16 h-16 text-red-500" />
          </div>
          
          <h2 className="text-2xl sm:text-5xl md:text-6xl font-semibold mb-6 tracking-tight break-words px-2">
            Хотите стать путешественником с помощью передовых технологий?
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          Присоединяйтесь к нам в незабываемом путешествии и откройте для себя самые захватывающие места.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-colors duration-300"
          >
            Стать путешественником
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection; 