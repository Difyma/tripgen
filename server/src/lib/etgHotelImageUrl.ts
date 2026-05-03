/**
 * Серверная нормализация URL превью отелей (см. src/lib/ostrovok/images.ts — держите логику синхронно).
 * @see https://docs.emergingtravel.com/docs/b2b-api/static-content/retrieve-hotel-content/
 */

export type EtgHotelImageNormalizeOptions = {
  cdnWorldotaOriginOverride?: string;
  legacyMode?: "none" | "same-path";
  legacyTargetOrigin?: string;
  imageProxyBase?: string;
};

const LEGACY_OSTROVOK_IMAGE_HOST =
  /^(?:images\.ostrovok\.(?:ru|com)|cdn\.images\.ostrovok\.ru)$/i;

function isLegacyOstrovokImageHost(hostname: string): boolean {
  return LEGACY_OSTROVOK_IMAGE_HOST.test(hostname);
}

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

function etgImageOptionsFromProcessEnv(): EtgHotelImageNormalizeOptions {
  return {
    cdnWorldotaOriginOverride: process.env.ETG_HOTEL_IMAGE_CDN_ORIGIN?.trim() || undefined,
    legacyMode: process.env.ETG_HOTEL_IMAGE_LEGACY_MODE === "same-path" ? "same-path" : "none",
    legacyTargetOrigin: process.env.ETG_HOTEL_IMAGE_LEGACY_TARGET_ORIGIN?.trim() || undefined,
    imageProxyBase: process.env.ETG_HOTEL_IMAGE_PROXY_BASE?.trim() || undefined,
  };
}

/** Для gptProxy / hotels-full / мапперов ETG */
export function normalizeHotelPreviewImageUrlForServer(
  url: string | null | undefined,
  size = "640x400"
): string | undefined {
  return normalizeHotelPreviewImageUrl(url, size, etgImageOptionsFromProcessEnv());
}

export function formatEtgImageUrlForServer(url: string, size = "640x400"): string {
  return normalizeHotelPreviewImageUrlForServer(url, size) ?? url.replace(/\{size\}/g, size);
}
