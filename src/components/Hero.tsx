import { motion } from 'framer-motion';
import { Search, Calendar, Users } from 'lucide-react';
import { useState } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { MainNavbar } from './MainNavbar';
import { AuthModal } from './AuthModal';

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
      <MainNavbar onAuthClick={() => setShowAuthModal(true)} />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

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
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>Adults</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                -
                              </button>
                              <span>{formData.guests}</span>
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, guests: prev.guests + 1 }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Children</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                -
                              </button>
                              <span>{formData.children}</span>
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, children: prev.children + 1 }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Pets</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, pets: Math.max(0, prev.pets - 1) }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                -
                              </button>
                              <span>{formData.pets}</span>
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, pets: prev.pets + 1 }))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-black/5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    className="flex items-center justify-center gap-2 bg-black text-white p-4 rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 