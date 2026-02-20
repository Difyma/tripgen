'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatorSection = () => {
  return (
    <section className="relative overflow-hidden my-24">
      <div className="max-w-7xl mx-auto px-2">
        {/* Background with gradient */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFB4A6] to-[#FFF0ED]" />
          
          <div className="relative py-24 px-8 sm:px-12 lg:px-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Content Side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
              >
                <div className="max-w-xl">
                  <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-6">
                    Размещайте свои туры.<br />
                    Получайте клиентов.<br />
                    Зарабатывайте.
                  </h2>
                  <p className="text-xl text-gray-700 mb-4">
                    Организуете туры или являетесь гидом?
                  </p>
                  <p className="text-xl text-gray-700 mb-6">
                    Разместите свои туры на TripGen и получайте прямых клиентов без комиссии!
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  >
                    <Link
                      to="/creator"
                    className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-900 transition-colors"
                  >
                    Разместить туры
                    <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>

                  {/* Stats */}
                  <div className="mt-8 grid grid-cols-3 gap-6">
                    {[
                      { value: "200+", label: "Гидов и туроператоров" },
                      { value: "15K+", label: "Бронирований в месяц" },
                      { value: "0%", label: "Комиссии платформы" }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                      >
                        <div className="text-3xl font-semibold mb-1">{stat.value}</div>
                        <p className="text-gray-700 text-sm">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Image Grid Side */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="relative aspect-[4/3] lg:aspect-[21/9]"
              >
                {/* Main large image */}
                <motion.div
                  initial={{ y: 20 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  className="relative h-full rounded-3xl overflow-hidden shadow-xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80"
                    alt="Travel creator"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Floating images */}
                <motion.div
                  initial={{ y: 40, x: -20, opacity: 0 }}
                  whileInView={{ y: 0, x: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="absolute -top-8 -left-8 w-40 h-40 rounded-2xl overflow-hidden shadow-lg"
                >
                  <img
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"
                    alt="Travel moment"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                <motion.div
                  initial={{ y: -40, x: 20, opacity: 0 }}
                  whileInView={{ y: 0, x: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                  className="absolute -bottom-8 -right-8 w-48 h-36 rounded-2xl overflow-hidden shadow-lg"
                >
                  <img
                    src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80"
                    alt="Travel experience"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-white/10 rounded-3xl -z-10 backdrop-blur-sm" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorSection; 