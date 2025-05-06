import { motion } from 'framer-motion';
import { Search, Calendar, Users, Heart, MessageSquare } from 'lucide-react';
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
}

const Hero = () => {
  console.log('Hero component rendering');
  
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    checkIn: undefined,
    checkOut: undefined,
    guests: 1
  });

  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const handleSearch = () => {
    console.log('Search clicked', formData);
    // Здесь будет обработка поиска
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {/* Navigation */}
      <nav className="w-full py-4 px-8 bg-white/80 backdrop-blur-xl fixed top-0 left-0 z-50 border-b border-gray-200/50">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-0.5">
              <img 
                src="src/images/TRIPGEN_logo_2.png" 
                alt="TripGen Logo" 
                className="w-12 h-12"
              />
              <div className="text-xl font-semibold tracking-wide text-gray-800 font-cal">TRIPGEN</div>
            </div>
            <div className="flex items-center gap-12">
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Как это работает</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">О нас</a>
              <div className="flex items-center gap-4">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
                  <Search className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
                  <Users className="w-4 h-4" />
                </button>
                <a 
                  href="#" 
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Начать чат
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-center py-12">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 relative z-20"
          >
            <h1 className="text-[56px] leading-tight font-semibold tracking-[-0.025em] bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-4">
            Ваше Путешествие Начинается Здесь
            </h1>
            <p className="text-xl text-gray-600 max-w-[600px] mx-auto font-light">
            Посетите самые замечательные места мира с помощью наших тщательно отобранных туристических предложений.
            </p>
          </motion.div>

          {/* Featured Image Container */}
          <div className="relative w-full aspect-[21/9]">
            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute inset-0"
            >
              <div className="w-full h-full rounded-3xl overflow-hidden">
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
              className="absolute inset-x-0 bottom-8 mx-auto max-w-[900px] px-2 z-20"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 px-2">
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
    </div>
  );
};

export default Hero; 