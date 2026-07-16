const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const withApiBase = (path: string): string => `${API_URL}${path}`;

export interface SubscriptionPlan {
  slug: string;
  name: string;
  eyebrow: string;
  priceMonthlyRub: number;
  audience: string;
  description: string;
  intro?: string;
  features: string[];
  cta: string;
  aiTokenLimit: number;
  tripLimit: number | null;
  canExportRoute: boolean;
  canShareTrip: boolean;
  priorityGeneration: boolean;
  earlyAccess: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export const fallbackSubscriptionPlans: SubscriptionPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    eyebrow: 'Для старта',
    priceMonthlyRub: 0,
    audience: 'Попробовать сервис',
    description: 'Базовый набор для первого маршрута.',
    features: [
      'AI-планировщик путешествий',
      'Ограниченный дневной лимит',
      'Сохранение до 3 поездок',
      'Базовые рекомендации',
    ],
    cta: 'Начать бесплатно',
    aiTokenLimit: 100000,
    tripLimit: 3,
    canExportRoute: false,
    canShareTrip: false,
    priorityGeneration: false,
    earlyAccess: false,
    isFeatured: false,
    sortOrder: 10,
  },
  {
    slug: 'plus',
    name: 'Plus',
    eyebrow: 'Больше свободы',
    priceMonthlyRub: 490,
    audience: 'Путешествует несколько раз в год',
    description: 'Для регулярного планирования и сохранения маршрутов.',
    features: [
      'В 10 раз больше AI-лимита',
      'Неограниченное количество поездок',
      'Сохранение всех маршрутов',
      'Экспорт маршрута',
      'Совместный доступ к поездке',
      'Приоритетная скорость генерации',
    ],
    cta: 'Выбрать Plus',
    aiTokenLimit: 1000000,
    tripLimit: null,
    canExportRoute: true,
    canShareTrip: true,
    priorityGeneration: true,
    earlyAccess: false,
    isFeatured: true,
    sortOrder: 20,
  },
  {
    slug: 'pro',
    name: 'Pro',
    eyebrow: 'Максимум персонализации',
    priceMonthlyRub: 990,
    audience: 'Частые путешественники',
    description: 'Для сложных поездок и нескольких сценариев.',
    intro: 'Плюс ко всему:',
    features: [
      'Максимальный AI-лимит',
      'Расширенные маршруты',
      'Несколько вариантов поездки одновременно',
      'AI-консьерж',
      'Глубокая персонализация',
      'Доступ к новым функциям раньше остальных',
    ],
    cta: 'Выбрать Pro',
    aiTokenLimit: 3000000,
    tripLimit: null,
    canExportRoute: true,
    canShareTrip: true,
    priorityGeneration: true,
    earlyAccess: true,
    isFeatured: false,
    sortOrder: 30,
  },
  {
    slug: 'premium',
    name: 'Premium',
    eyebrow: 'Для профессионалов',
    priceMonthlyRub: 1990,
    audience: 'Digital nomads, тревел-блогеры, турагенты',
    description: 'Для тех, кто планирует поездки постоянно или для клиентов.',
    intro: 'Все возможности Pro, плюс:',
    features: [
      'Расширенный AI-консьерж',
      'Глубокая персонализация профилей',
      'Приоритетный доступ к новым функциям',
      'Сценарии для клиентов и команд',
      'Больше вариантов маршрута одновременно',
      'Усиленная скорость генерации',
    ],
    cta: 'Выбрать Premium',
    aiTokenLimit: 8000000,
    tripLimit: null,
    canExportRoute: true,
    canShareTrip: true,
    priorityGeneration: true,
    earlyAccess: true,
    isFeatured: false,
    sortOrder: 40,
  },
];

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(withApiBase('/api/subscription-plans'));
  if (!response.ok) throw new Error(`Failed to load subscription plans: ${response.status}`);
  const data = await response.json() as { plans?: SubscriptionPlan[] };
  if (!Array.isArray(data.plans) || data.plans.length === 0) {
    throw new Error('Subscription plans response is empty');
  }
  return data.plans;
}
