import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getPgPool, hasPgConnectionConfig } from '../storage/postgres.js';
import { fallbackSubscriptionPlans, mapSubscriptionPlanRow } from '../subscriptions/plans.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

router.get('/', async (_req: Request, res: Response) => {
  if (hasPgConnectionConfig()) {
    try {
      const result = await getPgPool().query(
        `SELECT slug, name, eyebrow, price_monthly_rub, audience, description, intro, features,
                cta, ai_token_limit, trip_limit, can_export_route, can_share_trip,
                priority_generation, early_access, is_featured, sort_order
           FROM subscription_plans
          WHERE is_active = TRUE
          ORDER BY sort_order ASC, price_monthly_rub ASC`
      );
      return res.json({ plans: result.rows.map(mapSubscriptionPlanRow), source: 'postgres' });
    } catch (error) {
      console.error('[subscription-plans] postgres query failed:', error);
    }
  }

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
        return res.json({ plans: data.map(mapSubscriptionPlanRow), source: 'supabase' });
      }
    } catch (error) {
      console.error('[subscription-plans] supabase query failed:', error);
    }
  }

  return res.json({ plans: fallbackSubscriptionPlans, source: 'fallback' });
});

export default router;
