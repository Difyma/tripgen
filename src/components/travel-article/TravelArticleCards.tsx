import { motion } from 'framer-motion';
import type { TravelArticleSectionCards } from '../../data/travelArticleTypes';
import { Link } from 'react-router-dom';

interface TravelArticleCardsProps {
  block: TravelArticleSectionCards;
}

export function TravelArticleCards({ block }: TravelArticleCardsProps) {
  const { title, items, columns = 3 } = block;
  const gridClass = columns === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#FBFBFD]">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
            {title}
          </h2>
        )}
        <div className={gridClass}>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {item.image ? (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : null}
              <div className="p-5">
                {item.link ? (
                  <Link
                    to={item.link}
                    className="text-lg font-semibold text-gray-900 hover:text-[#094D92] transition-colors block mb-1"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                )}
                {item.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
