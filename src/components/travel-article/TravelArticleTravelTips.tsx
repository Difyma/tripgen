import { motion } from 'framer-motion';
import type { TravelArticleBlockTravelTips } from '../../data/travelArticleTypes';

interface TravelArticleTravelTipsProps {
  block: TravelArticleBlockTravelTips;
}

export function TravelArticleTravelTips({ block }: TravelArticleTravelTipsProps) {
  const { title, paragraphs } = block;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#FBFBFD]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-6">
          {title}
        </h2>
        <div className="space-y-4">
          {paragraphs.map((p, index) => (
            <p key={index} className="text-gray-600 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
