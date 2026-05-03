/**
 * Нормализация URL превью отелей из ETG B2B / Content API.
 *
 * Актуальный формат в ответах `images_ext`: `https://cdn.worldota.net/t/{size}/content/...`
 * Плейсхолдер `{size}` нужно заменить на размер (например `640x400`, `1024x768`).
 *
 * @see https://docs.emergingtravel.com/docs/b2b-api/static-content/retrieve-hotel-content/
 */

export const DEFAULT_ETG_IMAGE_PREVIEW_SIZE = "640x400" as const;

export type EtgHotelImageNormalizeOptions = {
  /** Подменить origin у URL на `cdn.worldota.net` (зеркало / партнёрский CDN с тем же путём `/t/...`) */
  cdnWorldotaOriginOverride?: string;
  /**
   * Легаси `images.ostrovok.*` — у части клиентов DNS не резолвится.
   * `same-path` — подставить другой origin (часто 404 для путей `/hotel/...`, т.к. на worldota другая схема ключей).
   * Надёжнее: прокси или заново запросить `hotel/info` и взять `images_ext`.
   */
  legacyMode?: "none" | "same-path";
  /** Для legacyMode same-path (по умолчанию https://cdn.worldota.net) */
  legacyTargetOrigin?: string;
  /** Если задан — для легаси-хостов: `${base}${encodeURIComponent(url)}` (ваш worker / backend) */
  imageProxyBase?: string;
};

const LEGACY_OSTROVOK_IMAGE_HOST =
  /^(?:images\.ostrovok\.(?:ru|com)|cdn\.images\.ostrovok\.ru)$/i;

function isLegacyOstrovokImageHost(hostname: string): boolean {
  return LEGACY_OSTROVOK_IMAGE_HOST.test(hostname);
}

/**
 * Подготовка URL картинки отеля для `<img src>` / markdown.
 */
export function normalizeHotelPreviewImageUrl(
  url: string | null | undefined,
  size: string,
  opts: EtgHotelImageNormalizeOptions = {}
): string | undefined {
  if (url == null || String(url).trim() === "") return undefined;
  let out = String(url).replace(/\{size\}/g, size);

  const {
    cdnWorldotaOriginOverride,
    legacyMode = "none",
    legacyTargetOrigin = "https://cdn.worldota.net",
    imageProxyBase,
  } = opts;

  try {
    const u = new URL(out);

    if (isLegacyOstrovokImageHost(u.hostname)) {
      const proxy = imageProxyBase?.trim();
      if (proxy) {
        const base = proxy.replace(/\/?$/, "/");
        return `${base}${encodeURIComponent(out)}`;
      }
      if (legacyMode === "same-path") {
        const t = new URL(legacyTargetOrigin.replace(/\/$/, ""));
        u.protocol = t.protocol;
        u.hostname = t.hostname;
        u.port = t.port;
        return u.toString();
      }
    }

    const override = cdnWorldotaOriginOverride?.trim().replace(/\/$/, "");
    if (override && /(^|\.)worldota\.net$/i.test(u.hostname)) {
      const o = new URL(override);
      u.protocol = o.protocol;
      u.hostname = o.hostname;
      u.port = o.port;
      return u.toString();
    }
  } catch {
    return out;
  }

  return out;
}

/** Опции из Vite env (клиент). */
export function etgHotelImageOptionsFromImportMeta(): EtgHotelImageNormalizeOptions {
  const legacyModeRaw = import.meta.env?.VITE_ETG_HOTEL_IMAGE_LEGACY_MODE as string | undefined;
  return {
    cdnWorldotaOriginOverride:
      (import.meta.env?.VITE_ETG_HOTEL_IMAGE_CDN_ORIGIN as string | undefined) || undefined,
    legacyMode: legacyModeRaw === "same-path" ? "same-path" : "none",
    legacyTargetOrigin:
      (import.meta.env?.VITE_ETG_HOTEL_IMAGE_LEGACY_TARGET_ORIGIN as string | undefined) ||
      undefined,
    imageProxyBase:
      (import.meta.env?.VITE_ETG_HOTEL_IMAGE_PROXY_BASE as string | undefined) || undefined,
  };
}
