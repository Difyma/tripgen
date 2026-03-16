import { motion } from 'framer-motion';

interface TravelArticleSectionProps {
  title: string;
  children: React.ReactNode;
}

export function TravelArticleSection({ title, children }: TravelArticleSectionProps) {
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
        {children}
      </div>
    </motion.section>
  );
}
