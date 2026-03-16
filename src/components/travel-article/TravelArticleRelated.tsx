import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface TravelArticleRelatedProps {
  links: { label: string; href: string }[];
}

export function TravelArticleRelated({ links }: TravelArticleRelatedProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#FBFBFD]"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
          Полезные материалы
        </h2>
        <ul className="space-y-3">
          {links.map((link, i) => (
            <li key={i}>
              <Link
                to={link.href}
                className="inline-flex items-center gap-2 text-[#094D92] font-medium hover:underline"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
