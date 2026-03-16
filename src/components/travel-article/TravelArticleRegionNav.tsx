import { motion } from 'framer-motion';

interface RegionItem {
  id: string;
  title: string;
}

interface TravelArticleRegionNavProps {
  regions: RegionItem[];
}

export function TravelArticleRegionNav({ regions }: TravelArticleRegionNavProps) {
  const scrollToRegion = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white py-10 md:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Выберите регион
        </h2>
        <p className="text-gray-600 mb-6 max-w-xl">
          Кликните по региону — ниже откроется подборка мест с фото и идеями для маршрута.
        </p>
        <div className="flex flex-wrap gap-2 pb-2 -mx-1">
          {regions.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => scrollToRegion(r.id)}
              className="px-4 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 hover:text-gray-900 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {r.title}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
