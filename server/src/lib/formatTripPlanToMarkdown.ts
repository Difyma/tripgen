/**
 * Преобразует TripPlanResponse в markdown для чата. Defensive. Синхронизировано с src/lib/formatTripPlanToMarkdown.ts.
 */

import type { TripPlanResponse } from '../types/tripPlan.js';

function escapeMarkdownUrl(url: string): string {
  if (url == null || typeof url !== 'string') return '';
  const t = url.trim();
  return t.startsWith('http://') || t.startsWith('https://') ? t : '';
}

function escapeMarkdownText(s: string | null | undefined): string {
  if (s == null || typeof s !== 'string') return '';
  return s.replace(/\\/g, '\\\\').replace(/[`*_[\]()#]/g, '\\$&');
}

function block(lines: string[], prefix = '-'): string {
  const filtered = lines
    .filter((s) => s != null && String(s).trim() !== '')
    .map((s) => escapeMarkdownText(String(s).trim()));
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
    if (lines.length > 0) out.push('**Предположения:**\n\n', block(lines), '\n');
  }

  if (Array.isArray(plan.recommendedAreas) && plan.recommendedAreas.length > 0) {
    const valid = plan.recommendedAreas.filter((a) => safeStr(a.name) || safeStr(a.reason));
    if (valid.length > 0) {
      out.push('# 🗺 Рекомендуемые районы\n\n');
      valid.forEach((a) => {
        const name = escapeMarkdownText(safeStr(a.name) || 'Район');
        const reason = escapeMarkdownText(safeStr(a.reason));
        out.push(`**${name}** — ${reason}\n\n`);
      });
    }
  }

  if (Array.isArray(plan.hotelRecommendations) && plan.hotelRecommendations.length > 0) {
    out.push('# 🏨 Где остановиться\n\n');
    plan.hotelRecommendations.forEach((h) => {
      const name = safeStr(h.name) || 'Отель';
      const safeName = escapeMarkdownText(name);
      out.push(`## ${safeName}\n\n`);
      const photoUrl = escapeMarkdownUrl(h.photoUrl ?? '');
      if (photoUrl) out.push(`![${safeName}](${photoUrl})\n\n`);
      const details: string[] = [];
      if (safeStr(h.address)) details.push(`Адрес: ${escapeMarkdownText(h.address?.trim())}`);
      if (h.rating != null && String(h.rating).trim() !== '') details.push(`Рейтинг: ${String(h.rating)}`);
      if (safeStr(h.price)) details.push(`Цена: ${escapeMarkdownText(h.price?.trim())}`);
      if (h.stars != null && String(h.stars) !== '') details.push(`Звёздность: ${h.stars}`);
      if (safeStr(h.distanceToCenter)) details.push(`До центра: ${escapeMarkdownText(h.distanceToCenter?.trim())}`);
      if (details.length > 0) out.push(details.join(' • '), '\n\n');
      if (safeStr(h.description)) out.push(escapeMarkdownText(h.description?.trim()), '\n\n');
      if (safeStr(h.whyThisHotel)) out.push('*Почему этот отель:* ', escapeMarkdownText(h.whyThisHotel?.trim()), '\n\n');
      const bookingUrl = escapeMarkdownUrl(h.bookingUrl ?? '');
      if (bookingUrl) out.push(`[🛎️ Забронировать отель](${bookingUrl})\n\n`);
    });
  }

  if (Array.isArray(plan.highlights) && plan.highlights.length > 0) {
    const lines = plan.highlights.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) out.push('# 🎯 Что посмотреть\n\n', block(lines), '\n');
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
        if (Array.isArray(day.morning) && day.morning.length > 0) out.push('### ⏰ Утро\n\n', block(day.morning), '\n');
        if (Array.isArray(day.daytime) && day.daytime.length > 0) out.push('### 🌞 День\n\n', block(day.daytime), '\n');
        if (Array.isArray(day.evening) && day.evening.length > 0) out.push('### 🌅 Вечер\n\n', block(day.evening), '\n');
      });
    }
  }

  if (Array.isArray(plan.foodRecommendations) && plan.foodRecommendations.length > 0) {
    const lines = plan.foodRecommendations.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) out.push('# 🍽 Еда и рестораны\n\n', block(lines), '\n');
  }

  if (Array.isArray(plan.practicalTips) && plan.practicalTips.length > 0) {
    const lines = plan.practicalTips.map((s) => safeStr(s)).filter(Boolean);
    if (lines.length > 0) out.push('# 💡 Практические советы\n\n', block(lines), '\n');
  }

  const followUp = safeStr(plan.followUpQuestion);
  if (followUp) out.push('\n---\n\n', escapeMarkdownText(followUp));

  const result = out.join('').trim();
  return result || '';
}
