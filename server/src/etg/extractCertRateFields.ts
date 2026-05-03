/**
 * Map ETG SERP rate + hotel into certification-friendly strings (taxes, meal, cancellation).
 * Prefer human-readable text derived from API payloads, not generic "Не указано".
 */

function firstPaymentType(rate: any): any {
  return rate?.payment_options?.payment_types?.[0];
}

export function extractTaxesLine(rate: any): string {
  const pt = firstPaymentType(rate);
  const td = pt?.tax_data;
  if (typeof td?.taxes === 'string' && td.taxes.trim()) {
    return td.taxes.trim();
  }
  if (td && typeof td === 'object') {
    const details = td.tax_details ?? td.items;
    if (Array.isArray(details) && details.length > 0) {
      const names: string[] = [];
      let included = 0;
      let notIncluded = 0;
      for (const t of details) {
        if (!t || typeof t !== 'object') continue;
        const n = String((t as any).name || (t as any).title || (t as any).type || '').trim();
        if (n) names.push(n);
        if ((t as any).included_by_supplier === true) included += 1;
        if ((t as any).included_by_supplier === false) notIncluded += 1;
      }
      if (included > 0 || notIncluded > 0) {
        const labels = names.slice(0, 2).join(', ');
        const suffix = labels ? ` (${labels}${names.length > 2 ? '…' : ''})` : '';
        if (included > 0 && notIncluded > 0) {
          return `Налоги/сборы: включено ${included}, оплачивается отдельно ${notIncluded}${suffix}`;
        }
        if (included > 0) {
          return `Налоги/сборы включены в тариф${suffix}`;
        }
        return `Есть дополнительные налоги/сборы${suffix}`;
      }
      if (names.length > 0) {
        return `Налоги/сборы: ${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`;
      }
      return 'Налоги/сборы присутствуют (детали в тарифе)';
    }
    if (td.tax_amount != null || td.total_taxes != null) {
      const amount = Number(td.tax_amount ?? td.total_taxes);
      const cur = pt?.show_currency_code || pt?.currency_code || rate?.currency || 'RUB';
      if (Number.isFinite(amount) && amount > 0) {
        return `Налоги/сборы: ${amount.toLocaleString('ru-RU')} ${cur}`;
      }
    }
  }
  const show = Number(pt?.show_amount);
  const net = Number(pt?.amount ?? rate?.amount);
  const cur = pt?.show_currency_code || pt?.currency_code || rate?.currency || 'RUB';
  if (Number.isFinite(show) && Number.isFinite(net) && show > net && show > 0) {
    const extra = show - net;
    // Avoid misleading huge deltas on synthetic/test rates.
    if (extra > 0 && extra <= show * 0.3) {
      return `Доп. сборы/налоги к тарифу: ${extra.toLocaleString('ru-RU')} ${cur}`;
    }
  }
  return 'Налоги/сборы уточняются на шаге бронирования';
}

export function extractMealLine(rate: any): string {
  const v =
    rate?.meal_data?.value ||
    rate?.meal_data?.meal_name ||
    rate?.meal ||
    firstPaymentType(rate)?.meal_data?.value ||
    firstPaymentType(rate)?.meal;
  if (typeof v === 'string' && v.trim()) {
    const meal = v.trim().toLowerCase();
    if (meal === 'breakfast') return 'Завтрак';
    if (meal === 'lunch') return 'Обед';
    if (meal === 'dinner') return 'Ужин';
    if (meal === 'half board') return 'Полупансион';
    if (meal === 'full board') return 'Полный пансион';
    if (meal === 'all inclusive') return 'Все включено';
    if (meal === 'no meals' || meal === 'without meals' || meal === 'nomeal' || meal === 'room only') return 'Без питания';
    return v.trim();
  }
  return 'Тип питания не указан в блоке тарифа';
}

function firstCancellationBlock(rate: any): any {
  const cp = rate?.cancellation_penalties;
  if (Array.isArray(cp) && cp.length > 0) return cp[0];
  if (cp && typeof cp === 'object' && !Array.isArray(cp)) return cp;
  return undefined;
}

export function extractCancellationPolicyLine(rate: any): string {
  const pen = firstCancellationBlock(rate);
  if (!pen) return 'Условия отмены уточняются в тарифе';

  if (pen.free_cancellation_before) {
    try {
      const d = new Date(pen.free_cancellation_before);
      if (!Number.isNaN(d.getTime())) {
        return `Бесплатная отмена до ${d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
      }
    } catch {
      /* ignore */
    }
  }
  if (Array.isArray(pen.policies) && pen.policies.length > 0) {
    const p0 = pen.policies[0];
    const amt = p0?.amount_show ?? p0?.amount_charge ?? p0?.amount;
    const cur = rate?.currency || 'RUB';
    if (amt != null && Number(amt) > 0) {
      return `Отмена со штрафом от ${Number(amt).toLocaleString('ru-RU')} ${cur} (по данным API)`;
    }
    return 'Частично/условно возвратный тариф (см. условия бронирования)';
  }
  return 'Условия отмены доступны на шаге бронирования';
}

export function extractCancellationDeadlineLine(rate: any): string {
  const pen = firstCancellationBlock(rate);
  if (!pen) return '—';
  if (pen.free_cancellation_before) {
    try {
      const d = new Date(pen.free_cancellation_before);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
      }
    } catch {
      /* ignore */
    }
    return String(pen.free_cancellation_before);
  }
  if (pen.start_at) return String(pen.start_at);
  if (Array.isArray(pen.policies) && pen.policies[0]?.date_from) {
    return String(pen.policies[0].date_from);
  }
  return '—';
}

export function extractCheckInOut(hotel: any): { in: string; out: string } {
  const cin = hotel?.check_in_time || hotel?.checkin_time;
  const cout = hotel?.check_out_time || hotel?.checkout_time;
  const fmt = (v: unknown) => {
    if (v == null || v === '') return '—';
    if (typeof v === 'string') return v.replace(/:00$/, '').replace(/:00:00$/, '');
    return String(v);
  };
  return { in: fmt(cin), out: fmt(cout) };
}
