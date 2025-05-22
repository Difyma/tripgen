import { Users, MessageSquare, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MainNavbarProps {
  onAuthClick: () => void;
}

export const MainNavbar = ({ onAuthClick }: MainNavbarProps) => {
  const { user } = useAuth();

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
          <div className="flex items-center gap-2 sm:gap-8">
            <Link to="/" className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors">Как это работает</Link>
            <Link to="/about" className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors">О нас</Link>
            <div className="flex items-center gap-1 sm:gap-4">
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
                    <span className="text-sm text-gray-700 hidden sm:block group-hover:text-black transition-colors">
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
              <Link 
                to="/creator" 
                className="bg-white text-black border border-gray-200 px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <img src="/images/web-brower.png" alt="Для креаторов" className="w-4 h-4" />
                <span>Для креаторов</span>
              </Link>
              <Link 
                to="/chat" 
                className="flex items-center gap-1 sm:gap-2 bg-black text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Начать чат</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}; 