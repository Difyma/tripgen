const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';

function looksLikeHid(value) {
  return /^\d+$/.test(String(value));
}

function formatDates(checkIn, checkOut) {
  if (!checkIn || !checkOut) return undefined;
  const toDMY = (iso) => {
    const [y, m, d] = iso.split("-");
    return d + '.' + m + '.' + y;
  };
  return toDMY(checkIn) + '-' + toDMY(checkOut);
}

function encodeGuests(rooms) {
  if (!rooms || rooms.length === 0) return undefined;
  const roomStr = rooms.map((r) => {
    const adults = Math.max(1, Math.floor(r.adults || 1));
    const kids = (r.childrenAges || []).map(a => Math.floor(a)).filter(a => a >= 0 && a <= 17).slice(0, 4);
    if (kids.length === 0) return String(adults);
    return adults + 'and' + kids.join(".");
  });
  return roomStr.join("-");
}

function buildHotelPageLink(hotelSlug, params) {
  params = params || {};
  if (!hotelSlug || typeof hotelSlug !== "string") {
    throw new Error("hotelSlug is required");
  }
  if (looksLikeHid(hotelSlug)) {
    throw new Error("hotelSlug looks like hid (numeric): " + hotelSlug);
  }
  const partnerSlug = params.partnerSlug || PARTNER_SLUG;
  const dates = formatDates(params.checkIn, params.checkOut);
  const guests = encodeGuests(params.rooms);
  const url = new URL('https://www.ostrovok.ru/rooms/' + encodeURIComponent(hotelSlug) + '/');
  url.searchParams.set('utm_medium', 'partners');
  url.searchParams.set('partner_slug', partnerSlug);
  url.searchParams.set('utm_source', partnerSlug);
  if (params.partnerExtra) url.searchParams.set('partner_extra', params.partnerExtra);
  if (params.currency) url.searchParams.set('cur', params.currency);
  if (params.lang) url.searchParams.set('lang', params.lang);
  if (dates) url.searchParams.set('dates', dates);
  if (guests) url.searchParams.set('guests', guests);
  return url.toString();
}

function buildSerpLink(regionId, params) {
  params = params || {};
  const rid = String(regionId);
  if (!rid || !/^\d+$/.test(rid)) {
    throw new Error("regionId must be an integer");
  }
  const partnerSlug = params.partnerSlug || PARTNER_SLUG;
  const dates = formatDates(params.checkIn, params.checkOut);
  const guests = encodeGuests(params.rooms);
  const url = new URL('https://www.ostrovok.ru/hotels/');
  url.searchParams.set('q', rid);
  url.searchParams.set('utm_medium', 'partners');
  url.searchParams.set('partner_slug', partnerSlug);
  url.searchParams.set('utm_source', partnerSlug);
  if (params.partnerExtra) url.searchParams.set('partner_extra', params.partnerExtra);
  if (params.currency) url.searchParams.set('cur', params.currency);
  if (params.lang) url.searchParams.set('lang', params.lang);
  if (dates) url.searchParams.set('dates', dates);
  if (guests) url.searchParams.set('guests', guests);
  return url.toString();
}

function validateAttribution(url) {
  try {
    const u = new URL(url);
    const errors = [];
    if (!u.searchParams.has('partner_slug')) errors.push('Missing partner_slug');
    if (u.searchParams.get('utm_medium') !== 'partners') errors.push('Missing utm_medium');
    if (!u.searchParams.has('utm_source')) errors.push('Missing utm_source');
    const isHP = u.pathname.startsWith('/rooms/');
    const isSERP = u.pathname === '/hotels/' || u.searchParams.has('q');
    if (isHP) {
      const match = u.pathname.match(/\/rooms\/([^/]+)/);
      if (match && /^\d+$/.test(match[1])) {
        errors.push('HP link uses hid instead of slug');
      }
    }
    return { valid: errors.length === 0, errors, isHP, isSERP };
  } catch (e) {
    return { valid: false, errors: ['Invalid URL'], isHP: false, isSERP: false };
  }
}

module.exports = { PARTNER_SLUG, buildHotelPageLink, buildSerpLink, validateAttribution, encodeGuests, formatDates };

// Legacy function for backward compatibility
function generatePartnerLinkLegacy(hotelIdOrSlug, searchParams, hotelName, city) {
  searchParams = searchParams || {};
  const checkIn = searchParams.checkIn;
  const checkOut = searchParams.checkOut;
  const guests = searchParams.guests || 2;
  
  const hotelIdStr = String(hotelIdOrSlug);
  
  // If numeric hid
  if (/^\d+$/.test(hotelIdStr)) {
    // Test hotels
    if (hotelIdStr === '1') {
      return buildHotelPageLink('test_hotel', { checkIn, checkOut, rooms: [{ adults: guests }] });
    }
    if (hotelIdStr === '2') {
      return buildHotelPageLink('test_hotel_do_not_book', { checkIn, checkOut, rooms: [{ adults: guests }] });
    }
    
    // City to region mapping
    const cityRegionMap = {
      'москва': 1, 'moscow': 1,
      'санкт-петербург': 2, 'saint petersburg': 2,
      'париж': 53, 'paris': 53,
      'лондон': 211, 'london': 211,
      'дубай': 1435, 'dubai': 1435,
      'стамбул': 876, 'istanbul': 876,
    };
    
    const regionId = city ? cityRegionMap[city.toLowerCase().trim()] : null;
    if (regionId) {
      return buildSerpLink(regionId, { checkIn, checkOut, rooms: [{ adults: guests }] });
    }
    
    // Fallback to Moscow
    return buildSerpLink(1, { checkIn, checkOut, rooms: [{ adults: guests }] });
  }
  
  // It's a slug
  // Только test_hotel и test_hotel_do_not_book — валидные slug для Ostrovok
  if (hotelIdStr === 'test_hotel' || hotelIdStr === 'test_hotel_do_not_book') {
    return buildHotelPageLink(hotelIdStr, { checkIn, checkOut, rooms: [{ adults: guests }] });
  }
  // Для всех остальных строковых ID (demo отели) — используем тестовый отель
  console.warn(`[generatePartnerLinkLegacy] Demo hotel ID=${hotelIdOrSlug}, using test_hotel fallback`);
  return buildHotelPageLink('test_hotel', { checkIn, checkOut, rooms: [{ adults: guests }] });
}

module.exports.generatePartnerLinkLegacy = generatePartnerLinkLegacy;
