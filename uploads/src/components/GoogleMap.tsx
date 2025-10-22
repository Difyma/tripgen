import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  location?: string;
  places?: Array<{
    name: string;
    lat: number;
    lng: number;
    type: 'hotel' | 'restaurant' | 'attraction' | 'airport' | 'museum' | 'cafe' | 'park';
  }>;
  className?: string;
}

// Расширяем глобальный объект Window для Google Maps
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({ places = [], className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // Иконки для разных типов мест
  const getIconForType = (type: string) => {
    const iconMap: Record<string, string> = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎯',
      airport: '✈️',
      museum: '🏛️',
      cafe: '☕',
      park: '🌳'
    };
    return iconMap[type] || '📍';
  };

  // Загрузка Google Maps JavaScript API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Проверяем, загружен ли уже API
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      // Проверяем, загружен ли уже скрипт
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Ждем загрузки
        const checkLoaded = () => {
          if (window.google) {
            setIsLoaded(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Загружаем Google Maps JavaScript API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC6EPnNJwqtLYslN4AaUh-0i549yFdLyW8&libraries=places,marker&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Создаем глобальную функцию initMap
      window.initMap = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps JavaScript API');
        setHasError(true);
        setIsLoaded(true); // Показываем fallback
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Инициализация карты и маркеров
  useEffect(() => {
    if (isLoaded && mapRef.current && places.length > 0 && !hasError) {
      try {
        // Очищаем предыдущие маркеры
        markers.forEach(marker => marker.setMap(null));
        
        // Создаем карту
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: places[0].lat, lng: places[0].lng },
          zoom: 12,
          mapId: "DEMO_MAP_ID"
        });
        
        setMap(mapInstance);
        
        // Создаем маркеры для каждого места
        const newMarkers = places.map(place => {
          // Создаем элемент для маркера
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              width: 32px; 
              height: 32px; 
              background: #4285F4; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${getIconForType(place.type)}
            </div>
          `;
          
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat: place.lat, lng: place.lng },
            map: mapInstance,
            title: place.name,
            content: markerElement
          });
          
          // Добавляем информационное окно
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${place.name}</h3>
                <p style="margin: 0; font-size: 12px; color: #666; text-transform: capitalize;">${place.type}</p>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });
          
          return marker;
        });
        
        setMarkers(newMarkers);
        
        // Подгоняем карту под все маркеры
        if (places.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          places.forEach(place => {
            bounds.extend({ lat: place.lat, lng: place.lng });
          });
          mapInstance.fitBounds(bounds);
        }
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setHasError(true);
      }
    }
  }, [isLoaded, places, hasError]);

  // Fallback карта с маркерами
  const renderFallbackMap = () => (
    <div className="w-full h-full bg-gray-100 rounded-lg p-4">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">🗺️</div>
        <h3 className="text-lg font-semibold mb-2">Карта мест</h3>
        <p className="text-sm text-gray-600 mb-4">
          Google Maps недоступен. Показываем список мест:
        </p>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {places.map((place, index) => (
          <div key={index} className="flex items-center p-2 bg-white rounded-lg shadow-sm">
            <span className="text-lg mr-3">{getIconForType(place.type)}</span>
            <div>
              <div className="font-medium text-sm">{place.name}</div>
              <div className="text-xs text-gray-500 capitalize">{place.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {!isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Загрузка карты...</p>
          </div>
        </div>
      ) : hasError ? (
        renderFallbackMap()
      ) : places.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Карта мест</h3>
            <p className="text-sm text-gray-600">Нет мест для отображения</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      )}
    </div>
  );
};

export default GoogleMap;
