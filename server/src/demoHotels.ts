/**
 * Realistic demo hotels database
 * Used as fallback when Ostrovok API is unavailable
 */

export interface DemoHotel {
  id: string;
  hid?: number;
  name: string;
  stars: number;
  rating: number;
  address: string;
  price: number;
  currency: string;
  hotelType: string;
  bookingUrl?: string;
  distanceToCenter: number;
  description: string;
  images: { category: string; url: string }[];
  amenities?: string[];
}

// Unsplash image URLs for hotels
const IMAGES: Record<string, string[]> = {
  luxury: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop'
  ],
  boutique: [
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop'
  ],
  budget: [
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=500&fit=crop'
  ],
  resort: [
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=500&fit=crop'
  ],
  standard: [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop'
  ]
};

const AMENITIES = {
  luxury: ['Wi-Fi', 'Бассейн', 'Спа', 'Фитнес', 'Ресторан', 'Бар', 'Консьерж', 'Парковка'],
  standard: ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Мини-бар', 'Сейф', 'Фен'],
  budget: ['Wi-Fi', 'Телевизор', 'Отопление', 'Общая ванная']
};

// Moscow hotels
const moscowHotels: DemoHotel[] = [
  {
    id: 'test_hotel',
    name: 'Test Hotel Moscow (РЕАЛЬНЫЙ ТЕСТОВЫЙ ОТЕЛЬ)',
    stars: 4,
    rating: 8.0,
    address: 'Test Address, 123, Москва (Тестовый отель с реальными ценами от Ostrovok API)',
    price: 5000,
    currency: 'RUB',
    hotelType: 'Test Hotel (Real API)',
    distanceToCenter: 1000,
    description: '⚠️ ЭТО РЕАЛЬНЫЙ ТЕСТОВЫЙ ОТЕЛЬ из API Ostrovok. Цены актуальные!',
    images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop' }],
    amenities: ['Wi-Fi', 'Тестовый API', 'Реальные цены']
  },
  {
    id: 'moscow_ritz',
    name: 'The Ritz-Carlton Moscow',
    stars: 5,
    rating: 9.2,
    address: 'Тверская ул., 3, Москва, Россия',
    price: 45000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 500,
    description: 'Роскошный отель в центре Москвы с видом на Красную площадь. Роскошные номера, спа-центр, несколько ресторанов и безупречный сервис.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'moscow_marriott',
    name: 'Moscow Marriott Royal Aurora',
    stars: 5,
    rating: 8.9,
    address: 'Петровка ул., 11, Москва, Россия',
    price: 28000,
    currency: 'RUB',
    hotelType: 'Business Hotel',
    distanceToCenter: 800,
    description: 'Элегантный отель рядом с Большим театром. Идеально для бизнес-поездок и туристических визитов.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'moscow_holiday',
    name: 'Holiday Inn Moscow Suschevsky',
    stars: 4,
    rating: 8.1,
    address: 'ул. Сущёвский Вал, 74, Москва, Россия',
    price: 8500,
    currency: 'RUB',
    hotelType: 'Hotel',
    distanceToCenter: 3500,
    description: 'Современный отель с хорошим соотношением цена-качество. Удобный доступ к центру на метро.',
    images: IMAGES.standard.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'moscow_ibis',
    name: 'Ibis Moscow Centre Bakhrushina',
    stars: 3,
    rating: 7.8,
    address: 'ул. Бахрушина, 11, Москва, Россия',
    price: 5500,
    currency: 'RUB',
    hotelType: 'Economy Hotel',
    distanceToCenter: 2000,
    description: 'Компактные и современные номера в доступном ценовом сегменте. Отличный выбор для экономных путешественников.',
    images: IMAGES.budget.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'moscow_boutique',
    name: 'Hotel Baltschug Kempinski',
    stars: 5,
    rating: 9.0,
    address: 'Балчуг ул., 1, Москва, Россия',
    price: 38000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 1200,
    description: 'Исторический отель с видом на Кремль и реку. Сочетание классической архитектуры и современного комфорта.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  }
];

// Saint Petersburg hotels
const petersburgHotels: DemoHotel[] = [
  {
    id: 'spb_astoria',
    name: 'Hotel Astoria',
    stars: 5,
    rating: 9.1,
    address: 'Большая Морская ул., 39, Санкт-Петербург, Россия',
    price: 32000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 800,
    description: 'Легендарный отель в сердце Петербурга. Исторический особняк с видом на Исаакиевский собор.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'spb_four_seasons',
    name: 'Four Seasons Hotel Lion Palace',
    stars: 5,
    rating: 9.3,
    address: 'Вознесенский просп., 1, Санкт-Петербург, Россия',
    price: 48000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 600,
    description: 'Роскошный отель во дворце XIX века. Рядом с Исаакиевской площадью и Эрмитажем.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'spb_nevsky',
    name: 'Nevsky Forum Hotel',
    stars: 4,
    rating: 8.4,
    address: 'Невский просп., 69, Санкт-Петербург, Россия',
    price: 12000,
    currency: 'RUB',
    hotelType: 'Boutique Hotel',
    distanceToCenter: 1000,
    description: 'Бутик-отель на главной улице города. Стильные номера и отличное расположение.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'spb_moscow',
    name: 'Hotel Moscow',
    stars: 4,
    rating: 8.0,
    address: 'пл. Александра Невского, 2, Санкт-Петербург, Россия',
    price: 9500,
    currency: 'RUB',
    hotelType: 'Hotel',
    distanceToCenter: 2500,
    description: 'Классический отель советской эпохи с обновлёнными номерами. Вид на Неву и мосты.',
    images: IMAGES.standard.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'spb_solo',
    name: 'Solo Sokos Hotel Palace Bridge',
    stars: 5,
    rating: 8.7,
    address: 'Биржевой пер., 2-4, Санкт-Петербург, Россия',
    price: 18000,
    currency: 'RUB',
    hotelType: 'Spa Hotel',
    distanceToCenter: 1500,
    description: 'Современный спа-отель на Васильевском острове. Большой wellness-центр и бассейн.',
    images: IMAGES.resort.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  }
];

// Paris hotels
const parisHotels: DemoHotel[] = [
  {
    id: 'paris_shangri',
    name: 'Shangri-La Paris',
    stars: 5,
    rating: 9.4,
    address: '10 Avenue d\'Iéna, 75116 Paris, France',
    price: 95000,
    currency: 'RUB',
    hotelType: 'Palace Hotel',
    distanceToCenter: 2500,
    description: 'Бывший дворец принца Ролана Бонапарта с видом на Эйфелеву башню. Роскошь и история.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'paris_marignan',
    name: 'Hôtel Marignan Champs-Elysées',
    stars: 5,
    rating: 8.8,
    address: '12 Rue de Marignan, 75008 Paris, France',
    price: 55000,
    currency: 'RUB',
    hotelType: 'Boutique Hotel',
    distanceToCenter: 1800,
    description: 'Элегантный отель в золотом треугольнике Парижа. Рядом с Елисейскими полями.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'paris_mercure',
    name: 'Mercure Paris Centre Tour Eiffel',
    stars: 4,
    rating: 8.2,
    address: '20 Rue Jean Rey, 75015 Paris, France',
    price: 22000,
    currency: 'RUB',
    hotelType: 'Hotel',
    distanceToCenter: 3000,
    description: 'Современный отель в 15-м округе. Рядом с Эйфелевой башней и набережной Сены.',
    images: IMAGES.standard.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'paris_ibis',
    name: 'Ibis Paris Tour Eiffel Cambronne',
    stars: 3,
    rating: 7.6,
    address: '2 Rue de Cambronne, 75015 Paris, France',
    price: 12000,
    currency: 'RUB',
    hotelType: 'Economy Hotel',
    distanceToCenter: 3500,
    description: 'Доступный отель в 10 минутах от Эйфелевой башни. Чистые номера и удобное расположение.',
    images: IMAGES.budget.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'paris_saint_james',
    name: 'Saint James Paris',
    stars: 5,
    rating: 9.0,
    address: '43 Avenue Bugeaud, 75116 Paris, France',
    price: 72000,
    currency: 'RUB',
    hotelType: 'Boutique Hotel',
    distanceToCenter: 4000,
    description: 'Единственный дворцовый отель Парижа с частным садом. Романтическая атмосфера.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  }
];

// Istanbul hotels
const istanbulHotels: DemoHotel[] = [
  {
    id: 'ist_ciragan',
    name: 'Çırağan Palace Kempinski',
    stars: 5,
    rating: 9.2,
    address: 'Çırağan Caddesi 32, Beşiktaş, İstanbul, Turkey',
    price: 65000,
    currency: 'RUB',
    hotelType: 'Palace Hotel',
    distanceToCenter: 5000,
    description: 'Бывший дворец османских султанов на берегу Босфора. Непревзойдённая роскошь.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'ist_sultanahmet',
    name: 'Sultanahmet Palace Hotel',
    stars: 4,
    rating: 8.5,
    address: 'Torbakılar Sk. No:3, Sultanahmet, İstanbul, Turkey',
    price: 15000,
    currency: 'RUB',
    hotelType: 'Boutique Hotel',
    distanceToCenter: 800,
    description: 'Уютный отель в историческом центре. Вид на Голубую мечеть и византийские стены.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'ist_swissotel',
    name: 'Swissôtel The Bosphorus',
    stars: 5,
    rating: 8.9,
    address: 'Bayıldım Caddesi 2, Maçka, İstanbul, Turkey',
    price: 38000,
    currency: 'RUB',
    hotelType: 'Resort Hotel',
    distanceToCenter: 2500,
    description: 'Роскошный отель в парке на берегу Босфора. Бассейн с видом на пролив.',
    images: IMAGES.resort.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'ist_hampton',
    name: 'Hampton by Hilton Istanbul Old City',
    stars: 3,
    rating: 8.1,
    address: 'Mimar Hayrettin Mahallesi, İstanbul, Turkey',
    price: 11000,
    currency: 'RUB',
    hotelType: 'Hotel',
    distanceToCenter: 1200,
    description: 'Современный отель в Старом городе. Рядом с Гранд-базаром и мечетью Сулеймание.',
    images: IMAGES.standard.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  }
];

// Dubai hotels
const dubaiHotels: DemoHotel[] = [
  {
    id: 'dxb_burj_al_arab',
    name: 'Burj Al Arab Jumeirah',
    stars: 5,
    rating: 9.3,
    address: 'Jumeirah Beach Road, Dubai, UAE',
    price: 180000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 15000,
    description: 'Самый роскошный отель мира. Парус на фоне Персидского залива. Всё включено.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'dxb_atlantis',
    name: 'Atlantis, The Palm',
    stars: 5,
    rating: 8.7,
    address: 'Crescent Road, The Palm, Dubai, UAE',
    price: 75000,
    currency: 'RUB',
    hotelType: 'Resort Hotel',
    distanceToCenter: 20000,
    description: 'Аквапарк, аквариум и роскошные номера на острове Palm Jumeirah.',
    images: IMAGES.resort.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'dxb_rove',
    name: 'Rove Downtown Dubai',
    stars: 3,
    rating: 8.4,
    address: '312 Al Mustaqbal Street, Dubai, UAE',
    price: 22000,
    currency: 'RUB',
    hotelType: 'Design Hotel',
    distanceToCenter: 3000,
    description: 'Стильный отель рядом с Burj Khalifa. Молодёжная атмосфера и доступные цены.',
    images: IMAGES.boutique.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.standard
  },
  {
    id: 'dxb_jw_marriott',
    name: 'JW Marriott Marquis Hotel Dubai',
    stars: 5,
    rating: 8.8,
    address: 'Sheikh Zayed Road, Business Bay, Dubai, UAE',
    price: 35000,
    currency: 'RUB',
    hotelType: 'Business Hotel',
    distanceToCenter: 5000,
    description: 'Один из самых высоких отелей мира. Идеально для бизнес-поездок.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  }
];

// Bangkok hotels
const bangkokHotels: DemoHotel[] = [
  {
    id: 'bkk_mandarin',
    name: 'Mandarin Oriental Bangkok',
    stars: 5,
    rating: 9.4,
    address: '48 Oriental Avenue, Bangkok, Thailand',
    price: 55000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 2500,
    description: 'Легендарный отель на берегу Чао Прайя. С 1876 года принимает королей и знаменитостей.',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'bkk_lebua',
    name: 'lebua at State Tower',
    stars: 5,
    rating: 8.6,
    address: 'State Tower, 1055 Silom Road, Bangkok, Thailand',
    price: 28000,
    currency: 'RUB',
    hotelType: 'Luxury Hotel',
    distanceToCenter: 3500,
    description: 'Знаменитый отель с крышего бара Sky Bar из фильма "Мальчишник в Вегасе".',
    images: IMAGES.luxury.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  },
  {
    id: 'bkk_lub_d',
    name: 'Lub d Bangkok Silom',
    stars: 2,
    rating: 8.3,
    address: '4 Decho Road, Silom, Bangkok, Thailand',
    price: 3500,
    currency: 'RUB',
    hotelType: 'Hostel',
    distanceToCenter: 3000,
    description: 'Популярный хостел с отличной атмосферой. Общие номера и приватные комнаты.',
    images: IMAGES.budget.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: ['Wi-Fi', 'Общая кухня', 'Кондиционер']
  },
  {
    id: 'bkk_centara',
    name: 'Centara Grand at CentralWorld',
    stars: 5,
    rating: 8.5,
    address: '999/99 Rama 1 Road, Pathumwan, Bangkok, Thailand',
    price: 18000,
    currency: 'RUB',
    hotelType: 'Hotel',
    distanceToCenter: 1500,
    description: 'Современный отель в центре шоппинга. Прямой доступ к торговому центру.',
    images: IMAGES.standard.map((url, i) => ({ category: i === 0 ? 'exterior' : 'room', url })),
    amenities: AMENITIES.luxury
  }
];

// Export all hotels
export const DEMO_HOTELS: Record<string, DemoHotel[]> = {
  'Москва': moscowHotels,
  'Moscow': moscowHotels,
  'Мск': moscowHotels,
  'Санкт-Петербург': petersburgHotels,
  'Saint Petersburg': petersburgHotels,
  'Петербург': petersburgHotels,
  'Питер': petersburgHotels,
  'Париж': parisHotels,
  'Paris': parisHotels,
  'Стамбул': istanbulHotels,
  'Istanbul': istanbulHotels,
  'Дубай': dubaiHotels,
  'Dubai': dubaiHotels,
  'Бангкок': bangkokHotels,
  'Bangkok': bangkokHotels,
  // Default fallback
  'default': moscowHotels
};

// Test hotels (for API testing)
export const TEST_HOTELS: DemoHotel[] = [
  {
    id: 'test_hotel',
    hid: 1,
    name: 'Test Hotel (ТЕСТ - НЕ БРОНИРОВАТЬ)',
    stars: 4,
    rating: 8.0,
    address: 'Test Address, 123 (Тестовый отель Ostrovok)',
    price: 5000,
    currency: 'RUB',
    hotelType: 'Test Hotel',
    distanceToCenter: 1000,
    description: '⚠️ ТЕСТОВЫЙ ОТЕЛЬ для тестирования интеграции Ostrovok API. НЕ БРОНИРОВАТЬ!',
    images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop' }]
  },
  {
    id: 'test_hotel_do_not_book',
    hid: 2,
    name: 'Test Hotel DO NOT BOOK (ТЕСТ - НЕ БРОНИРОВАТЬ)',
    stars: 3,
    rating: 7.5,
    address: 'Test Address 2, 456 (Тестовый отель - НЕ БРОНИРОВАТЬ)',
    price: 3500,
    currency: 'RUB',
    hotelType: 'Test Hotel',
    distanceToCenter: 1500,
    description: '⚠️ ТЕСТОВЫЙ ОТЕЛЬ "DO NOT BOOK". Только для тестирования API. НЕ БРОНИРОВАТЬ!',
    images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop' }]
  }
];
