'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Map } from 'lucide-react';

const steps = [
  {
    title: 'Опишите свои интересы',
    description: 'Расскажите нам о своих предпочтениях в путешествиях, бюджете и желаемых впечатлениях',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80',
    icon: MessageCircle
  },
  {
    title: 'AI создаст маршрут',
    description: 'Искусственный интеллект проанализирует ваши пожелания и создаст идеальный маршрут',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
    icon: Sparkles
  },
  {
    title: 'Отправляйтесь в путь',
    description: 'Получите детальный план путешествия с описанием мест, отелей и активностей',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
    icon: Map
  }
];

const ChatIntro = () => {
  return (
    <section className="py-40 bg-[#000000] text-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-32"
        >
          <h2 className="text-6xl md:text-7xl font-medium mb-6 tracking-tight leading-tight">
            Как это работает
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
            Простой процесс создания вашего идеального путешествия
          </p>
        </motion.div>

        <div className="space-y-40">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16`}
            >
              <div className="flex-1">
                <div className="max-w-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg mb-8">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <motion.div 
                  className="relative aspect-[16/10] rounded-2xl overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-60" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="mt-32 text-center"
        >
          <a
            href="#trip-form"
            className="inline-flex items-center justify-center px-12 py-5 bg-white text-black rounded-full text-xl font-medium hover:bg-gray-100 transition-all duration-300 ease-out hover:scale-[1.02]"
          >
            Начать планирование
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatIntro; 