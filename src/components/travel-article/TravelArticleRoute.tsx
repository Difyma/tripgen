import { motion } from 'framer-motion';
import type { TravelArticleBlockRoute } from '../../data/travelArticleTypes';

interface TravelArticleRouteProps {
  block: TravelArticleBlockRoute;
}

export function TravelArticleRoute({ block }: TravelArticleRouteProps) {
  const { title, days } = block;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
          {title}
        </h2>

        <div className="space-y-6">
          {days.map((day, index) => (
            <motion.div
              key={day.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  {day.label}
                </div>
                {index < days.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pt-1">
                {day.title && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                    {day.title}
                  </h3>
                )}
                {day.description && (
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {day.description}
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

