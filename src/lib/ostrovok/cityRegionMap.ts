/** Числовой region_id Ostrovok для SERP q= (fallback, когда нет slug отеля). */
export const CITY_REGION_MAP: Record<string, number> = {
  москва: 1,
  moscow: 1,
  москве: 1,
  москвы: 1,
  москву: 1,
  'санкт-петербург': 2,
  'saint petersburg': 2,
  питер: 2,
  петербург: 2,
  петербурге: 2,
  париж: 53,
  paris: 53,
  париже: 53,
  парижа: 53,
  парижу: 53,
  лондон: 211,
  london: 211,
  дубай: 1435,
  dubai: 1435,
  стамбул: 876,
  istanbul: 876,
  бангкок: 1990,
  bangkok: 1990,
  барселона: 1189,
  barcelona: 1189,
  рим: 1187,
  rome: 1187,
  прага: 1004,
  prague: 1004,
  амстердам: 1242,
  amsterdam: 1242,
  берлин: 964,
  berlin: 964,
  милан: 1188,
  milan: 1188,
  казань: 1993,
  казани: 1993,
  kazan: 1993,
  вена: 1352,
  vienna: 1352,
  лиссабон: 1461,
  lisbon: 1461,
  токио: 1987,
  tokyo: 1987,
  'нью-йорк': 163,
  'new york': 163,
};

export function getRegionIdForCityName(destination: string): number | undefined {
  let s = destination.trim().toLowerCase();
  if (!s) return undefined;
  s = s.replace(/^(?:в|во|на|по|из|изо|к|ко)\s+/u, '');
  s = s.split(',')[0].trim();
  if (CITY_REGION_MAP[s]) return CITY_REGION_MAP[s];
  for (const part of s.split(/[\s/]+/).filter(Boolean)) {
    if (CITY_REGION_MAP[part]) return CITY_REGION_MAP[part];
  }
  for (const [key, id] of Object.entries(CITY_REGION_MAP)) {
    if (key.length < 4) continue;
    if (s === key) return id;
    if (s.startsWith(key)) {
      const next = s[key.length];
      if (next === undefined || !/[a-zа-яё]/i.test(next)) return id;
    }
  }
  return undefined;
}
