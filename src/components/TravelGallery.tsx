'use client';

import { motion } from 'framer-motion';

const photos = [
  {
    url: '/images/Traveling_around_Altai.jpg',
    location: 'Горный Алтай',
    category: 'Природа'
  },
  {
    url: '/images/Traveling_around_Baikal.jpg',
    location: 'Байкал',
    category: 'Озера'
  },
  {
    url: '/images/Traveling_around_Kamchatka.jpg',
    location: 'Камчатка',
    category: 'Вулканы'
  },
  {
    url: '/images/Traveling_around_Karelia.jpg',
    location: 'Карелия',
    category: 'Леса'
  }
];

const TravelGallery = () => {
  return (
    <section className="py-24 bg-[#FBFBFD]">
      <div className="max-w-7xl mx-auto px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight font-cal">
            Фото ваших путешествий
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Исследуйте красоту России через объективы наших путешественников
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.location}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
            >
              <img
                src={photo.url}
                alt={photo.location}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-semibold mb-1">{photo.location}</h3>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                  {photo.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelGallery; 