'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const tours = [
  {
    id: 1,
    title: 'Jaya Wijaya Mountain',
    image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=800&q=80',
    price: 456.80,
    rating: 4.5,
    duration: '3 days 2 nights',
    location: 'Papua, Indonesia'
  },
  {
    id: 2,
    title: 'Fuji Mountain',
    image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800&q=80',
    price: 486.50,
    rating: 4.8,
    duration: '4 days 3 nights',
    location: 'Japan'
  },
  {
    id: 3,
    title: 'Kilimanjaro',
    image: 'https://images.unsplash.com/photo-1589553416260-110fb8524f8a?w=800&q=80',
    price: 545.60,
    rating: 4.7,
    duration: '5 days 4 nights',
    location: 'Tanzania'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const TourPackages = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Explore Our Exclusive Tour Packages
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find your perfect getaway with our curated tour packages. Adventure awaits—let's make it yours.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {tours.map((tour) => (
            <motion.div
              key={tour.id}
              variants={item}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{tour.rating}</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{tour.title}</h3>
                <p className="text-gray-600 mb-4">{tour.location}</p>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">{tour.duration}</span>
                  <span className="text-2xl font-bold text-[#094D92]">${tour.price}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#094D92] text-white py-3 rounded-xl font-medium hover:bg-[#316B63] transition-colors duration-300"
                >
                  Booking
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TourPackages; 