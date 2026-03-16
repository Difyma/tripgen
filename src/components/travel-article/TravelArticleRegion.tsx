import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle } from 'lucide-react';
import type { TravelArticleSectionRegion } from '../../data/travelArticleTypes';

const COLLAPSED_ITEMS = 4;

interface TravelArticleRegionProps {
  block: TravelArticleSectionRegion;
  /** Компактный вид карточки (меньше ширина, фото и отступы) */
  compact?: boolean;
}

export function TravelArticleRegion({ block, compact }: TravelArticleRegionProps) {
  const { id, image, imageAlt, title, tag, startIndex = 1, items, description, ctaLabel } = block;
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > COLLAPSED_ITEMS;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_ITEMS);
  const hiddenCount = items.length - COLLAPSED_ITEMS;
  const chatQuery = encodeURIComponent(`Хочу поехать в ${title}. Помоги составить маршрут.`);

  return (
    <motion.section
      id={id || undefined}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      className={compact ? 'py-5 md:py-6 px-4 sm:px-6 lg:px-8 scroll-mt-24' : 'py-8 md:py-12 px-4 sm:px-6 lg:px-8 scroll-mt-24'}
    >
      <div className={compact ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}>
        <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          {/* Image */}
          <div className={`relative overflow-hidden group/img ${compact ? 'aspect-[2/1]' : 'aspect-[21/9] md:aspect-[3/1]'}`}>
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            {tag && (
              <div className={compact ? 'absolute top-2 right-2' : 'absolute top-4 right-4'}>
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium">
                  {tag}
                </span>
              </div>
            )}
            <div className={compact ? 'absolute bottom-0 left-0 right-0 p-3 md:p-4' : 'absolute bottom-0 left-0 right-0 p-4 md:p-6'}>
              <h2 className={compact ? 'text-xl md:text-2xl font-semibold text-white tracking-tight drop-shadow-lg' : 'text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-lg'}>
                {title}
              </h2>
            </div>
          </div>

          <div className={compact ? 'p-4 md:p-5' : 'p-5 md:p-7'}>
            <ol
              className={`list-decimal list-inside text-gray-700 ${compact ? 'space-y-1.5 text-sm md:text-base' : 'space-y-2 text-base md:text-lg'}`}
              start={startIndex}
            >
              <AnimatePresence mode="wait">
                {visibleItems.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="pl-1"
                  >
                    {item}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={compact ? 'mt-3 flex items-center gap-1.5 text-[#094D92] font-medium hover:underline focus:outline-none text-sm' : 'mt-4 flex items-center gap-2 text-[#094D92] font-medium hover:underline focus:outline-none'}
              >
                <ChevronDown
                  className={`transition-transform duration-200 ${compact ? 'w-4 h-4' : 'w-5 h-5'} ${expanded ? 'rotate-180' : ''}`}
                />
                {expanded ? 'Свернуть' : `Показать ещё ${hiddenCount} ${hiddenCount === 1 ? 'место' : hiddenCount < 5 ? 'места' : 'мест'}`}
              </button>
            )}

            {description && (
              <p className={compact ? 'mt-3 pt-3 border-t border-gray-100 text-gray-600 text-sm leading-relaxed' : 'mt-4 pt-4 border-t border-gray-100 text-gray-600 text-base leading-relaxed'}>
                {description}
              </p>
            )}

            <Link
              to={`/chat?q=${chatQuery}`}
              className={compact ? 'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors text-sm' : 'mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors'}
            >
              <MessageCircle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {ctaLabel ?? 'Спланировать поездку сюда'}
            </Link>
          </div>
        </article>
      </div>
    </motion.section>
  );
}
