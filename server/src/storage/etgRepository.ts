import { getPgPool } from './postgres.js';

export async function upsertHotelsStatic(items: Array<{ hotelId: string; payload: any }>): Promise<{ added: number; updated: number }> {
  if (items.length === 0) return { added: 0, updated: 0 };
  const pool = getPgPool();
  let added = 0;
  let updated = 0;
  for (const item of items) {
    const result = await pool.query(
      `INSERT INTO etg_hotels_static(hotel_id, payload, is_active, updated_at)
       VALUES ($1, $2, TRUE, NOW())
       ON CONFLICT (hotel_id) DO UPDATE SET payload = EXCLUDED.payload, is_active = TRUE, updated_at = NOW()
       RETURNING xmax = 0 AS inserted`,
      [item.hotelId, item.payload]
    );
    if (result.rows[0]?.inserted) added += 1;
    else updated += 1;
  }
  return { added, updated };
}

export async function deactivateMissingHotels(activeIds: string[]): Promise<number> {
  const pool = getPgPool();
  const result = await pool.query(
    'UPDATE etg_hotels_static SET is_active = FALSE, updated_at = NOW() WHERE NOT (hotel_id = ANY($1::text[])) AND is_active = TRUE',
    [activeIds]
  );
  return result.rowCount || 0;
}

export async function upsertRegions(items: Array<{ regionId: string; payload: any }>): Promise<{ added: number; updated: number }> {
  if (items.length === 0) return { added: 0, updated: 0 };
  const pool = getPgPool();
  let added = 0;
  let updated = 0;
  for (const item of items) {
    const result = await pool.query(
      `INSERT INTO etg_regions(region_id, payload, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (region_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
       RETURNING xmax = 0 AS inserted`,
      [item.regionId, item.payload]
    );
    if (result.rows[0]?.inserted) added += 1;
    else updated += 1;
  }
  return { added, updated };
}
