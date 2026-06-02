/**
 * Преобразует TripPlanResponse в человекочитаемый markdown для отображения в чате.
 * Defensive: не рендерит пустые блоки/ссылки/картинки, экранирует спецсимволы в тексте.
 */

import type { TripPlanResponse } from '../types/tripPlan';

/** Экранирует символы, которые могут сломать markdown: \ ` * _ [ ] ( ) # */
function escapeMarkdownText(s: string | null | undefined): string {
  if (s == null || typeof s !== 'string') return '';
  return s
    .replace(/\\/g, '\\\\')
    .replace(/[`*_[\]()#]/g, '\\$&');
}

function block(lines: string[], prefix = '-'): string {
  const filtered = lines
    .filter((s) => s != null && String(s).trim() !== '')
    .map((s) => escapeMarkdownText(String(s).trim()));
  if (filtered.length === 0) return '';
  return filtered.map((line) => `${prefix} ${line}`).join('\n') + '\n\n';
}

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalizeMapsQuery(line: string): string {
  return line
    .replace(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/gi, '')
    .replace(/^[\s\-•●\d.:()]+/g, '')
    .replace(/\s*[—–-]\s.*$/g, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(
      /\b(посещение|экскурсия|прогулка|поездка|обед|ужин|завтрак|кофе-брейк|осмотр|визит)\b\s+/i,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function withMapsLink(line: string): string {
  const value = safeStr(line);
  if (!value) return '';
  if (/^\s*#{1,6}\s*/.test(value)) return escapeMarkdownText(value);
  if (value.length > 80) return escapeMarkdownText(value);
  if (/\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(value)) return value;
  const query = normalizeMapsQuery(value);
  const weak = /^(адрес|рейтинг|цена|до центра|налоги|питание|отмена|дедлайн|номер|практические советы?)$/i;
  if (!query || query.length < 3 || query.length > 90 || weak.test(query) || !/[A-Za-zА-Яа-яЁё]/.test(query)) {
    return escapeMarkdownText(value);
  }
  return `[${escapeMarkdownText(value)}](${mapsUrl(query)})`;
}

function blockWithMaps(lines: string[], prefix = '-'): string {
  const filtered = lines
    .filter((s) => s != null && String(s).trim() !== '')
    .map((s) => withMapsLink(String(s)));
  if (filtered.length === 0) return '';
  return filtered.map((line) => `${prefix} ${line}`).join('\n') + '\n\n';
}

function safeStr(s: string | null | undefined): string {
  if (s == null || typeof s !== 'string') return '';
  return s.trim();
}

export function formatTripPlanToMarkdown(plan: TripPlanResponse): string {
  const out: string[] = [];

  const tripSummary = safeStr(plan.tripSummary);
  if (tripSummary) {
    out.push('# 🌟 Краткий обзор поездки\n\n', escapeMarkdownText(tripSummary), '\n\n');
  }

  if (Array.isArray(plan.assumptions) && plan.assumptions.length > 0) {
    const lines = plan.assumptions.map((a) => safeStr(a)).filter(Boolean);
    if (lines.length > 0) {
      out.push('**Предположения:**\n\n', block(lines), '\n');
    }
  }

  if (Array.isArray(plan.recommendedAreas) && plan.recommendedAreas.length > 0) {
    const valid = plan.recommendedAreas.filter((a) => safeStr(a.name) || safeStr(a.reason));
    if (valid.length > 0) {
      out.push('# 🗺 Рекомендуемые районы\n\n');
      valid.forEach((a) => {
        const name = withMapsLink(safeStr(a.name) || 'Район');
        const reason = escapeMarkdownText(safeStr(a.reason));
        out.push(`${name} — ${reason}\n\n`);
      });
    }
  }

  if (Array.isArray(plan.hotelRecommendations) && plan.hotelRecommendations.length > 0) {
    out.push('# 🏨 Где остановиться\n\n');
    const topNames = plan.hotelRecommendations
      .map((h) => safeStr(h.name))
      .filter(Boolean)
      .slice(0, 3)
      .map((n) => `**${escapeMarkdownText(n)}**`);
    if (topNames.length > 0) {
      out.push(`Подобрал варианты размещения: ${topNames.join(', ')}.\n\n`);
    }
    out.push('Ниже в карточках показаны рекомендованные отели с актуальными ценами и ссылками на бронирование.\n\n');
  }

  if (Array.isArray(plan.highlights) && plan.highlights.length > 0) {
    const lines = plan.highlights.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) {
      out.push('# 🎯 Что посмотреть\n\n', blockWithMaps(lines), '\n');
    }
  }

  if (Array.isArray(plan.itinerary) && plan.itinerary.length > 0) {
    const daysWithContent = plan.itinerary.filter((day) => {
      const m = Array.isArray(day.morning) && day.morning.length > 0;
      const d = Array.isArray(day.daytime) && day.daytime.length > 0;
      const e = Array.isArray(day.evening) && day.evening.length > 0;
      return m || d || e;
    });
    if (daysWithContent.length > 0) {
      out.push('# 📅 Маршрут по дням\n\n');
      daysWithContent.forEach((day) => {
        const dayNum = typeof day.day === 'number' ? day.day : 1;
        const title = escapeMarkdownText(safeStr(day.title) || `День ${dayNum}`);
        out.push(`## ${title}\n\n`);
        if (Array.isArray(day.morning) && day.morning.length > 0) {
          out.push('### ⏰ Утро\n\n', blockWithMaps(day.morning), '\n');
        }
        if (Array.isArray(day.daytime) && day.daytime.length > 0) {
          out.push('### 🌞 День\n\n', blockWithMaps(day.daytime), '\n');
        }
        if (Array.isArray(day.evening) && day.evening.length > 0) {
          out.push('### 🌅 Вечер\n\n', blockWithMaps(day.evening), '\n');
        }
      });
    }
  }

  if (Array.isArray(plan.foodRecommendations) && plan.foodRecommendations.length > 0) {
    const lines = plan.foodRecommendations.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) {
      out.push('# 🍽 Еда и рестораны\n\n', blockWithMaps(lines), '\n');
    }
  }

  if (Array.isArray(plan.practicalTips) && plan.practicalTips.length > 0) {
    const lines = plan.practicalTips.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) {
      out.push('# 💡 Практические советы\n\n', block(lines), '\n');
    }
  }

  const followUp = safeStr(plan.followUpQuestion);
  if (followUp) {
    out.push('\n---\n\n', escapeMarkdownText(followUp));
  }

  const result = out.join('').trim();
  return result || '';
}
