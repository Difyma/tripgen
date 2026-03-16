import { motion } from 'framer-motion';
import type { TravelArticleBlockImage } from '../../data/travelArticleTypes';

interface TravelArticleImageBlockProps {
  block: TravelArticleBlockImage;
}

export function TravelArticleImageBlock({ block }: TravelArticleImageBlockProps) {
  const { src, alt, caption, size = 'default' } = block;
  const compact = size === 'compact';

  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={compact ? 'py-5 px-4 sm:px-6 lg:px-8 bg-white' : 'py-8 px-4 sm:px-6 lg:px-8 bg-white'}
    >
      <div className={compact ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}>
        <div className="rounded-2xl overflow-hidden shadow-md group">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        {caption && (
          <figcaption className={compact ? 'mt-2 text-xs text-gray-500 text-center' : 'mt-3 text-sm text-gray-500 text-center'}>
            {caption}
          </figcaption>
        )}
      </div>
    </motion.figure>
  );
}
