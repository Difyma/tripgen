export interface Trip {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: string;
  image: string;
  status: 'upcoming' | 'past' | 'ongoing';
  route: string[];
  participants?: Array<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  }>;
  details?: {
    travelers: number;
    transportation: string[];
    accommodation: string[];
    activities: string[];
    costs: {
      transportation: number;
      accommodation: number;
      activities: number;
      food: number;
      other: number;
    };
  };
}

export const trips: Trip[] = [
  {
    id: '1',
    title: 'Отдых на Бали',
    location: 'Бали, Индонезия',
    startDate: '2024-08-15',
    endDate: '2024-08-25',
    cost: '$2,500',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    status: 'upcoming',
    route: ['Денпасар', 'Убуд', 'Нуса-Дуа', 'Семиньяк'],
    details: {
      travelers: 2,
      transportation: [
        'Перелет Москва - Денпасар',
        'Трансфер из аэропорта',
        'Аренда скутера'
      ],
      accommodation: [
        'Ubud Jungle Villa (4 ночи)',
        'Nusa Dua Beach Resort (3 ночи)',
        'Seminyak Luxury Suite (3 ночи)'
      ],
      activities: [
        'Посещение храма Танах Лот',
        'Рисовые террасы Тегаллаланг',
        'Серфинг в Нуса-Дуа',
        'Спа-процедуры',
        'Вулкан Батур на рассвете',
        'Ужин на пляже',
        'Урок йоги',
        'Посещение обезьяньего леса',
        'Водопад Гитгит',
        'Закат на пляже Улувату'
      ],
      costs: {
        transportation: 1200,
        accommodation: 800,
        activities: 300,
        food: 150,
        other: 50
      }
    }
  },
  {
    id: '2',
    title: 'Путешествие по Европе',
    location: 'Париж, Франция',
    startDate: '2024-06-10',
    endDate: '2024-06-20',
    cost: '$3,800',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    status: 'upcoming',
    route: ['Париж', 'Амстердам', 'Брюссель', 'Берлин'],
    details: {
      travelers: 2,
      transportation: [
        'Перелет Москва - Париж',
        'Поезд Париж - Амстердам',
        'Поезд Амстердам - Брюссель',
        'Поезд Брюссель - Берлин'
      ],
      accommodation: [
        'Le Petit Hotel Paris (3 ночи)',
        'Canal View Amsterdam (2 ночи)',
        'Brussels Central (2 ночи)',
        'Berlin Mitte Hotel (3 ночи)'
      ],
      activities: [
        'Эйфелева башня',
        'Лувр',
        'Круиз по каналам Амстердама',
        'Музей Ван Гога',
        'Гранд-Плас в Брюсселе',
        'Атомиум',
        'Берлинская стена',
        'Рейхстаг',
        'Музейный остров',
        'Потсдамская площадь'
      ],
      costs: {
        transportation: 1800,
        accommodation: 1200,
        activities: 400,
        food: 300,
        other: 100
      }
    }
  }
  // ... остальные путешествия
]; 