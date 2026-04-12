import { getPgPool } from './postgres.js';
import { stableRgExtKey } from '../etg/rgExt.js';

export function hasPgConfig(): boolean {
  return Boolean(process.env.PGDATABASE && process.env.PGHOST && process.env.PGUSER);
}

export async function upsertHotelInfo(hid: string, payload: unknown): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO etg_hotel_info(hid, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (hid) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
    [hid, JSON.stringify(payload ?? {})]
  );
}

export async function upsertRoomGroup(row: {
  hid: string;
  rgExt: Record<string, unknown>;
  name?: string;
  roomAmenities?: unknown[];
  images?: unknown[];
}): Promise<void> {
  const key = stableRgExtKey(row.rgExt);
  if (!key) return;
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO etg_room_groups(hid, rg_ext_key, rg_ext, name, room_amenities, images, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb, NOW())
     ON CONFLICT (hid, rg_ext_key) DO UPDATE SET
       rg_ext = EXCLUDED.rg_ext,
       name = EXCLUDED.name,
       room_amenities = EXCLUDED.room_amenities,
       images = EXCLUDED.images,
       updated_at = NOW()`,
    [
      row.hid,
      key,
      JSON.stringify(row.rgExt),
      row.name ?? null,
      JSON.stringify(row.roomAmenities ?? []),
      JSON.stringify(row.images ?? []),
    ]
  );
}

export async function getRoomGroupByRgExt(hid: string, rgExt: Record<string, unknown> | null | undefined) {
  const key = stableRgExtKey(rgExt ?? undefined);
  if (!key) return null;
  const pool = getPgPool();
  const r = await pool.query(
    `SELECT name, room_amenities, images FROM etg_room_groups WHERE hid = $1 AND rg_ext_key = $2`,
    [hid, key]
  );
  return r.rows[0] ?? null;
}
