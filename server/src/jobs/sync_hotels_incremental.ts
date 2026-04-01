import axios from 'axios';
import { ETG_BASE_URL, etgAuthHeaders } from '../config/etg.js';
import { upsertHotelsStatic } from '../storage/etgRepository.js';
import { finishSyncRun, setSyncState, startSyncRun } from '../storage/syncRepository.js';

async function run(): Promise<void> {
  const runId = await startSyncRun('sync_hotels_incremental');
  try {
    const response = await axios.post(
      `${ETG_BASE_URL}/api/b2b/v3/hotel/info/incremental_dump/`,
      { language: 'ru' },
      { headers: etgAuthHeaders(), timeout: 90000 }
    );
    const raw = response.data?.data || response.data?.hotels || response.data || [];
    const hotels = Array.isArray(raw) ? raw : [];
    const mapped = hotels
      .map((h: any) => ({ hotelId: String(h?.id || h?.hid || ''), payload: h }))
      .filter((h: { hotelId: string }) => Boolean(h.hotelId));
    const upsertStats = await upsertHotelsStatic(mapped);
    await setSyncState('hotels_incremental_last_sync', { at: new Date().toISOString(), count: mapped.length });
    await finishSyncRun(runId, 'success', {
      added: upsertStats.added,
      updated: upsertStats.updated,
      deactivated: 0,
    });
    console.log('[sync_hotels_incremental] completed', upsertStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    await finishSyncRun(runId, 'failed', { added: 0, updated: 0, deactivated: 0, error: message });
    console.error('[sync_hotels_incremental] failed', message);
    process.exitCode = 1;
  }
}

void run();
