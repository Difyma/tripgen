import { motion } from 'framer-motion';
import type { TravelArticleSectionList } from '../../data/travelArticleTypes';

interface TravelArticleListProps {
  block: TravelArticleSectionList;
}

export function TravelArticleList({ block }: TravelArticleListProps) {
  const { title, numbered, startIndex = 1, items, description } = block;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-6">
          {title}
        </h2>
        {numbered ? (
          <ol
            className="list-decimal list-inside space-y-2 text-gray-700 text-base md:text-lg"
            start={startIndex}
          >
            {items.map((item, i) => (
              <li key={i} className="pl-1">
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-base md:text-lg">
            {items.map((item, i) => (
              <li key={i} className="pl-1">
                {item}
              </li>
            ))}
          </ul>
        )}
        {description && (
          <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.section>
  );
}
