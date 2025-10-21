'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';

const destinations = [
  {
    id: 1,
    title: 'Алтай',
    description: 'Горы, озера и древние традиции',
    image: 'https://images.unsplash.com/photo-1634553569595-6bd04eae3187?w=1200&q=80',
    price: 'от 45 000 ₽'
  },
  {
    id: 2,
    title: 'Байкал',
    description: 'Самое глубокое озеро мира',
    image: 'https://images.unsplash.com/photo-1551845041-63e8e76836ea?w=1200&q=80',
    price: 'от 65 000 ₽'
  },
  {
    id: 3,
    title: 'Камчатка',
    description: 'Вулканы и горячие источники',
    image: 'https://images.unsplash.com/photo-1634126239926-0a51bacb8bea?w=1200&q=80',
    price: 'от 85 000 ₽'
  },
  {
    id: 4,
    title: 'Карелия',
    description: 'Озера и северная природа',
    image: 'https://images.unsplash.com/photo-1630346265071-4d5c0f3b3198?w=1200&q=80',
    price: 'от 35 000 ₽'
  }
];

const PopularDestinations = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const boundX = useTransform(x, (value) => {
    if (!carouselRef.current) return value;
    const minX = -(carouselRef.current.scrollWidth - carouselRef.current.clientWidth);
    return Math.max(Math.min(0, value), minX);
  });

  useEffect(() => {
    const controls = animate(x, 0, {
      type: "spring",
      stiffness: 400,
      damping: 30
    });

    return controls.stop;
  }, []);

  return (
    <section className="py-20 bg-[#FBFBFD] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 px-4"
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">
            Популярные направления
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Исследуйте самые популярные места для путешествий по России
          </p>
        </motion.div>

        <div className="relative px-4 cursor-grab active:cursor-grabbing">
          <motion.div
            ref={carouselRef}
            drag="x"
            dragConstraints={{ left: -1200, right: 0 }}
            style={{ x: boundX }}
            className="flex gap-6 overflow-visible"
          >
            {destinations.map((destination) => (
              <motion.div
                key={destination.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="min-w-[400px] bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={destination.image}
                    alt={destination.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{destination.title}</span>
                    </div>
                    <p className="text-white/90 text-sm">{destination.price}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{destination.title}</h3>
                  <p className="text-gray-600">{destination.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations; 