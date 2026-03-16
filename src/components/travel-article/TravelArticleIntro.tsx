import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { TravelArticleIntroCard } from '../../data/travelArticleTypes';

interface TravelArticleIntroProps {
  paragraphs: string[];
  /** Карточки справа (двухколоночный блок в стиле лендинга) */
  introCards?: TravelArticleIntroCard[];
}

export function TravelArticleIntro({ paragraphs, introCards }: TravelArticleIntroProps) {
  const hasCards = introCards && introCards.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="bg-[#FBFBFD] py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className={`max-w-6xl mx-auto ${hasCards ? 'flex flex-col lg:flex-row gap-10 lg:gap-14 items-start' : ''}`}>
        {/* Левая колонка: текст + CTA */}
        <div className={hasCards ? 'lg:flex-1 lg:max-w-xl' : 'max-w-3xl mx-auto text-center'}>
          {hasCards && (
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider block mb-3">
              01 Подборка
            </span>
          )}
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={`text-lg md:text-xl text-gray-700 leading-relaxed mb-4 last:mb-0 ${!hasCards ? '' : 'text-left'}`}
            >
              {p}
            </p>
          ))}
          {hasCards && (
            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Создать маршрут
            </Link>
          )}
        </div>

        {/* Правая колонка: карточки с фото */}
        {hasCards && (
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {introCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <span className="text-white font-semibold text-sm md:text-base drop-shadow-md">
                      {card.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
