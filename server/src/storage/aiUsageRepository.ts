import { getPgPool, hasPgConnectionConfig } from './postgres.js';

export type AiUsageSnapshot = {
  dailyTokenLimit: number;
  tokenLimit: number;
  tokensUsed: number;
  remainingTokens: number;
  usedPercent: number;
  remainingPercent: number;
  resetIntervalHours: number;
  windowStartedAt: string;
  resetAt: string;
  resetAtLabel: string;
};

type MemoryUsageRow = {
  windowStartedAt: string;
  tokensUsed: number;
  tokenLimit: number;
};

const AI_USAGE_WINDOW_HOURS = Math.max(1, Math.round(Number(process.env.AI_USAGE_WINDOW_HOURS || 5) || 5));
const AI_USAGE_WINDOW_MS = AI_USAGE_WINDOW_HOURS * 60 * 60 * 1000;
const inMemoryAiUsage = new Map<string, MemoryUsageRow>();

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getResetAt(windowStartedAt: string): Date {
  return new Date(new Date(windowStartedAt).getTime() + AI_USAGE_WINDOW_MS);
}

function formatResetAtLabel(resetAt: Date): string {
  return resetAt.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

function isWindowExpired(windowStartedAt: string, now = new Date()): boolean {
  return getResetAt(windowStartedAt).getTime() <= now.getTime();
}

export function toAiUsageSnapshot(
  tokensUsed: number,
  tokenLimit: number,
  windowStartedAt: string,
): AiUsageSnapshot {
  const safeLimit = Math.max(1000, Math.round(tokenLimit));
  const safeUsed = Math.max(0, Math.round(tokensUsed));
  const remainingTokens = Math.max(0, safeLimit - safeUsed);
  const usedPercent = clampPercent((safeUsed / safeLimit) * 100);
  const resetAt = getResetAt(windowStartedAt);
  return {
    dailyTokenLimit: safeLimit,
    tokenLimit: safeLimit,
    tokensUsed: safeUsed,
    remainingTokens,
    usedPercent,
    remainingPercent: Math.max(0, 100 - usedPercent),
    resetIntervalHours: AI_USAGE_WINDOW_HOURS,
    windowStartedAt,
    resetAt: resetAt.toISOString(),
    resetAtLabel: formatResetAtLabel(resetAt),
  };
}

function getMemoryUsage(subjectKey: string, tokenLimit: number): AiUsageSnapshot {
  const current = inMemoryAiUsage.get(subjectKey);
  if (!current || isWindowExpired(current.windowStartedAt)) {
    const fresh = { windowStartedAt: new Date().toISOString(), tokensUsed: 0, tokenLimit };
    inMemoryAiUsage.set(subjectKey, fresh);
    return toAiUsageSnapshot(0, tokenLimit, fresh.windowStartedAt);
  }
  return toAiUsageSnapshot(current.tokensUsed, current.tokenLimit, current.windowStartedAt);
}

function addMemoryUsage(subjectKey: string, tokens: number, tokenLimit: number): AiUsageSnapshot {
  const current = inMemoryAiUsage.get(subjectKey);
  const active = current && !isWindowExpired(current.windowStartedAt)
    ? current
    : { windowStartedAt: new Date().toISOString(), tokensUsed: 0, tokenLimit };
  const next = {
    windowStartedAt: active.windowStartedAt,
    tokensUsed: active.tokensUsed + Math.max(0, Math.round(tokens)),
    tokenLimit: active.tokenLimit || tokenLimit,
  };
  inMemoryAiUsage.set(subjectKey, next);
  return toAiUsageSnapshot(next.tokensUsed, next.tokenLimit, next.windowStartedAt);
}

async function getActiveDbUsage(subjectKey: string, tokenLimit: number, tokensToAdd = 0): Promise<AiUsageSnapshot> {
  const pool = getPgPool();
  const current = await pool.query(
    `SELECT window_start, token_limit, tokens_used
       FROM ai_token_usage_windows
      WHERE subject_key = $1
      ORDER BY window_start DESC
      LIMIT 1`,
    [subjectKey],
  );
  const row = current.rows[0] as { window_start?: Date | string; token_limit?: number; tokens_used?: number } | undefined;
  const rowWindowStart = row?.window_start ? new Date(row.window_start).toISOString() : '';

  if (!row || !rowWindowStart || isWindowExpired(rowWindowStart)) {
    const inserted = await pool.query(
      `INSERT INTO ai_token_usage_windows (subject_key, window_start, reset_at, token_limit, tokens_used, updated_at)
       VALUES ($1, NOW(), NOW() + ($2::int * INTERVAL '1 hour'), $3, $4, NOW())
       RETURNING window_start, token_limit, tokens_used`,
      [subjectKey, AI_USAGE_WINDOW_HOURS, tokenLimit, Math.max(0, Math.round(tokensToAdd))],
    );
    const insertedRow = inserted.rows[0] as { window_start: Date | string; token_limit: number; tokens_used: number };
    return toAiUsageSnapshot(
      Number(insertedRow.tokens_used ?? 0),
      Number(insertedRow.token_limit ?? tokenLimit),
      new Date(insertedRow.window_start).toISOString(),
    );
  }

  if (tokensToAdd > 0) {
    const updated = await pool.query(
      `UPDATE ai_token_usage_windows
          SET tokens_used = tokens_used + $3,
              token_limit = $4,
              updated_at = NOW()
        WHERE subject_key = $1 AND window_start = $2
        RETURNING window_start, token_limit, tokens_used`,
      [subjectKey, row.window_start, Math.max(0, Math.round(tokensToAdd)), tokenLimit],
    );
    const updatedRow = updated.rows[0] as { window_start: Date | string; token_limit: number; tokens_used: number };
    return toAiUsageSnapshot(
      Number(updatedRow.tokens_used ?? tokensToAdd),
      Number(updatedRow.token_limit ?? tokenLimit),
      new Date(updatedRow.window_start).toISOString(),
    );
  }

  return toAiUsageSnapshot(
    Number(row.tokens_used ?? 0),
    Number(row.token_limit ?? tokenLimit),
    rowWindowStart,
  );
}

export async function getAiUsageSnapshot(
  subjectKey: string,
  tokenLimit: number
): Promise<AiUsageSnapshot> {
  if (!hasPgConnectionConfig()) return getMemoryUsage(subjectKey, tokenLimit);
  try {
    return await getActiveDbUsage(subjectKey, tokenLimit);
  } catch (err) {
    console.error('[ai usage] db read failed, using in-memory:', err instanceof Error ? err.message : err);
    return getMemoryUsage(subjectKey, tokenLimit);
  }
}

export async function addAiUsageTokens(
  subjectKey: string,
  tokens: number,
  tokenLimit: number
): Promise<AiUsageSnapshot> {
  const safeTokens = Math.max(0, Math.round(tokens));
  if (!hasPgConnectionConfig()) return addMemoryUsage(subjectKey, safeTokens, tokenLimit);
  try {
    return await getActiveDbUsage(subjectKey, tokenLimit, safeTokens);
  } catch (err) {
    console.error('[ai usage] db write failed, using in-memory:', err instanceof Error ? err.message : err);
    return addMemoryUsage(subjectKey, safeTokens, tokenLimit);
  }
}
