import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import type { TravelArticleSectionRegion } from '../../data/travelArticleTypes';

interface TravelArticleRegionDescriptionsProps {
  regions: TravelArticleSectionRegion[];
}

function RegionCard({ region, index }: { region: TravelArticleSectionRegion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongText = region.whyVisit && region.whyVisit.length > 200;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      id={region.id ? `${region.id}-detail` : undefined}
      className="scroll-mt-24 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {region.image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={region.image}
            alt={region.imageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {region.tag && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium shadow-sm">
              {region.tag}
            </span>
          )}
        </div>
      )}

      <div className="p-4 md:p-5 relative">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {region.slug ? (
              <Link to={`/blog/${region.slug}`} className="hover:text-[#094D92] transition-colors">
                {region.title}
              </Link>
            ) : (
              region.title
            )}
          </h3>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
            {region.items.length} мест
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {region.items.slice(0, 4).join(', ')}
          {region.items.length > 4 && '...'}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {region.items.slice(0, 5).map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs"
            >
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              {item}
            </span>
          ))}
          {region.items.length > 5 && (
            <span className="text-xs text-gray-400">+{region.items.length - 5}</span>
          )}
        </div>

        {region.whyVisit && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Почему стоит поехать
            </p>
            <p className={`text-sm text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
              {region.whyVisit}
            </p>
            {hasLongText && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-[#094D92] hover:underline"
              >
                {expanded ? 'Свернуть' : 'Читать далее'}
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {region.slug && (
          <Link
            to={`/blog/${region.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#094D92] hover:underline"
          >
            Подробнее о регионе
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        )}
      </div>
    </motion.article>
  );
}

export function TravelArticleRegionDescriptions({ regions }: TravelArticleRegionDescriptionsProps) {
  const withContent = regions.filter((r) => r.whyVisit || r.items.length > 0);

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#FBFBFD]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Описания регионов: куда поехать и почему
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Выберите регион — ниже карточки с лучшими местами и кратким описанием.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {withContent.map((region, index) => (
            <RegionCard key={region.id || region.title} region={region} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}