import { motion } from 'framer-motion';
import { Search, Calendar, Users, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";
import { Input } from "./ui/input";

interface SearchFormData {
  location: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: number;
  children: number;
  pets: number;
}

const Hero = () => {
  console.log('Hero component rendering');
  
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    checkIn: undefined,
    checkOut: undefined,
    guests: 1,
    children: 0,
    pets: 0
  });

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSearch = () => {
    console.log('Search clicked', formData);
    // Здесь будет обработка поиска
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {/* Navigation */}
      <nav className="w-full py-2 px-2 sm:py-4 sm:px-8 bg-white/80 backdrop-blur-xl fixed top-0 left-0 z-50 border-b border-gray-200/50">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 sm:gap-0.5">
              <img 
                src="/images/TRIPGEN_logo_2.png" 
                alt="TripGen Logo" 
                className="w-8 h-8 sm:w-12 sm:h-12"
              />
              <div className="text-base sm:text-xl font-semibold tracking-wide text-gray-800 font-cal">TRIPGEN</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-12">
              <a href="#" className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors">Как это работает</a>
              <a href="#" className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors">О нас</a>
              <div className="flex items-center gap-1 sm:gap-4">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
                  <Search className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                  onClick={() => setShowAuthModal(true)}
                  aria-label="Войти или зарегистрироваться"
                >
                  <Users className="w-4 h-4" />
                </button>
                <a 
                  href="/chat" 
                  className="flex items-center gap-2 bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Начать чат</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 h-full flex flex-col items-center justify-center py-6 sm:py-12">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-6 sm:mb-12 relative z-20"
          >
            <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl leading-tight font-semibold tracking-[-0.025em] bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-3 sm:mb-4">
            Ваше Путешествие Начинается Здесь
            </h1>
            <p className="text-sm xs:text-base sm:text-xl text-gray-600 max-w-[95vw] sm:max-w-[600px] mx-auto font-light">
            Посетите самые замечательные места мира с помощью наших тщательно отобранных туристических предложений.
            </p>
          </motion.div>

          {/* Featured Image Container */}
          <div className="relative w-full h-[160px] xs:h-[200px] sm:aspect-[21/9] sm:h-auto rounded-2xl overflow-hidden">
            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute inset-0"
            >
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=2400&q=80"
                  alt="Scenic landscape"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Search Form - Centered on the image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute inset-x-0 bottom-2 sm:bottom-8 mx-auto w-full max-w-full sm:max-w-[900px] px-0 sm:px-2 z-20"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-2 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 px-0 sm:px-2">
                  {/* Location */}
                  <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex flex-col items-center p-4 hover:bg-black/5 rounded-xl transition-colors text-center group">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Search className="w-4 h-4" />
                          <span className="text-xs">Location</span>
                        </div>
                        <div className="text-sm font-medium">
                          {formData.location || "Where to?"}
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Enter destination</h4>
                        <Input
                          placeholder="Enter location..."
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Check In */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex flex-col items-center p-4 hover:bg-black/5 rounded-xl transition-colors text-center group">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Check In</span>
                        </div>
                        <div className="text-sm font-medium">
                          {formData.checkIn ? format(formData.checkIn, 'PP') : 'Add date'}
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.checkIn}
                        onSelect={(date) => setFormData({ ...formData, checkIn: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Check Out */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex flex-col items-center p-4 hover:bg-black/5 rounded-xl transition-colors text-center group">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Check Out</span>
                        </div>
                        <div className="text-sm font-medium">
                          {formData.checkOut ? format(formData.checkOut, 'PP') : 'Add date'}
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.checkOut}
                        onSelect={(date) => setFormData({ ...formData, checkOut: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Guests */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex flex-col items-center p-4 hover:bg-black/5 rounded-xl transition-colors text-center group">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">Guests</span>
                        </div>
                        <div className="text-sm font-medium">
                          {formData.guests} {formData.guests === 1 ? 'guest' : 'guests'}
                          {formData.children > 0 && `, ${formData.children} ${formData.children === 1 ? 'child' : 'children'}`}
                          {formData.pets > 0 && `, ${formData.pets} ${formData.pets === 1 ? 'pet' : 'pets'}`}
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Number of guests</h4>
                        <div className="flex items-center gap-4">
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}
                          >
                            -
                          </button>
                          <span>{formData.guests}</span>
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, guests: formData.guests + 1 })}
                          >
                            +
                          </button>
                        </div>

                        <h4 className="font-medium">Children</h4>
                        <div className="flex items-center gap-4">
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                          >
                            -
                          </button>
                          <span>{formData.children}</span>
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                          >
                            +
                          </button>
                        </div>

                        <h4 className="font-medium">Pets</h4>
                        <div className="flex items-center gap-4">
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, pets: Math.max(0, formData.pets - 1) })}
                          >
                            -
                          </button>
                          <span>{formData.pets}</span>
                          <button 
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            onClick={() => setFormData({ ...formData, pets: formData.pets + 1 })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center justify-center p-2">
                    <button 
                      onClick={handleSearch}
                      className="w-full bg-black text-white py-4 px-6 rounded-xl hover:bg-black/90 transition-colors text-sm font-medium"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Popover для авторизации/регистрации */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 relative flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full"
              onClick={() => setShowAuthModal(false)}
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="text-xl font-semibold text-center mb-2">Вход / Регистрация</h2>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow text-sm"
                autoFocus
              />
              <input
                type="password"
                placeholder="Пароль"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-shadow text-sm"
              />
              <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors mt-2">Войти</button>
              <div className="text-center text-xs text-gray-500">или</div>
              <button type="button" className="w-full border border-gray-200 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">Зарегистрироваться</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Hero; 