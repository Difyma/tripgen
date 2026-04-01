import axios from 'axios';
import { ETG_BASE_URL, etgAuthHeaders } from '../config/etg.js';
import { upsertHotelsStatic, deactivateMissingHotels } from '../storage/etgRepository.js';
import { finishSyncRun, setSyncState, startSyncRun } from '../storage/syncRepository.js';

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

async function run(): Promise<void> {
  const runId = await startSyncRun('sync_hotels_full');
  try {
    const response = await withRetry(() =>
      axios.post(
        `${ETG_BASE_URL}/api/b2b/v3/hotel/info/dump/`,
        { language: 'ru' },
        { headers: etgAuthHeaders(), timeout: 120000 }
      )
    );
    const raw = response.data?.data || response.data?.hotels || response.data || [];
    const hotels = Array.isArray(raw) ? raw : [];
    const mapped = hotels
      .map((h: any) => ({ hotelId: String(h?.id || h?.hid || ''), payload: h }))
      .filter((h: { hotelId: string }) => Boolean(h.hotelId));
    const upsertStats = await upsertHotelsStatic(mapped);
    const deactivated = await deactivateMissingHotels(mapped.map((x: { hotelId: string }) => x.hotelId));
    await setSyncState('hotels_full_last_sync', { at: new Date().toISOString(), count: mapped.length });
    await finishSyncRun(runId, 'success', {
      added: upsertStats.added,
      updated: upsertStats.updated,
      deactivated,
    });
    console.log('[sync_hotels_full] completed', { ...upsertStats, deactivated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    await finishSyncRun(runId, 'failed', { added: 0, updated: 0, deactivated: 0, error: message });
    console.error('[sync_hotels_full] failed', message);
    process.exitCode = 1;
  }
}

void run();
