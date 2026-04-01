import axios from 'axios';
import { ETG_BASE_URL, etgAuthHeaders } from '../config/etg.js';
import { upsertRegions } from '../storage/etgRepository.js';
import { finishSyncRun, setSyncState, startSyncRun } from '../storage/syncRepository.js';

async function run(): Promise<void> {
  const runId = await startSyncRun('sync_regions_full');
  try {
    // ETG docs and current integration use region search endpoint as source for region mapping hints.
    const response = await axios.post(
      `${ETG_BASE_URL}/api/b2b/v3/search/serp/region/`,
      {
        region: 'Москва',
        checkin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkout: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        guests: [{ adults: 1, children: [] }],
        language: 'ru',
        currency: 'RUB',
        residency: 'ru',
      },
      { headers: etgAuthHeaders(), timeout: 30000 }
    );
    const regionsRaw = response.data?.data?.regions || response.data?.regions || [];
    const regions = Array.isArray(regionsRaw) ? regionsRaw : [];
    const mapped = regions
      .map((r: any) => ({ regionId: String(r?.id || r?.region_id || ''), payload: r }))
      .filter((r: { regionId: string }) => Boolean(r.regionId));
    const upsertStats = await upsertRegions(mapped);
    await setSyncState('regions_full_last_sync', { at: new Date().toISOString(), count: mapped.length });
    await finishSyncRun(runId, 'success', {
      added: upsertStats.added,
      updated: upsertStats.updated,
      deactivated: 0,
    });
    console.log('[sync_regions_full] completed', upsertStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    await finishSyncRun(runId, 'failed', { added: 0, updated: 0, deactivated: 0, error: message });
    console.error('[sync_regions_full] failed', message);
    process.exitCode = 1;
  }
}

void run();
