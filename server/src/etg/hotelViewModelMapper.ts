import { createRequire } from 'node:module';
import {
  extractCancellationDeadlineLine,
  extractCancellationPolicyLine,
  extractCheckInOut,
  extractMealLine,
  extractTaxesLine,
} from './extractCertRateFields.js';
import { normalizeHotelPreviewImageUrlForServer } from '../lib/etgHotelImageUrl.js';

const requireCjs = createRequire(import.meta.url);
const { rewriteOstrovokHybridHotelPathToSerp, rewriteOstrovokHotelPathToRooms } = requireCjs(
  '../../lib/ostrovok-links.cjs'
) as {
  rewriteOstrovokHybridHotelPathToSerp: (u: string) => string | null;
  rewriteOstrovokHotelPathToRooms: (u: string) => string | null;
};

export interface HotelRateViewModel {
  finalPrice: number;
  currency: string;
  taxesAndFees?: string;
  mealType?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  checkInTime?: string;
  checkOutTime?: string;
  metapolicyHighlights?: string[];
  roomName?: string;
}

export interface HotelSearchViewModel {
  id: string;
  name: string;
  address: string;
  stars: number;
  rating?: number;
  bookingUrl?: string;
  distanceToCenter?: number;
  images?: { category: string; url: string }[];
  amenities?: string[];
  rate: HotelRateViewModel;
}

export function mapEtgHotelToViewModel(hotel: any): HotelSearchViewModel {
  const rate = hotel?.rates?.[0] || {};
  const paymentType = rate?.payment_options?.payment_types?.[0] || {};
  const cinout = extractCheckInOut(hotel);
  const rawBooking =
    typeof paymentType?.link === 'string' ? paymentType.link.trim() : undefined;
  const bookingUrl = rawBooking
    ? rewriteOstrovokHotelPathToRooms(rawBooking) || rewriteOstrovokHybridHotelPathToSerp(rawBooking) || rawBooking
    : undefined;

  return {
    id: String(hotel?.id || hotel?.hid || ''),
    name: hotel?.name || 'Hotel',
    address: hotel?.address || '',
    stars: Number(hotel?.stars || 0),
    rating: typeof hotel?.rating === 'number' ? hotel.rating : undefined,
    bookingUrl,
    distanceToCenter: typeof hotel?.distance_center === 'number' ? hotel.distance_center : undefined,
    images: Array.isArray(hotel?.images_ext)
      ? hotel.images_ext.map((i: any) => {
          const raw = typeof i?.url === 'string' ? i.url : '';
          return {
            category: i?.category || 'exterior',
            url: normalizeHotelPreviewImageUrlForServer(raw, '640x400') || raw,
          };
        })
      : undefined,
    amenities: Array.isArray(hotel?.amenities) ? hotel.amenities.map((a: any) => String(a)) : undefined,
    rate: {
      finalPrice: Number(paymentType?.show_amount || rate?.amount || hotel?.min_price || 0),
      currency: paymentType?.show_currency_code || rate?.payment_options?.show_currency_code || hotel?.currency || 'RUB',
      taxesAndFees: extractTaxesLine(rate),
      mealType: extractMealLine(rate),
      cancellationPolicy: extractCancellationPolicyLine(rate),
      cancellationDeadline: extractCancellationDeadlineLine(rate),
      checkInTime: cinout.in,
      checkOutTime: cinout.out,
      metapolicyHighlights: hotel?.metapolicy_struct ? [JSON.stringify(hotel.metapolicy_struct)] : undefined,
      roomName: rate?.room_name,
    },
  };
}
