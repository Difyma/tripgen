import { motion } from 'framer-motion';
import type { TravelArticleBlockPlacesDetail } from '../../data/travelArticleTypes';

interface TravelArticlePlacesDetailProps {
  block: TravelArticleBlockPlacesDetail;
}

export function TravelArticlePlacesDetail({ block }: TravelArticlePlacesDetailProps) {
  const { title, items } = block;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#FBFBFD]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
          {title}
        </h2>
        <div className="space-y-8 md:space-y-10">
          {items.map((item) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-b border-gray-200 pb-8 last:border-0 last:pb-0"
            >
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                {item.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
