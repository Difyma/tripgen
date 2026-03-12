'use client';

import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const footerLinks = {
  Путешествия: [
    { name: 'Направления', href: '#' },
    { name: 'Туры и пакеты', href: '#' },
    { name: 'Блог о путешествиях', href: '#' },
    { name: 'Фотогалерея', href: '#' }
  ],
  Компания: [
    { name: 'О нас', href: '/about' },
    { name: 'Наша история', href: '#' },
    { name: 'Команда', href: '#' },
    { name: 'Для креаторов', href: '/creator' },
    { name: 'Наши креаторы', href: '/creators' }
  ],
  Поддержка: [
    { name: 'Связаться с нами', href: '#' },
    { name: 'Условия использования', href: '#' },
    { name: 'Политика конфиденциальности', href: '#' },
    { name: 'Помощь', href: '#' }
  ]
};

export const Footer = () => {
  return (
    <footer className="bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6 text-gray-900">Рассылка</h3>
            <p className="text-gray-600 mb-6">
              Подпишитесь на нашу рассылку, чтобы получать эксклюзивные предложения и советы по путешествиям
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Ваш email"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#094D92] focus:border-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#094D92] text-white p-3 rounded-xl hover:bg-[#316B63] transition-colors duration-300"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xl font-bold mb-6 text-gray-900">{category}</h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-[#094D92] transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2024 TRIPGEN. Все права защищены.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-[#094D92] transition-colors duration-300">
                Telegram
              </a>
              <a href="#" className="text-gray-600 hover:text-[#094D92] transition-colors duration-300">
                VK
              </a>
              <a href="#" className="text-gray-600 hover:text-[#094D92] transition-colors duration-300">
                Instagram*
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 