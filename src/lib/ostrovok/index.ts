/**
 * Ostrovok (Emerging Travel Group) Integration Module
 * 
 * Экспорты:
 * - links: генератор партнерских ссылок (HP + SERP)
 * - types: TypeScript типы
 * 
 * @example
 * ```ts
 * import { buildHotelPageLink, buildSerpLink, encodeGuests } from '@/lib/ostrovok';
 * 
 * // Страница отеля (если известен hotel_slug)
 * const hotelUrl = buildHotelPageLink('hotel_slug', {
 *   partnerSlug: '270392.affiliate.a0bd',
 *   checkIn: '2026-03-01',
 *   checkOut: '2026-03-03',
 *   rooms: [{ adults: 2, childrenAges: [9] }],
 * });
 * 
 * // SERP (если известен только region_id)
 * const serpUrl = buildSerpLink(12345, {
 *   partnerSlug: '270392.affiliate.a0bd',
 *   checkIn: '2026-03-01',
 *   checkOut: '2026-03-03',
 * });
 * ```
 */

export * from './links';
