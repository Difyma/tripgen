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
      const parts = details
        .map((t: any) => {
          if (!t) return '';
          if (typeof t === 'string') return t;
          const name = t.name || t.title || t.type;
          const amt = t.amount ?? t.amount_show ?? t.value;
          const cur = t.currency || t.currency_code || '';
          if (name && amt != null) return `${name}: ${amt} ${cur}`.trim();
          return JSON.stringify(t);
        })
        .filter(Boolean);
      if (parts.length) return parts.join('; ');
    }
    const raw = JSON.stringify(td);
    if (raw !== '{}') return raw;
  }
  const show = Number(pt?.show_amount);
  const net = Number(pt?.amount ?? rate?.amount);
  const cur = pt?.show_currency_code || pt?.currency_code || rate?.currency || 'RUB';
  if (Number.isFinite(show) && Number.isFinite(net) && show > net) {
    return `Доп. сборы/налоги к тарифу: ${(show - net).toLocaleString('ru-RU')} ${cur}`;
  }
  return 'В ответе API налоги не переданы отдельной строкой';
}

export function extractMealLine(rate: any): string {
  const v =
    rate?.meal_data?.value ||
    rate?.meal_data?.meal_name ||
    rate?.meal ||
    firstPaymentType(rate)?.meal_data?.value ||
    firstPaymentType(rate)?.meal;
  if (typeof v === 'string' && v.trim()) return v.trim();
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
  if (!pen) return 'Политика отмены: без блока cancellation_penalties в ответе';

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
    return `Политика отмены: ${JSON.stringify(pen.policies[0])}`;
  }
  const compact = JSON.stringify(pen);
  if (compact && compact !== '{}') return `Политика отмены (сырой фрагмент): ${compact.slice(0, 500)}${compact.length > 500 ? '…' : ''}`;
  return 'Политика отмены: пустой объект в API';
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

export function extractMetapolicyHighlights(metapolicy: any): string[] {
  if (!metapolicy || typeof metapolicy !== 'object') return [];
  const lines: string[] = [];

  const children = metapolicy.children;
  if (children) {
    if (children.allow === false) lines.push('Дети: не допускаются');
    else if (children.min_age != null) lines.push(`Дети: допускаются с ${children.min_age} лет`);
    else if (children.allow === true) lines.push('Дети: допускаются');
  }

  const infant = metapolicy.infant;
  if (infant) {
    if (infant.allow === false) lines.push('Младенцы: не допускаются');
    else if (infant.allow === true) lines.push('Младенцы: допускаются');
  }

  const pets = metapolicy.pets;
  if (pets) {
    if (pets.allow === false) lines.push('Животные: не допускаются');
    else if (pets.allow === true) {
      const note = pets.charge ? ` (доп. плата ${pets.charge})` : '';
      lines.push(`Животные: допускаются${note}`);
    }
  }

  const extraBed = metapolicy.extra_bed;
  if (extraBed) {
    if (extraBed.available === false) lines.push('Дополнительная кровать: недоступна');
    else if (extraBed.available === true) {
      const charge = extraBed.charge ? ` (${extraBed.charge})` : '';
      lines.push(`Дополнительная кровать: доступна${charge}`);
    }
  }

  const crib = metapolicy.crib ?? metapolicy.baby_cot;
  if (crib) {
    if (crib.available === false) lines.push('Детская кроватка: недоступна');
    else if (crib.available === true) {
      const charge = crib.charge ? ` (${crib.charge})` : ' (бесплатно)';
      lines.push(`Детская кроватка: доступна${charge}`);
    }
  }

  const smoking = metapolicy.smoking;
  if (smoking) {
    if (smoking.allowed === false) lines.push('Курение: запрещено');
    else if (smoking.allowed === true) lines.push('Курение: разрешено');
  }

  if (lines.length === 0 && Object.keys(metapolicy).length > 0) {
    const raw = JSON.stringify(metapolicy);
    lines.push(raw.length > 300 ? raw.slice(0, 300) + '…' : raw);
  }

  return lines;
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
