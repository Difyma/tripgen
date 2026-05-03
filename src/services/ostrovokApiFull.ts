/**
 * Ostrovok (ETG) API Client Service
 * Full integration with all available data points
 * 
 * API Documentation: https://docs.emergingtravel.com
 */

import axios from 'axios';
import {
  buildHotelPageLink,
  buildSerpLink,
  encodeGuests,
  normalizeHotelPreviewImageUrl,
  etgHotelImageOptionsFromImportMeta,
  type RoomGuests,
} from '@/lib/ostrovok';
import type {
  Hotel,
  HotelSearchParams,
  HotelContentResponse,
  SuggestResponse,
  PrebookResponse,
  ImageSize
} from '../types/ostrovok';

// Legacy type alias for compatibility
export type PartnerLinkParams = {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  children?: number;
  partnerId?: string;
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Default image size for hotel photos
const DEFAULT_IMAGE_SIZE: ImageSize = '640x400';

/**
 * Format image URL with specific size (ETG: `{size}` + опции VITE_ETG_* — см. .env.example)
 */
export function formatImageUrl(url: string, size: ImageSize = DEFAULT_IMAGE_SIZE): string {
  return (
    normalizeHotelPreviewImageUrl(url, size, etgHotelImageOptionsFromImportMeta()) ??
    url.replace(/\{size\}/g, size)
  );
}

/**
 * Generate partner booking link for Ostrovok.ru
 * @deprecated Use buildHotelPageLink from '@/lib/ostrovok' instead
 */
export function generatePartnerLink(params: PartnerLinkParams): string {
  const partnerSlug = params.partnerId || import.meta.env.VITE_OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';
  
  const rooms: RoomGuests[] = [{
    adults: params.guests,
    childrenAges: params.children ? [params.children] : undefined
  }];
  
  return buildHotelPageLink(params.hotelId, {
    partnerSlug,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms,
  });
}

/**
 * Search hotels by location/query
 */
export async function searchHotels(params: HotelSearchParams): Promise<{
  hotels: Hotel[];
  total: number;
}> {
  const response = await axios.post(`${API_BASE_URL}/api/hotels/search`, {
    query: params.location,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests,
    children: params.children,
    residency: params.residency || 'ru',
    currency: params.currency || 'RUB',
    language: params.language || 'ru'
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to search hotels');
  }
  
  return {
    hotels: response.data.hotels,
    total: response.data.total
  };
}

/**
 * Get detailed hotel information with rates
 */
export async function getHotelPage(
  hotelId: string,
  params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    children?: number[];
  }
): Promise<Hotel> {
  const response = await axios.post(`${API_BASE_URL}/api/hotels/hotelpage`, {
    id: hotelId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: [{
      adults: params.guests,
      children: params.children || []
    }]
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to get hotel details');
  }
  
  return response.data.hotel;
}

/**
 * Get static hotel content (photos, descriptions, amenities)
 */
export async function getHotelContent(
  hotelId: string,
  language: string = 'ru'
): Promise<HotelContentResponse['content']> {
  const response = await axios.post(`${API_BASE_URL}/api/hotels/content`, {
    id: hotelId,
    language
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to get hotel content');
  }
  
  return response.data.content;
}

/**
 * Autocomplete search for hotels and regions
 */
export async function suggestHotelsAndRegions(
  query: string,
  language: string = 'ru'
): Promise<SuggestResponse> {
  const response = await axios.get(`${API_BASE_URL}/api/hotels/suggest`, {
    params: { q: query, language }
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to get suggestions');
  }
  
  return {
    hotels: response.data.hotels,
    regions: response.data.regions
  };
}

/**
 * Prebook a rate to confirm availability
 */
export async function prebookRate(
  bookHash: string,
  priceIncreasePercent: number = 0
): Promise<PrebookResponse> {
  const response = await axios.post(`${API_BASE_URL}/api/hotels/prebook`, {
    hash: bookHash,
    price_increase_percent: priceIncreasePercent
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to prebook rate');
  }
  
  return response.data.prebook;
}

/**
 * Get hotel images by category
 */
export function getImagesByCategory(
  hotel: Hotel,
  category?: string
): { category: string; url: string; sizes: Record<string, string> }[] {
  if (!hotel.images || hotel.images.length === 0) {
    return [];
  }
  
  if (category) {
    return hotel.images.filter(img => img.category === category);
  }
  
  return hotel.images;
}

/**
 * Get main hotel image (exterior or front)
 */
export function getMainHotelImage(hotel: Hotel): string | null {
  if (!hotel.images || hotel.images.length === 0) {
    return hotel.thumbnail || null;
  }
  
  // Priority order for main image
  const priorityCategories = ['exterior', 'hotel_front', 'outside', 'unspecified'];
  
  for (const cat of priorityCategories) {
    const image = hotel.images.find(img => img.category === cat);
    if (image) {
      return image.sizes?.medium || formatImageUrl(image.url);
    }
  }
  
  // Return first available image
  return hotel.images[0]?.sizes?.medium || formatImageUrl(hotel.images[0].url);
}

/**
 * Get room images
 */
export function getRoomImages(hotel: Hotel, roomGroupId?: number): any[] {
  if (!hotel.roomGroups || hotel.roomGroups.length === 0) {
    return [];
  }
  
  if (roomGroupId) {
    const roomGroup = hotel.roomGroups.find(rg => rg.room_group_id === roomGroupId);
    return roomGroup?.images || [];
  }
  
  // Return all room images
  return hotel.roomGroups.flatMap(rg => rg.images || []);
}

/**
 * Format hotel information for display
 */
export function formatHotelForDisplay(hotel: Hotel): {
  id: string;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  mainImage: string | null;
  price: number;
  currency: string;
  type: string;
  distanceToCenter?: string;
} {
  // Format distance to center
  let distanceStr: string | undefined;
  if (hotel.distanceToCenter) {
    const km = hotel.distanceToCenter / 1000;
    distanceStr = km < 1 
      ? `${Math.round(hotel.distanceToCenter)} м от центра`
      : `${km.toFixed(1)} км от центра`;
  }
  
  // Translate hotel type
  const typeTranslations: Record<string, string> = {
    'Hotel': 'Отель',
    'Resort': 'Курорт',
    'Apartment': 'Апартаменты',
    'Hostel': 'Хостел',
    'Guesthouse': 'Гостевой дом',
    'Villas_and_Bungalows': 'Вилла',
    'Mini-hotel': 'Мини-отель',
    'Boutique_and_Design': 'Бутик-отель',
    'Apart-hotel': 'Апарт-отель',
    'Camping': 'Кемпинг',
    'Glamping': 'Глэмпинг',
    'BNB': 'B&B',
    'Cottages_and_Houses': 'Коттедж',
    'Sanatorium': 'Санаторий',
    'Castle': 'Замок',
    'Farm': 'Ферма',
    'Unspecified': 'Размещение'
  };
  
  return {
    id: hotel.id,
    name: hotel.name,
    stars: hotel.stars,
    rating: hotel.rating,
    address: hotel.address,
    mainImage: getMainHotelImage(hotel),
    price: hotel.price,
    currency: hotel.currency,
    type: typeTranslations[hotel.hotelType || ''] || hotel.hotelType || 'Отель',
    distanceToCenter: distanceStr
  };
}

/**
 * Format amenities for display
 */
export function formatAmenities(hotel: Hotel): { category: string; items: string[] }[] {
  if (!hotel.amenities) {
    return [];
  }
  
  // Translations for common amenity categories
  const categoryTranslations: Record<string, string> = {
    'General': 'Общее',
    'Services': 'Услуги',
    'Wellness': 'Wellness',
    'Food & Drink': 'Еда и напитки',
    'Business': 'Бизнес',
    'Sports': 'Спорт',
    'Entertainment': 'Развлечения',
    'Children': 'Для детей',
    'Accessibility': 'Доступность',
    'Safety': 'Безопасность',
    'Health & Safety Measures': 'Меры безопасности',
    'Beauty and wellness': 'Красота и wellness',
    'Parking': 'Парковка',
    'Internet': 'Интернет',
    'Pets': 'Животные'
  };
  
  return hotel.amenities.map(group => ({
    category: categoryTranslations[group.group_name] || group.group_name,
    items: group.amenities
  }));
}

/**
 * Format policies for display
 */
export function formatPolicies(hotel: Hotel) {
  if (!hotel.metapolicy) {
    return null;
  }
  
  const mp = hotel.metapolicy;
  
  return {
    checkInOut: mp.check_in_check_out,
    meals: mp.meals,
    internet: mp.internet,
    parking: mp.parking,
    pets: mp.pets,
    children: mp.children,
    deposit: mp.deposit,
    cancellation: mp.no_show,
    extraInfo: mp.metapolicy_extra_info
  };
}

/**
 * Format hotel information for GPT/context
 */
export function formatHotelInfoForGPT(hotel: Hotel): string {
  const display = formatHotelForDisplay(hotel);
  const amenities = formatAmenities(hotel);
  
  let info = `🏨 ${display.name}\n`;
  info += `⭐ ${'★'.repeat(display.stars)} (${display.type})\n`;
  info += `📍 ${display.address}\n`;
  
  if (display.rating) {
    info += `📊 Рейтинг: ${display.rating}/10\n`;
  }
  
  if (display.distanceToCenter) {
    info += `🎯 ${display.distanceToCenter}\n`;
  }
  
  info += `💰 Цена от: ${display.price.toLocaleString('ru-RU')} ${display.currency}\n`;
  
  if (hotel.bookingUrl) {
    info += `🔗 Бронирование: ${hotel.bookingUrl}\n`;
  }
  
  // Add amenities summary
  if (amenities.length > 0) {
    const allAmenities = amenities.flatMap(g => g.items);
    if (allAmenities.length > 0) {
      info += `\n✨ Удобства: ${allAmenities.slice(0, 10).join(', ')}${allAmenities.length > 10 ? '...' : ''}\n`;
    }
  }
  
  // Add description preview
  if (hotel.description) {
    const preview = hotel.description.slice(0, 200);
    info += `\n📝 ${preview}${hotel.description.length > 200 ? '...' : ''}\n`;
  }
  
  return info;
}

/**
 * Format multiple hotels for GPT
 */
export function formatHotelsListForGPT(hotels: Hotel[], maxHotels: number = 5): string {
  if (hotels.length === 0) {
    return 'К сожалению, отелей по данному запросу не найдено.';
  }
  
  const limited = hotels.slice(0, maxHotels);
  
  let response = `# 🏨 Найдено отелей: ${hotels.length}\n\n`;
  
  limited.forEach((hotel, index) => {
    response += `## ${index + 1}. ${formatHotelInfoForGPT(hotel)}\n\n`;
  });
  
  if (hotels.length > maxHotels) {
    response += `_...и ещё ${hotels.length - maxHotels} отелей_`;
  }
  
  return response;
}

// Export all functions as a service object
export const ostrovokService = {
  searchHotels,
  getHotelPage,
  getHotelContent,
  suggestHotelsAndRegions,
  prebookRate,
  formatImageUrl,
  generatePartnerLink,
  getImagesByCategory,
  getMainHotelImage,
  getRoomImages,
  formatHotelForDisplay,
  formatAmenities,
  formatPolicies,
  formatHotelInfoForGPT,
  formatHotelsListForGPT
};

export default ostrovokService;
