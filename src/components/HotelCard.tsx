import { Star, MapPin, Wifi, Car, Utensils, Lock, Dumbbell } from 'lucide-react';

interface HotelCardProps {
  name: string;
  stars: number;
  rating?: number;
  reviewCount?: number;
  address: string;
  distanceToCenter?: string;
  distanceToMetro?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  bookingUrl: string;
  amenities?: string[];
  roomAmenities?: string[];
  taxesAndFees?: string;
  mealType?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  checkInTime?: string;
  checkOutTime?: string;
  metapolicyHighlights?: string[];
  roomName?: string;
  isTop?: boolean;
  /** Краткое описание (для мини-карточки) */
  description?: string;
  /** Компактный вид для списка в чате */
  variant?: 'default' | 'mini';
}

export const HotelCard = ({
  name,
  stars,
  rating,
  reviewCount,
  address,
  distanceToCenter,
  distanceToMetro,
  price,
  currency,
  imageUrl,
  bookingUrl,
  amenities = [],
  roomAmenities = [],
  taxesAndFees,
  mealType,
  cancellationPolicy,
  cancellationDeadline,
  checkInTime,
  checkOutTime,
  metapolicyHighlights = [],
  roomName,
  isTop = false,
  description,
  variant = 'default',
}: HotelCardProps) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ' + currency;
  };

  const renderStars = (count: number, size: 'sm' | 'md' = 'md') => {
    const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return Array(count).fill(null).map((_, i) => (
      <Star key={i} className={`${cls} fill-amber-400 text-amber-400`} />
    ));
  };

  if (variant === 'mini') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex">
        <div className="w-24 h-20 flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-medium px-1 text-center line-clamp-2">{name}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
            <div className="flex items-center gap-0.5 mt-0.5">{renderStars(stars, 'sm')}</div>
            {description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-snug">{description}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <span className="text-sm font-bold text-gray-900">от {formatPrice(price, currency)}</span>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
            >
              Забронировать
            </a>
          </div>
          <div className="mt-2 space-y-1 text-[11px] text-gray-600">
            {taxesAndFees && <div><strong>Налоги/сборы:</strong> {taxesAndFees}</div>}
            {mealType && <div><strong>Питание:</strong> {mealType}</div>}
            {cancellationPolicy && <div><strong>Отмена:</strong> {cancellationPolicy}</div>}
            {cancellationDeadline && <div><strong>Дедлайн отмены:</strong> {cancellationDeadline}</div>}
            {(checkInTime || checkOutTime) && (
              <div><strong>Check-in/out:</strong> {checkInTime || '-'} / {checkOutTime || '-'}</div>
            )}
            {roomName && <div><strong>Номер:</strong> {roomName}</div>}
            {roomAmenities.length > 0 && <div><strong>Удобства номера:</strong> {roomAmenities.slice(0, 6).join(', ')}</div>}
            {amenities.length > 0 && <div><strong>Удобства отеля:</strong> {amenities.slice(0, 6).join(', ')}</div>}
            {metapolicyHighlights.length > 0 && <div><strong>Ограничения:</strong> {metapolicyHighlights.slice(0, 2).join('; ')}</div>}
          </div>
        </div>
      </div>
    );
  }

  const renderAmenities = () => {
    const icons = [
      { icon: Wifi, label: 'WiFi' },
      { icon: Car, label: 'Парковка' },
      { icon: Utensils, label: 'Ресторан' },
      { icon: Lock, label: 'Сейф' },
      { icon: Dumbbell, label: 'Спортзал' },
    ];

    return (
      <div className="flex gap-3 mt-2">
        {icons.map(({ icon: Icon, label }) => (
          <div key={label} className="text-gray-400" title={label}>
            <Icon className="w-5 h-5" />
          </div>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-500';
    if (rating >= 8) return 'bg-emerald-500';
    if (rating >= 7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow max-w-xl">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-56 h-40 sm:h-auto relative flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-500 font-semibold text-sm px-6 text-center line-clamp-3">
                {name}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                  {name}
                </h3>
                {isTop && (
                  <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
                    TOP
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {renderStars(stars)}
              </div>
            </div>

            {/* Rating badge */}
            {rating && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-600">
                    {rating >= 9 ? 'Превосходно' : rating >= 8 ? 'Отлично' : 'Хорошо'}
                  </div>
                  {reviewCount && (
                    <div className="text-xs text-gray-400">{reviewCount} отзывов</div>
                  )}
                </div>
                <div className={`${getRatingColor(rating)} text-white px-2.5 py-1.5 rounded-lg font-bold text-sm sm:text-base`}>
                  {rating.toFixed(1)}
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="mt-2 text-gray-600 text-sm">
            <div className="flex items-start gap-1">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{address}</span>
            </div>
            {distanceToCenter && (
              <div className="text-gray-400 mt-0.5 ml-5">{distanceToCenter}</div>
            )}
            {distanceToMetro && (
              <div className="text-gray-400 mt-0.5 ml-5">{distanceToMetro}</div>
            )}
          </div>

          {/* Amenities */}
          {amenities.length > 0 ? renderAmenities() : null}
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            {taxesAndFees && <div><strong>Налоги/сборы:</strong> {taxesAndFees}</div>}
            {mealType && <div><strong>Питание:</strong> {mealType}</div>}
            {cancellationPolicy && <div><strong>Политика отмены:</strong> {cancellationPolicy}</div>}
            {cancellationDeadline && <div><strong>Дедлайн отмены:</strong> {cancellationDeadline}</div>}
            {(checkInTime || checkOutTime) && <div><strong>Check-in/out:</strong> {checkInTime || '-'} / {checkOutTime || '-'}</div>}
            {roomName && <div><strong>Номер:</strong> {roomName}</div>}
            {roomAmenities.length > 0 && <div><strong>Удобства номера:</strong> {roomAmenities.slice(0, 8).join(', ')}</div>}
            {metapolicyHighlights.length > 0 && <div><strong>Ограничения:</strong> {metapolicyHighlights.slice(0, 3).join('; ')}</div>}
          </div>

          {/* Price and Button */}
          <div className="mt-auto pt-4 flex items-end justify-between">
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex-1 mr-3">
              <div className="text-xs sm:text-sm text-gray-600">Номер в этом отеле</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  от {formatPrice(price, currency)}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-gray-400">
                за ночь · Все налоги включены
              </div>
            </div>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap"
            >
              Забронировать отель
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
