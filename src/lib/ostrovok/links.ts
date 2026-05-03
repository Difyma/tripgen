/**
 * Ostrovok (Emerging Travel Group) Link Builder
 * 
 * Ключевые правила:
 * - hid (число) используется в API, но НЕ используется в URL сайта
 * - Для ссылок на страницу отеля используется hotel_slug (строка)
 * - Любая ссылка ДОЛЖНА содержать: partner_slug, utm_medium=partners, utm_source
 * - Никогда не формировать ссылки вида /rooms/{hid}/
 * 
 * @see https://docs.emergingtravel.com
 */

export type Currency = string; // "RUB" | "USD" | ...
export type Lang = "ru" | "en" | string;

export type RoomGuests = {
  adults: number;        // >= 1
  childrenAges?: number[]; // e.g. [9, 12]
};

export type LinkCommonParams = {
  partnerSlug: string;          // e.g. "270392.affiliate.a0bd"
  currency?: Currency;          // cur
  lang?: Lang;                  // lang
  checkIn?: string;             // YYYY-MM-DD
  checkOut?: string;            // YYYY-MM-DD
  rooms?: RoomGuests[];         // for guests param
  partnerExtra?: string;        // extra attribution (optional)
};

/**
 * Тестовые отели для проверки интеграции
 */
export const TEST_HOTELS = {
  RU: 'test_hotel',                    // Тестовый отель в РФ
  INTERNATIONAL: 'test_hotel_do_not_book', // Международный тестовый отель
} as const;

/**
 * Проверка формата даты ISO (YYYY-MM-DD)
 */
function assertDateIso(d?: string, field = "date") {
  if (!d) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`${field} must be YYYY-MM-DD, got: ${d}`);
  }
}

/**
 * Форматирование дат для Ostrovok
 * Из YYYY-MM-DD в DD.MM.YYYY-DD.MM.YYYY
 */
export function formatDates(checkIn?: string, checkOut?: string): string | undefined {
  if (!checkIn || !checkOut) return undefined;
  assertDateIso(checkIn, "checkIn");
  assertDateIso(checkOut, "checkOut");

  const toDMY = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };

  return `${toDMY(checkIn)}-${toDMY(checkOut)}`;
}

/**
 * Конвертация guests в формат Ostrovok:
 * - 2 adults => "2"
 * - 2 adults + child 9 => "2and9"
 * - 2 adults + children 9,12 => "2and9.12"
 * - Multiple rooms: "2and9.12-2"
 */
export function encodeGuests(rooms?: RoomGuests[]): string | undefined {
  if (!rooms || rooms.length === 0) return undefined;

  const roomStr = rooms.map((r) => {
    const adults = Math.max(1, Math.floor(r.adults || 1));
    const kids = (r.childrenAges || [])
      .map((a) => Math.floor(a))
      .filter((a) => a >= 0 && a <= 17)
      .slice(0, 4); // soft limit

    if (kids.length === 0) return String(adults);
    return `${adults}and${kids.join(".")}`;
  });

  return roomStr.join("-");
}

/**
 * Построение UTM-параметров для партнерской атрибуции.
 * Порядок: utm_medium → partner_slug → utm_source (как на ostrovok.ru после редиректа).
 */
function buildUtm(partnerSlug: string, partnerExtra?: string) {
  return {
    utm_medium: "partners",
    partner_slug: partnerSlug,
    utm_source: partnerSlug,
    ...(partnerExtra ? { partner_extra: partnerExtra } : {}),
  };
}

/**
 * Добавление query params к URL
 */
function withQuery(url: string, params: Record<string, string | undefined>) {
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    u.searchParams.set(k, v);
  });
  return u.toString();
}

/**
 * Проверка что значение похоже на hid (число) а не на slug
 */
export function looksLikeHid(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * ETG/partner API иногда отдаёт гибрид: `/hotel/{slug}/?q={numeric_region_id}&...`
 * На сайте в приоритете path → открывается неверный регион (например `el_salvador` при `q=53` для Парижа).
 * Если в query есть числовой `q`, каноничный URL — только `/hotels/?q=...` с теми же параметрами.
 * Также снимает `&amp;` в строке (двойное экранирование из JSON/HTML).
 */
export function rewriteOstrovokHybridHotelPathToSerp(url: string): string | null {
  const raw = url.trim().replace(/&amp;/gi, "&");
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;
  let pathname: string;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    return null;
  }
  if (!/^\/hotel\/[^/]+/i.test(pathname)) return null;
  if (!/(?:[?&])q=(\d+)(?:&|#|$)/i.test(raw)) return null;
  try {
    const u = new URL(raw);
    const serp = new URL("https://www.ostrovok.ru/hotels/");
    u.searchParams.forEach((v, k) => serp.searchParams.set(k, v));
    return serp.toString();
  } catch {
    return null;
  }
}

/**
 * Канонизирует partner-ссылку вида:
 * - /hotel/{slug}/
 * - /hotel/{country}/{city}/mid{hid}/{slug}/
 * в формат /rooms/{slug}/ с сохранением query-параметров.
 *
 * Если slug не удалось безопасно определить — возвращает null.
 */
export function rewriteOstrovokHotelPathToRooms(url: string): string | null {
  const raw = url.trim().replace(/&amp;/gi, "&");
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (/^\/rooms\/[^/]+/i.test(parsed.pathname)) return raw;
  if (!/^\/hotel\/[^/]+/i.test(parsed.pathname)) return null;

  const parts = parsed.pathname
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== "hotel") return null;

  let slug: string | undefined;
  if (parts.length === 2) {
    // Для /hotel/{single-segment}/?q=... это может быть региональный slug; не конвертируем.
    const q = parsed.searchParams.get("q");
    if (q && /^\d+$/.test(q)) return null;
    slug = parts[1];
  } else {
    for (let i = parts.length - 1; i >= 1; i -= 1) {
      const seg = parts[i];
      if (!seg) continue;
      if (/^mid\d+$/i.test(seg)) continue;
      if (/^(hotel|hotels|rooms)$/i.test(seg)) continue;
      slug = seg;
      break;
    }
  }

  if (!slug || looksLikeHid(slug)) return null;

  const roomsUrl = new URL(`https://www.ostrovok.ru/rooms/${encodeURIComponent(slug)}/`);
  parsed.searchParams.forEach((value, key) => roomsUrl.searchParams.set(key, value));
  return roomsUrl.toString();
}

/**
 * Hotel Page link (HP): требуется hotelSlug (НЕ hid!)
 * Base: https://www.ostrovok.ru/rooms/{hotel_slug}/
 * 
 * @throws Error если hotelSlug похож на hid (число) или отсутствует
 */
export function buildHotelPageLink(hotelSlug: string, p: LinkCommonParams): string {
  if (!hotelSlug || typeof hotelSlug !== "string") {
    throw new Error("hotelSlug is required for HP link");
  }

  // Защита: не использовать hid в URL
  if (looksLikeHid(hotelSlug)) {
    throw new Error(
      `hotelSlug looks like hid (numeric): ${hotelSlug}. ` +
      `Use hotel slug (string), not hid. If only hid is available, use SERP link with regionId.`
    );
  }

  const dates = formatDates(p.checkIn, p.checkOut);
  const guests = encodeGuests(p.rooms);

  return withQuery(`https://www.ostrovok.ru/rooms/${encodeURIComponent(hotelSlug)}/`, {
    ...buildUtm(p.partnerSlug, p.partnerExtra),
    cur: p.currency,
    lang: p.lang,
    dates,
    guests,
  });
}

/**
 * SERP link: требуется regionId
 * Base: https://www.ostrovok.ru/hotels/?q={region_id}
 */
export function buildSerpLink(regionId: number | string, p: LinkCommonParams): string {
  const rid = String(regionId);
  if (!rid || !/^\d+$/.test(rid)) {
    throw new Error(`regionId must be an integer, got: ${regionId}`);
  }

  const dates = formatDates(p.checkIn, p.checkOut);
  const guests = encodeGuests(p.rooms);

  return withQuery(`https://www.ostrovok.ru/hotels/`, {
    q: rid,
    ...buildUtm(p.partnerSlug, p.partnerExtra),
    cur: p.currency,
    lang: p.lang,
    dates,
    guests,
  });
}

/**
 * Автоматический выбор типа ссылки:
 * - если есть hotelSlug => HP (страница отеля)
 * - иначе если есть regionId => SERP (поиск по региону)
 * - иначе throw (нужен suggest/regions)
 * 
 * @throws Error если не предоставлен ни hotelSlug, ни regionId
 */
export function buildBestOstrovokLink(args: {
  hotelSlug?: string | null;
  regionId?: number | string | null;
  params: LinkCommonParams;
}): string {
  const { hotelSlug, regionId, params } = args;
  
  if (hotelSlug && !looksLikeHid(hotelSlug)) {
    return buildHotelPageLink(hotelSlug, params);
  }
  
  if (regionId !== null && regionId !== undefined) {
    return buildSerpLink(regionId, params);
  }
  
  // Если hotelSlug выглядит как hid, предлагаем использовать SERP
  if (hotelSlug && looksLikeHid(hotelSlug)) {
    throw new Error(
      `Cannot build HP link: ${hotelSlug} looks like hid (numeric). ` +
      `Please provide regionId for SERP link or use actual hotel slug.`
    );
  }
  
  throw new Error("Cannot build link: provide hotelSlug (string) or regionId (number)");
}

/**
 * AttributionGuard - валидация финальной ссылки
 * Проверяет что ссылка содержит все необходимые партнерские параметры
 */
export function validateAttribution(url: string): {
  valid: boolean;
  errors: string[];
  isHP: boolean;
  isSERP: boolean;
} {
  const errors: string[] = [];
  
  try {
    const u = new URL(url);
    
    // Проверка UTM-параметров
    if (!u.searchParams.has('partner_slug')) {
      errors.push('Missing partner_slug');
    }
    
    if (u.searchParams.get('utm_medium') !== 'partners') {
      errors.push('Missing or incorrect utm_medium (should be "partners")');
    }
    
    if (!u.searchParams.has('utm_source')) {
      errors.push('Missing utm_source');
    }
    
    // Определение типа ссылки
    const isHP = u.pathname.startsWith('/rooms/');
    const isSERP = u.pathname === '/hotels/' || u.searchParams.has('q');
    
    // Проверка HP: путь должен содержать slug (не число)
    if (isHP) {
      const match = u.pathname.match(/\/rooms\/([^/]+)/);
      if (match) {
        const slug = match[1];
        if (/^\d+$/.test(slug)) {
          errors.push(`HP link uses hid (${slug}) instead of hotel_slug`);
        }
      }
    }
    
    // Проверка SERP: должен быть q параметр
    if (isSERP && !u.searchParams.has('q')) {
      errors.push('SERP link missing q (region_id) parameter');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      isHP,
      isSERP
    };
  } catch (e) {
    return {
      valid: false,
      errors: ['Invalid URL format'],
      isHP: false,
      isSERP: false
    };
  }
}

/**
 * Создание тестовой ссылки (для проверки интеграции)
 */
export function createTestLink(partialParams?: Partial<LinkCommonParams>): string {
  const defaultParams: LinkCommonParams = {
    partnerSlug: '270392.affiliate.a0bd',
    currency: 'RUB',
    lang: 'ru',
    checkIn: '2026-03-01',
    checkOut: '2026-03-03',
    rooms: [{ adults: 2 }],
    ...partialParams
  };
  
  return buildHotelPageLink(TEST_HOTELS.RU, defaultParams);
}
