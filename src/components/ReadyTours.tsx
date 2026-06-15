'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, ArrowRight, Mountain, Trees, Umbrella, Bike, Palette, Wine, Camera, Ticket, Clock } from 'lucide-react';
import { readyTours, type ReadyTour } from '../data/readyTours';
import { tourApi } from '../services/tourApi';

const categories = [
  { id: 'all', name: 'Все туры', icon: Camera },
  { id: 'nature', name: 'Природа', icon: Trees },
  { id: 'sport', name: 'Активный отдых', icon: Bike },
  { id: 'relax', name: 'Пляжный отдых', icon: Umbrella },
  { id: 'mountain', name: 'Горы', icon: Mountain },
  { id: 'culture', name: 'Культура', icon: Palette },
  { id: 'gastronomy', name: 'Гастрономия', icon: Wine },
];

export function ReadyTours() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [backendTours, setBackendTours] = useState<ReadyTour[]>([]);

  useEffect(() => {
    let mounted = true;
    tourApi.getPublishedTours()
      .then(({ tours }) => {
        if (mounted && Array.isArray(tours)) setBackendTours(tours as ReadyTour[]);
      })
      .catch((error) => {
        console.warn('Failed to load backend tours, using static fallback:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const allTours = [...backendTours, ...readyTours];
  const filteredTours = activeCategory === 'all' 
    ? allTours
    : allTours.filter(tour => tour.category === activeCategory);

  return (
    <section id="tours" className="py-20 bg-[#FBFBFD]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-gray-900">
            Готовые туры
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Выберите идеальное путешествие из нашей коллекции готовых туров по России
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </motion.div>

        {/* Tours Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-sm font-semibold text-gray-900">{tour.price}</span>
                  </div>

                  {/* Spots Left Badge */}
                  {tour.spotsLeft <= 3 ? (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Осталось {tour.spotsLeft} {tour.spotsLeft === 1 ? 'место' : tour.spotsLeft <= 4 ? 'места' : 'мест'}</span>
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{tour.spotsLeft} мест</span>
                    </div>
                  )}

                  {/* Location */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{tour.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {tour.title}
                  </h3>

                  {/* Tour Dates */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(tour.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — {new Date(tour.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{tour.groupSize}</span>
                    </div>
                  </div>

                  <Link
                    to={`/ready-tours/${tour.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors group/btn"
                  >
                    Подробнее
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredTours.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">В данной категории пока нет туров</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
