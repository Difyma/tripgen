import { useState } from 'react';
import { Search, Calendar, Users, Loader2, MapPin, Star, ExternalLink, Image as ImageIcon, Info, Home, Coffee, Wifi, Car } from 'lucide-react';
import { searchHotels, formatHotelForDisplay, formatAmenities, formatImageUrl, generatePartnerLink } from '../services/ostrovokApiFull';
import type { Hotel } from '../types/ostrovok';

interface HotelSearchParams {
  query: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

const HotelTestPage = () => {
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({
    query: '',
    checkIn: '',
    checkOut: '',
    guests: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSelectedHotel(null);

    try {
      const { hotels } = await searchHotels({
        location: searchParams.query,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests
      });
      
      setResults(hotels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelClick = (hotel: Hotel) => {
    setSelectedHotel(hotel);
  };

  const getBookingUrl = (hotel: Hotel) => {
    return hotel.bookingUrl || generatePartnerLink({
      hotelId: hotel.hid || hotel.id,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Поиск отелей Ostrovok</h1>
          <p className="text-gray-600">Полная интеграция с API Ostrovok.ru (ETG)</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Город / Регион</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                  placeholder="Например: Москва, Сочи"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-in */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Заезд</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.checkIn}
                  onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-out */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Выезд</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={searchParams.checkOut}
                  onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Гостей</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Найти отели
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold mb-4">
              {results.length > 0 ? `Найдено: ${results.length}` : 'Результаты'}
            </h2>
            
            {results.map((hotel) => {
              const display = formatHotelForDisplay(hotel);
              const isSelected = selectedHotel?.id === hotel.id;
              
              return (
                <div
                  key={hotel.id}
                  onClick={() => handleHotelClick(hotel)}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <div className="aspect-video relative">
                    <img
                      src={display.mainImage || 'https://placehold.co/600x400?text=No+Image'}
                      alt={display.name}
                      className="w-full h-full object-cover"
                    />
                    {display.stars > 0 && (
                      <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-lg text-sm">
                        {display.stars} ★
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{display.name}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-1">{display.address}</p>
                    
                    {display.distanceToCenter && (
                      <p className="text-blue-600 text-xs mb-2">{display.distanceToCenter}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {display.price.toLocaleString('ru-RU')} {display.currency}
                      </div>
                      <span className="text-xs text-gray-500">{display.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {!isLoading && results.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                Начните поиск отелей
              </div>
            )}
          </div>

          {/* Selected Hotel Details */}
          <div className="lg:col-span-2">
            {selectedHotel ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Main Image Gallery */}
                <div className="relative">
                  <div className="aspect-video">
                    <img
                      src={formatHotelForDisplay(selectedHotel).mainImage || 'https://placehold.co/800x400?text=No+Image'}
                      alt={selectedHotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Image count badge */}
                  {selectedHotel.images && selectedHotel.images.length > 0 && (
                    <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {selectedHotel.images.length} фото
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedHotel.name}</h2>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedHotel.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedHotel.rating && (
                        <div className="flex items-center gap-1 text-lg">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{selectedHotel.rating}</span>
                          <span className="text-gray-500 text-sm">/10</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {selectedHotel.stars} звезд
                      </div>
                    </div>
                  </div>

                  {/* Price & Booking */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold">
                          {selectedHotel.price.toLocaleString('ru-RU')} {selectedHotel.currency}
                        </div>
                        <div className="text-gray-500 text-sm">за ночь</div>
                      </div>
                      <a
                        href={getBookingUrl(selectedHotel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                      >
                        Перейти к бронированию
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedHotel.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Описание
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedHotel.description}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Удобства
                      </h3>
                      <div className="space-y-3">
                        {formatAmenities(selectedHotel).slice(0, 4).map((group) => (
                          <div key={group.category}>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">{group.category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {group.items.slice(0, 6).map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Policies */}
                  {selectedHotel.metapolicy && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Правила проживания</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedHotel.metapolicy.check_in_check_out && (
                          <div className="flex items-center gap-2 text-sm">
                            <Info className="w-4 h-4 text-gray-400" />
                            <span>
                              Заезд/выезд: {selectedHotel.metapolicy.check_in_check_out.map(p => p.type).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {selectedHotel.metapolicy.meals && selectedHotel.metapolicy.meals.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Coffee className="w-4 h-4 text-gray-400" />
                            <span>Питание доступно</span>
                          </div>
                        )}
                        
                        {selectedHotel.metapolicy.internet && (
                          <div className="flex items-center gap-2 text-sm">
                            <Wifi className="w-4 h-4 text-gray-400" />
                            <span>
                              WiFi: {selectedHotel.metapolicy.internet[0]?.inclusion === 'included' ? 'бесплатно' : 'платно'}
                            </span>
                          </div>
                        )}
                        
                        {selectedHotel.metapolicy.parking && (
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="w-4 h-4 text-gray-400" />
                            <span>
                              Парковка: {selectedHotel.metapolicy.parking[0]?.inclusion === 'included' ? 'бесплатно' : 'платно'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image Gallery */}
                  {selectedHotel.images && selectedHotel.images.length > 1 && (
                    <div>
                      <h3 className="font-semibold mb-3">Галерея</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedHotel.images.slice(0, 8).map((image, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                            <img
                              src={image.sizes?.small || formatImageUrl(image.url, '240x240')}
                              alt={`${selectedHotel.name} - ${image.category}`}
                              className="w-full h-full object-cover hover:scale-110 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Выберите отель из списка для просмотра подробной информации</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelTestPage;
