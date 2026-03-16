import { motion } from 'framer-motion';
import type { TravelArticleBlockWhenToVisit } from '../../data/travelArticleTypes';

interface TravelArticleWhenToVisitProps {
  block: TravelArticleBlockWhenToVisit;
}

export function TravelArticleWhenToVisit({ block }: TravelArticleWhenToVisitProps) {
  const { title, seasons } = block;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
          {title}
        </h2>
        <div className="space-y-6">
          {seasons.map((season, index) => (
            <motion.div
              key={season.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pl-4 border-l-4 border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {season.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {season.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
