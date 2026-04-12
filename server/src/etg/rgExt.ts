/**
 * Stable key for matching search rates with static room_groups (Content API / dump).
 * ETG: full match on all rg_ext keys = same room group.
 */
export function stableRgExtKey(rgExt: Record<string, unknown> | null | undefined): string | null {
  if (!rgExt || typeof rgExt !== 'object') return null;
  const keys = Object.keys(rgExt).sort();
  const normalized: Record<string, unknown> = {};
  for (const k of keys) {
    normalized[k] = rgExt[k];
  }
  return JSON.stringify(normalized);
}

export function rgExtKeysMatch(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): boolean {
  const ka = stableRgExtKey(a);
  const kb = stableRgExtKey(b);
  return Boolean(ka && kb && ka === kb);
}
