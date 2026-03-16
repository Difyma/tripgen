import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TravelArticleHeroCta } from '../../data/travelArticleTypes';

interface TravelArticleHeroProps {
  title: string;
  image: string;
  date: string;
  readTime?: string;
  author?: string;
  /** CTA-бар под заголовком: кнопка + чипы (только для лендинговых статей) */
  heroCta?: TravelArticleHeroCta;
}

export function TravelArticleHero({ title, image, date, readTime, author, heroCta }: TravelArticleHeroProps) {
  const navigate = useNavigate();

  return (
    <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
      <img src={image} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <button
        type="button"
        onClick={() => navigate('/blog')}
        className="absolute top-20 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        К блогу
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-3">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/85 mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readTime}
                </span>
              )}
              {author && <span>{author}</span>}
            </div>

            {heroCta && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <Link
                  to={heroCta.primaryHref}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm md:text-base"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  {heroCta.primaryLabel}
                </Link>
                {heroCta.chips && heroCta.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {heroCta.chips.map((chip) => (
                      <Link
                        key={chip.label}
                        to={chip.href}
                        className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
                      >
                        {chip.label}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
