import { Search, Users, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MainNavbarProps {
  onAuthClick: () => void;
}

export const MainNavbar = ({ onAuthClick }: MainNavbarProps) => {
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
            <Link 
              to="/creator" 
              className="bg-black text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <img src="/images/web-brower.png" alt="Для креаторов" className="w-4 h-4 brightness-0 invert" />
              <span>Для креаторов</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-4">
              <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button 
                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                onClick={onAuthClick}
                aria-label="Войти или зарегистрироваться"
              >
                <Users className="w-4 h-4" />
              </button>
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