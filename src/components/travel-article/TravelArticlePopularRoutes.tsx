import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import type { TravelArticleBlockPopularRoutes } from '../../data/travelArticleTypes';

interface TravelArticlePopularRoutesProps {
  block: TravelArticleBlockPopularRoutes;
}

export function TravelArticlePopularRoutes({ block }: TravelArticlePopularRoutesProps) {
  const { title, items } = block;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
          {title}
        </h2>
        <ul className="space-y-4">
          {items.map((item, index) => (
            <motion.li
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link
                to={item.href}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-colors group"
              >
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 group-hover:text-[#094D92] transition-colors">
                    {item.title}
                  </span>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 shrink-0 group-hover:text-[#094D92] transition-colors" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
