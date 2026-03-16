import { motion } from 'framer-motion';
import type { TravelArticleSectionText } from '../../data/travelArticleTypes';

interface TravelArticleTextProps {
  block: TravelArticleSectionText;
}

export function TravelArticleText({ block }: TravelArticleTextProps) {
  const { title, paragraphs } = block;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-6">
            {title}
          </h2>
        )}
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 text-base md:text-lg leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
