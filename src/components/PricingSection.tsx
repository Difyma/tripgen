'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';
import {
  fallbackSubscriptionPlans,
  getSubscriptionPlans,
  type SubscriptionPlan,
} from '../services/subscriptionPlansApi';

function formatPrice(plan: SubscriptionPlan): string {
  if (plan.priceMonthlyRub === 0) return '0 ₽';
  return `${plan.priceMonthlyRub.toLocaleString('ru-RU')} ₽/мес`;
}

const PricingSection = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(fallbackSubscriptionPlans);

  useEffect(() => {
    let cancelled = false;
    getSubscriptionPlans()
      .then((loadedPlans) => {
        if (!cancelled) setPlans(loadedPlans);
      })
      .catch((error) => {
        console.warn('[PricingSection] using fallback subscription plans:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-[#F5F5F7] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Тарифы TripGen
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            Выберите глубину планирования
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            От быстрого маршрута на выходные до нескольких сценариев поездки с AI-консьержем и совместным доступом.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className={[
                'relative flex min-h-[540px] flex-col rounded-[28px] p-7 shadow-sm transition-shadow duration-300 sm:p-8 xl:min-h-[590px]',
                plan.isFeatured
                  ? 'bg-gray-950 text-white shadow-2xl shadow-gray-950/20'
                  : 'bg-white text-gray-950',
              ].join(' ')}
            >
              {plan.isFeatured && (
                <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-950">
                  <Zap className="h-3.5 w-3.5" />
                  Популярный
                </div>
              )}

              <div>
                <p className={plan.isFeatured ? 'text-sm font-medium text-white/65' : 'text-sm font-medium text-gray-500'}>
                  {plan.eyebrow}
                </p>
                <h3 className="mt-4 text-4xl font-semibold tracking-tight">{plan.name}</h3>
                <div className="mt-6">
                  <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{formatPrice(plan)}</p>
                  <p className={plan.isFeatured ? 'mt-2 min-h-12 text-sm leading-6 text-white/60' : 'mt-2 min-h-12 text-sm leading-6 text-gray-500'}>
                    {plan.audience}
                  </p>
                </div>
                <p className={plan.isFeatured ? 'mt-5 text-base leading-7 text-white/70' : 'mt-5 text-base leading-7 text-gray-600'}>
                  {plan.description}
                </p>
              </div>

              <div className="mt-8 flex-1">
                {plan.intro && (
                  <p className={plan.isFeatured ? 'mb-4 text-sm font-semibold text-white' : 'mb-4 text-sm font-semibold text-gray-950'}>
                    {plan.intro}
                  </p>
                )}
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span
                        className={[
                          'mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full',
                          plan.isFeatured ? 'bg-white text-gray-950' : 'bg-gray-950 text-white',
                        ].join(' ')}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className={plan.isFeatured ? 'text-sm leading-6 text-white/82' : 'text-sm leading-6 text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/chat"
                className={[
                  'mt-10 inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors',
                  plan.isFeatured
                    ? 'bg-white text-gray-950 hover:bg-gray-100'
                    : 'bg-gray-950 text-white hover:bg-gray-800',
                ].join(' ')}
              >
                {plan.cta}
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
