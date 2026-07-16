import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

type SubscriptionPlan = {
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
};

const fallbackPlans: SubscriptionPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    eyebrow: 'Для старта',
    priceMonthlyRub: 0,
    audience: 'Попробовать сервис',
    description: 'Базовый набор для первого маршрута.',
    features: ['AI-планировщик путешествий', 'Ограниченный дневной лимит', 'Сохранение до 3 поездок', 'Базовые рекомендации'],
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
    features: ['В 10 раз больше AI-лимита', 'Неограниченное количество поездок', 'Сохранение всех маршрутов', 'Экспорт маршрута', 'Совместный доступ к поездке', 'Приоритетная скорость генерации'],
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
    features: ['Максимальный AI-лимит', 'Расширенные маршруты', 'Несколько вариантов поездки одновременно', 'AI-консьерж', 'Глубокая персонализация', 'Доступ к новым функциям раньше остальных'],
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
    features: ['Расширенный AI-консьерж', 'Глубокая персонализация профилей', 'Приоритетный доступ к новым функциям', 'Сценарии для клиентов и команд', 'Больше вариантов маршрута одновременно', 'Усиленная скорость генерации'],
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

const { Pool } = pg;
let pool: pg.Pool | null = null;

function hasPgConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.PGDATABASE && process.env.PGHOST && process.env.PGUSER)
  );
}

function getPool(): pg.Pool {
  if (pool) return pool;
  pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
        max: 2,
      })
    : new Pool({
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
        max: 2,
      });
  return pool;
}

function mapRow(row: any): SubscriptionPlan {
  return {
    slug: String(row.slug || ''),
    name: String(row.name || ''),
    eyebrow: String(row.eyebrow || ''),
    priceMonthlyRub: Number(row.price_monthly_rub || 0),
    audience: String(row.audience || ''),
    description: String(row.description || ''),
    intro: row.intro ? String(row.intro) : undefined,
    features: Array.isArray(row.features) ? row.features.map((x: unknown) => String(x)) : [],
    cta: String(row.cta || ''),
    aiTokenLimit: Number(row.ai_token_limit || 100000),
    tripLimit: row.trip_limit == null ? null : Number(row.trip_limit),
    canExportRoute: Boolean(row.can_export_route),
    canShareTrip: Boolean(row.can_share_trip),
    priorityGeneration: Boolean(row.priority_generation),
    earlyAccess: Boolean(row.early_access),
    isFeatured: Boolean(row.is_featured),
    sortOrder: Number(row.sort_order || 0),
  };
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return url && key ? createClient(url, key) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (hasPgConfig()) {
    try {
      const result = await getPool().query(
        `SELECT slug, name, eyebrow, price_monthly_rub, audience, description, intro, features,
                cta, ai_token_limit, trip_limit, can_export_route, can_share_trip,
                priority_generation, early_access, is_featured, sort_order
           FROM subscription_plans
          WHERE is_active = TRUE
          ORDER BY sort_order ASC, price_monthly_rub ASC`
      );
      return res.status(200).json({ plans: result.rows.map(mapRow), source: 'postgres' });
    } catch (error) {
      console.error('[api/subscription-plans] postgres query failed:', error);
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('slug, name, eyebrow, price_monthly_rub, audience, description, intro, features, cta, ai_token_limit, trip_limit, can_export_route, can_share_trip, priority_generation, early_access, is_featured, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('price_monthly_rub', { ascending: true });

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return res.status(200).json({ plans: data.map(mapRow), source: 'supabase' });
      }
    } catch (error) {
      console.error('[api/subscription-plans] supabase query failed:', error);
    }
  }

  return res.status(200).json({ plans: fallbackPlans, source: 'fallback' });
}
