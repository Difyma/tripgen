'use client';

import { motion } from 'framer-motion';
import { Plane, Train, Bus, Car } from 'lucide-react';

const transportOptions = [
  {
    icon: Plane,
    title: 'Plane',
    description: 'Direct flights and convenient connections to your dream destinations'
  },
  {
    icon: Train,
    title: 'Train',
    description: 'Scenic rail journeys through breathtaking landscapes'
  },
  {
    icon: Bus,
    title: 'Bus',
    description: 'Comfortable coaches for group tours and city transfers'
  },
  {
    icon: Car,
    title: 'Local Transportation',
    description: 'Private vehicles and local transport options for flexible travel'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 }
};

const EffortlessTravel = () => {
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
            <img
              src="https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1200&q=80"
              alt="Scenic road"
              className="rounded-2xl shadow-xl"
            />
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Every Step of the Way
              </h2>
              <p className="text-xl text-gray-600">
                Travel with ease and comfort, from private transfers to seamless transportation throughout your journey.
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-6"
            >
              {transportOptions.map((option) => (
                <motion.div
                  key={option.title}
                  variants={item}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#094D92] p-3 rounded-lg">
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {option.title}
                      </h3>
                      <p className="text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EffortlessTravel; 