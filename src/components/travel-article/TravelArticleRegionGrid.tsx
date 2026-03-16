import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import type { TravelArticleSectionRegion } from '../../data/travelArticleTypes';

interface TravelArticleRegionGridProps {
  regions: TravelArticleSectionRegion[];
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '');
}

export function TravelArticleRegionGrid({ regions }: TravelArticleRegionGridProps) {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {regions.map((region, index) => {
            const chatQuery = encodeURIComponent(`Хочу поехать в ${region.title}. Помоги составить маршрут.`);
            const placesCount = region.items.length;

            return (
              <motion.article
                key={region.id || slugify(region.title)}
                id={region.id || undefined}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="scroll-mt-24 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={region.image}
                    alt={region.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Tag overlay (как на референсе — полупрозрачные теги на изображении) */}
                  {region.tag && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                        {region.tag}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-5">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight mb-1">
                    {region.slug ? (
                      <Link to={`/blog/${region.slug}`} className="hover:text-[#094D92] transition-colors">
                        {region.title}
                      </Link>
                    ) : (
                      region.title
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {placesCount} {placesCount === 1 ? 'место' : placesCount < 5 ? 'места' : 'мест'}
                  </p>
                  {region.description && (
                    <p className="text-sm text-gray-600 leading-snug mb-4 line-clamp-2">
                      {region.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {region.slug && (
                      <Link
                        to={`/blog/${region.slug}`}
                        className="text-sm font-medium text-[#094D92] hover:underline"
                      >
                        Подробнее о регионе
                      </Link>
                    )}
                    <Link
                      to={`/chat?q=${chatQuery}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      Спланировать поездку
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
