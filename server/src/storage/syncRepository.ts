import { getPgPool } from './postgres.js';

export async function startSyncRun(jobName: string): Promise<number> {
  const pool = getPgPool();
  const result = await pool.query(
    'INSERT INTO etg_sync_runs(job_name, status) VALUES ($1, $2) RETURNING id',
    [jobName, 'running']
  );
  return Number(result.rows[0].id);
}

export async function finishSyncRun(
  runId: number,
  status: 'success' | 'failed',
  stats: { added: number; updated: number; deactivated: number; error?: string }
): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE etg_sync_runs
     SET status = $2, finished_at = NOW(), added_count = $3, updated_count = $4, deactivated_count = $5, error_message = $6
     WHERE id = $1`,
    [runId, status, stats.added, stats.updated, stats.deactivated, stats.error || null]
  );
}

export async function getSyncState(key: string): Promise<any | null> {
  const pool = getPgPool();
  const result = await pool.query('SELECT value FROM etg_sync_state WHERE key = $1', [key]);
  return result.rows[0]?.value ?? null;
}

export async function setSyncState(key: string, value: any): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO etg_sync_state(key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}
