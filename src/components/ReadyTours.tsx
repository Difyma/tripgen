'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, ArrowRight, Mountain, Trees, Umbrella, Bike, Palette, Wine, Camera } from 'lucide-react';

interface Tour {
  id: string;
  title: string;
  location: string;
  image: string;
  duration: string;
  groupSize: string;
  price: string;
  category: string;
}

const categories = [
  { id: 'all', name: 'Все туры', icon: Camera },
  { id: 'nature', name: 'Природа', icon: Trees },
  { id: 'sport', name: 'Активный отдых', icon: Bike },
  { id: 'relax', name: 'Пляжный отдых', icon: Umbrella },
  { id: 'mountain', name: 'Горы', icon: Mountain },
  { id: 'culture', name: 'Культура', icon: Palette },
  { id: 'gastronomy', name: 'Гастрономия', icon: Wine },
];

const tours: Tour[] = [
  // Природа
  {
    id: '1',
    title: 'Тайга и водопады Алтая',
    location: 'Горный Алтай',
    image: '/images/Traveling_around_Altai.jpg',
    duration: '7 дней',
    groupSize: 'до 12 человек',
    price: '85 000 ₽',
    category: 'nature',
  },
  {
    id: '2',
    title: 'Байкал: Остров Ольхон',
    location: 'Иркутская область',
    image: '/images/Traveling_around_Baikal.jpg',
    duration: '5 дней',
    groupSize: 'до 10 человек',
    price: '65 000 ₽',
    category: 'nature',
  },
  {
    id: '3',
    title: 'Карельские шхеры',
    location: 'Республика Карелия',
    image: '/images/Traveling_around_Karelia.jpg',
    duration: '4 дня',
    groupSize: 'до 8 человек',
    price: '55 000 ₽',
    category: 'nature',
  },
  // Активный отдых
  {
    id: '4',
    title: 'Восхождение на вулканы',
    location: 'Камчатка',
    image: '/images/Traveling_around_Kamchatka.jpg',
    duration: '10 дней',
    groupSize: 'до 8 человек',
    price: '145 000 ₽',
    category: 'sport',
  },
  {
    id: '5',
    title: 'Рафтинг по Катуни',
    location: 'Горный Алтай',
    image: '/images/Traveling_around_Altai.jpg',
    duration: '3 дня',
    groupSize: 'до 16 человек',
    price: '35 000 ₽',
    category: 'sport',
  },
  {
    id: '6',
    title: 'Треккинг к Телецкому озеру',
    location: 'Горный Алтай',
    image: '/images/Traveling_around_Altai.jpg',
    duration: '6 дней',
    groupSize: 'до 10 человек',
    price: '72 000 ₽',
    category: 'sport',
  },
  // Пляжный отдых
  {
    id: '7',
    title: 'Озёрный отдых на Селигере',
    location: 'Тверская область',
    image: '/images/Traveling_around_Karelia.jpg',
    duration: '4 дня',
    groupSize: 'до 20 человек',
    price: '28 000 ₽',
    category: 'relax',
  },
  {
    id: '8',
    title: 'Горячие источники Камчатки',
    location: 'Камчатка',
    image: '/images/Traveling_around_Kamchatka.jpg',
    duration: '5 дней',
    groupSize: 'до 12 человек',
    price: '95 000 ₽',
    category: 'relax',
  },
  // Горы
  {
    id: '9',
    title: 'Белуха: Подножие священной горы',
    location: 'Горный Алтай',
    image: '/images/Traveling_around_Altai.jpg',
    duration: '8 дней',
    groupSize: 'до 10 человек',
    price: '88 000 ₽',
    category: 'mountain',
  },
  {
    id: '10',
    title: 'Снежные вулканы Камчатки',
    location: 'Камчатка',
    image: '/images/Traveling_around_Kamchatka.jpg',
    duration: '9 дней',
    groupSize: 'до 8 человек',
    price: '135 000 ₽',
    category: 'mountain',
  },
  // Культура
  {
    id: '11',
    title: 'Староверы Байкала',
    location: 'Иркутская область',
    image: '/images/Traveling_around_Baikal.jpg',
    duration: '6 дней',
    groupSize: 'до 12 человек',
    price: '68 000 ₽',
    category: 'culture',
  },
  {
    id: '12',
    title: 'Рунские письмена Карелии',
    location: 'Республика Карелия',
    image: '/images/Traveling_around_Karelia.jpg',
    duration: '5 дней',
    groupSize: 'до 10 человек',
    price: '52 000 ₽',
    category: 'culture',
  },
  // Гастрономия
  {
    id: '13',
    title: 'Дикая кухня Камчатки',
    location: 'Камчатка',
    image: '/images/Traveling_around_Kamchatka.jpg',
    duration: '7 дней',
    groupSize: 'до 8 человек',
    price: '115 000 ₽',
    category: 'gastronomy',
  },
  {
    id: '14',
    title: 'Алтайский мёд и травы',
    location: 'Горный Алтай',
    image: '/images/Traveling_around_Altai.jpg',
    duration: '4 дня',
    groupSize: 'до 12 человек',
    price: '42 000 ₽',
    category: 'gastronomy',
  },
];

export function ReadyTours() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTours = activeCategory === 'all' 
    ? tours 
    : tours.filter(tour => tour.category === activeCategory);

  return (
    <section className="py-20 bg-[#FBFBFD]">
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

                  {/* Location */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{tour.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                    {tour.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{tour.groupSize}</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors group/btn">
                    Подробнее
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
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
