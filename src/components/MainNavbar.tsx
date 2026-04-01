import { Users, MessageSquare, ChevronDown, Menu, X, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface MainNavbarProps {
  onAuthClick: () => void;
}

export const MainNavbar = ({ onAuthClick }: MainNavbarProps) => {
  const { user, isCreator } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="w-full py-2 px-2 sm:py-4 sm:px-8 bg-white/80 backdrop-blur-xl fixed top-0 left-0 z-50 border-b border-gray-200/50">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-1 sm:gap-0.5">
            <img 
              src="/images/TRIPGEN_logo_2.png" 
              alt="TripGen Logo" 
              className="w-8 h-8 sm:w-12 sm:h-12"
            />
            <div className="text-base sm:text-xl font-semibold tracking-wide text-gray-800 font-cal">TRIPGEN</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-gray-600 hover:text-black transition-colors">Как это работает</Link>
            <Link to="/about" className="text-sm text-gray-600 hover:text-black transition-colors">О нас</Link>
            <Link to="/#tours" className="text-sm text-gray-600 hover:text-black transition-colors">Туры</Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link 
                  to="/profile" 
                  className="group flex items-center gap-3 px-2 py-1 rounded-full hover:bg-gray-50 transition-all"
                  title="Перейти в профиль"
                >
                  <div className="relative">
                    <img
                      src="/images/user.png"
                      alt="User"
                      className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-black/10 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {user.email}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              ) : (
                <button 
                  className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                  onClick={onAuthClick}
                  aria-label="Войти или зарегистрироваться"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              {isCreator ? (
                <Link 
                  to="/creator-dashboard" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Дашборд</span>
                </Link>
              ) : (
                <Link 
                  to="/creator" 
                  className="bg-white text-black border border-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <img src="/images/web-brower.png" alt="Для креаторов" className="w-4 h-4" />
                  <span>Для креаторов</span>
                </Link>
              )}
              <Link 
                to="/chat" 
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Начать чат</span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link 
              to="/chat" 
              className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full hover:bg-gray-900 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[60px] bg-white border-b border-gray-200 shadow-lg">
            <div className="flex flex-col p-4 space-y-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-black transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Как это работает
              </Link>
              <Link 
                to="/about" 
                className="text-gray-600 hover:text-black transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                О нас
              </Link>
              <Link 
                to="/creators" 
                className="text-gray-600 hover:text-black transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Наши креаторы
              </Link>
              {isCreator ? (
                <Link 
                  to="/creator-dashboard" 
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Дашборд</span>
                </Link>
              ) : (
                <Link 
                  to="/creator" 
                  className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <img src="/images/web-brower.png" alt="Для креаторов" className="w-4 h-4" />
                  <span>Для креаторов</span>
                </Link>
              )}
              {user ? (
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="relative">
                    <img
                      src="/images/user.png"
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700">{user.email}</span>
                </Link>
              ) : (
                <button 
                  className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  onClick={() => {
                    onAuthClick();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Users className="w-4 h-4" />
                  <span>Войти</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}; 