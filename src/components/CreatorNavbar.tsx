import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';

const navigation = [
  {
    name: 'Возможности',
    items: [
      { name: 'Создание маршрутов', href: '#routes' },
      { name: 'Монетизация', href: '#monetization' },
      { name: 'Аналитика', href: '#analytics' },
      { name: 'Инструменты', href: '#tools' }
    ]
  },
  {
    name: 'Сообщество',
    items: [
      { name: 'Креаторы', href: '#creators' },
      { name: 'Истории успеха', href: '#success' },
      { name: 'Мероприятия', href: '#events' }
    ]
  },
  { name: 'Поддержка', href: '#support' },
  { name: 'Блог', href: '#blog' }
];

const CreatorNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <a href="/" className="flex items-center gap-2">
              <img 
                src="/images/TRIPGEN_logo_2.png" 
                alt="TripGen Logo" 
                className="w-8 h-8 sm:w-12 sm:h-12"
              />
              <div className="text-base sm:text-xl font-semibold tracking-wide text-gray-800 font-cal">TRIPGEN</div>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              item.items ? (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 py-2"
                  >
                    {item.name}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 top-full w-48 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 p-2"
                    >
                      {item.items.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium leading-6 text-gray-900 py-2"
                >
                  {item.name}
                </a>
              )
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <button className="text-sm font-medium leading-6 text-gray-900 py-2">
              Войти
            </button>
            <button className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              Стать создателем
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu portal */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 z-[200] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm"
            >
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <img 
                    src="/images/TRIPGEN_logo_2.png" 
                    alt="TripGen Logo" 
                    className="w-8 h-8"
                  />
                  <div className="text-base font-semibold tracking-wide text-gray-800 font-cal">TRIPGEN</div>
                </a>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    item.items ? (
                      <div key={item.name} className="space-y-2">
                        <div className="font-medium text-gray-900 mb-2">{item.name}</div>
                        {item.items.map((subItem) => (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-3 py-2 text-base text-gray-700 rounded-lg hover:bg-gray-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    )
                  ))}
                </div>
                <div className="border-t border-gray-200 py-6 space-y-4">
                  <button 
                    className="w-full rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Войти
                  </button>
                  <button 
                    className="w-full rounded-full bg-black px-3 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Стать создателем
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreatorNavbar; 