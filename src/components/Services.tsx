'use client';

import { motion } from 'framer-motion';
import { Bed, Car, Plane, Utensils, Ticket, Map } from 'lucide-react';

const services = [
  {
    icon: Bed,
    title: 'Отели',
    description: 'Лучшие отели и апартаменты по выгодным ценам.',
    available: true
  },
  {
    icon: Car,
    title: 'Аренда авто',
    description: 'Широкий выбор автомобилей в любой точке мира.',
    available: false
  },
  {
    icon: Plane,
    title: 'Авиабилеты',
    description: 'Поиск и бронирование авиабилетов по лучшим ценам.',
    available: true
  },
  {
    icon: Utensils,
    title: 'Рестораны',
    description: 'Бронирование столиков в лучших ресторанах.',
    available: true
  },
  {
    icon: Ticket,
    title: 'Впечатления',
    description: 'Экскурсии и развлечения в любом городе мира.',
    available: true
  },
  {
    icon: Map,
    title: 'Туры',
    description: 'Готовые туры и индивидуальные маршруты.',
    available: false
  }
];

const Services = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">
          Организуйте все это в одном месте.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Все необходимые услуги для организации идеального путешествия
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#FBFBFD] rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <service.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    {!service.available && (
                      <span className="px-2 py-1 bg-black/5 rounded-full text-xs font-medium">
                        СКОРО
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 