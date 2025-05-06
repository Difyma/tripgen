'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const stats = [
  {
    value: 12,
    suffix: 'M',
    label: 'Travelers'
  },
  {
    value: 16,
    label: 'Years of Experience'
  },
  {
    value: 12000,
    label: 'Destinations'
  },
  {
    value: 135,
    suffix: '+',
    label: 'Events'
  }
];

const ExperienceStats = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              More Than Travel,<br />
              It's an Experience
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-xl">
              We craft unforgettable travel experiences that combine adventure, comfort, and cultural immersion.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#094D92] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[#316B63] transition-colors duration-300"
            >
              Contact Us
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-2 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#094D92] mb-2">
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    separator=","
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceStats; 