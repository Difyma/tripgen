/**
 * Отдельный job для Content API: POST /api/b2b/v3/hotel/info/
 * Не вызывать из пользовательского поиска — только cron (~ weekly).
 *
 * Env:
 *   ETG_CONTENT_HIDS — список hid через запятую (обязательно хотя бы один для прогона).
 *   OSTROVOK_API_URL, OSTROVOK_KEY_ID, OSTROVOK_API_TOKEN (или legacy OSTROVOK_API_KEY / SECRET)
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { upsertHotelInfo, upsertRoomGroup, hasPgConfig } from '../storage/etgContentRepository.js';
import { startSyncRun, finishSyncRun } from '../storage/syncRepository.js';

dotenv.config({ path: 'server/.env' });
dotenv.config();

const BASE = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
const KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const HIDS = (process.env.ETG_CONTENT_HIDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${KEY_ID}:${TOKEN}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'TripGen/1.0.0; ClientVersion/1.0.0',
  };
}

function extractRoomGroups(payload: any): any[] {
  const data = payload?.data ?? payload;
  const hotel = data?.hotels?.[0] ?? data?.hotel ?? data;
  const rg = hotel?.room_groups ?? data?.room_groups ?? data?.rooms ?? [];
  return Array.isArray(rg) ? rg : [];
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!hasPgConfig()) {
    console.error('[sync_hotel_content] PG* env not set; apply migration 002 and configure database.');
    process.exit(1);
  }
  if (!KEY_ID || !TOKEN) {
    console.error('[sync_hotel_content] Missing OSTROVOK_KEY_ID / OSTROVOK_API_TOKEN');
    process.exit(1);
  }
  if (HIDS.length === 0) {
    console.error('[sync_hotel_content] Set ETG_CONTENT_HIDS=123,456,... (comma-separated numeric hid)');
    process.exit(1);
  }

  const runId = await startSyncRun('sync_hotel_content');
  let hotelsSynced = 0;
  let roomGroupsSynced = 0;
  let errors = 0;

  try {
    for (const hidRaw of HIDS) {
      const hid = hidRaw.replace(/\D/g, '') || hidRaw;
      try {
        const res = await axios.post(
          `${BASE}/api/b2b/v3/hotel/info/`,
          { hid, language: 'ru' },
          { headers: authHeaders(), timeout: 60000 }
        );
        const body = res.data;
        await upsertHotelInfo(String(hid), body);
        hotelsSynced += 1;

        const groups = extractRoomGroups(body);
        for (const g of groups) {
          const rgExt = g?.rg_ext;
          if (!rgExt || typeof rgExt !== 'object') continue;
          await upsertRoomGroup({
            hid: String(hid),
            rgExt: rgExt as Record<string, unknown>,
            name: typeof g?.name === 'string' ? g.name : g?.name_struct?.main_name,
            roomAmenities: Array.isArray(g?.room_amenities) ? g.room_amenities : [],
            images: Array.isArray(g?.images_ext) ? g.images_ext : g?.images || [],
          });
          roomGroupsSynced += 1;
        }
      } catch (e) {
        errors += 1;
        console.error(`[sync_hotel_content] hid=${hid}`, e instanceof Error ? e.message : e);
      }
      // Rate limit: max 30 / 60s — держим запас
      await sleep(2100);
    }

    await finishSyncRun(runId, 'success', {
      added: hotelsSynced,
      updated: roomGroupsSynced,
      deactivated: 0,
      error: errors ? `${errors} hotel(s) failed` : undefined,
    });
    console.log('[sync_hotel_content] done', { hotels: HIDS.length, roomGroupsSynced, errors });
  } catch (e) {
    await finishSyncRun(runId, 'failed', {
      added: 0,
      updated: 0,
      deactivated: 0,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

main().catch(() => process.exit(1));
