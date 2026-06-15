import { getPgPool, hasPgConnectionConfig } from './postgres.js';

export type AiUsageSnapshot = {
  dailyTokenLimit: number;
  tokensUsed: number;
  remainingTokens: number;
  usedPercent: number;
  remainingPercent: number;
};

type MemoryUsageRow = {
  day: string;
  tokensUsed: number;
  dailyTokenLimit: number;
};

const inMemoryAiUsage = new Map<string, MemoryUsageRow>();

function getUtcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function toAiUsageSnapshot(tokensUsed: number, dailyTokenLimit: number): AiUsageSnapshot {
  const safeUsed = Math.max(0, Math.round(tokensUsed));
  const remainingTokens = Math.max(0, dailyTokenLimit - safeUsed);
  const usedPercent = clampPercent((safeUsed / dailyTokenLimit) * 100);
  return {
    dailyTokenLimit,
    tokensUsed: safeUsed,
    remainingTokens,
    usedPercent,
    remainingPercent: Math.max(0, 100 - usedPercent),
  };
}

function getMemoryUsage(subjectKey: string, dailyTokenLimit: number): AiUsageSnapshot {
  const today = getUtcDayKey();
  const current = inMemoryAiUsage.get(subjectKey);
  if (!current || current.day !== today) {
    const fresh = { day: today, tokensUsed: 0, dailyTokenLimit };
    inMemoryAiUsage.set(subjectKey, fresh);
    return toAiUsageSnapshot(0, dailyTokenLimit);
  }
  return toAiUsageSnapshot(current.tokensUsed, current.dailyTokenLimit);
}

function addMemoryUsage(subjectKey: string, tokens: number, dailyTokenLimit: number): AiUsageSnapshot {
  const today = getUtcDayKey();
  const current = inMemoryAiUsage.get(subjectKey);
  const baseUsed = current?.day === today ? current.tokensUsed : 0;
  const next = {
    day: today,
    tokensUsed: baseUsed + Math.max(0, Math.round(tokens)),
    dailyTokenLimit: current?.dailyTokenLimit || dailyTokenLimit,
  };
  inMemoryAiUsage.set(subjectKey, next);
  return toAiUsageSnapshot(next.tokensUsed, next.dailyTokenLimit);
}

export async function getAiUsageSnapshot(
  subjectKey: string,
  dailyTokenLimit: number
): Promise<AiUsageSnapshot> {
  if (!hasPgConnectionConfig()) return getMemoryUsage(subjectKey, dailyTokenLimit);
  try {
    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO ai_daily_token_usage (subject_key, usage_date, daily_token_limit, tokens_used, updated_at)
       VALUES ($1, CURRENT_DATE, $2, 0, NOW())
       ON CONFLICT (subject_key, usage_date) DO UPDATE
         SET daily_token_limit = EXCLUDED.daily_token_limit,
             updated_at = ai_daily_token_usage.updated_at
       RETURNING tokens_used, daily_token_limit`,
      [subjectKey, dailyTokenLimit]
    );
    const row = result.rows[0] as { tokens_used?: number; daily_token_limit?: number } | undefined;
    return toAiUsageSnapshot(
      Number(row?.tokens_used ?? 0),
      Number(row?.daily_token_limit ?? dailyTokenLimit)
    );
  } catch (err) {
    console.error('[ai usage] db read failed, using in-memory:', err instanceof Error ? err.message : err);
    return getMemoryUsage(subjectKey, dailyTokenLimit);
  }
}

export async function addAiUsageTokens(
  subjectKey: string,
  tokens: number,
  dailyTokenLimit: number
): Promise<AiUsageSnapshot> {
  const safeTokens = Math.max(0, Math.round(tokens));
  if (!hasPgConnectionConfig()) return addMemoryUsage(subjectKey, safeTokens, dailyTokenLimit);
  try {
    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO ai_daily_token_usage (subject_key, usage_date, daily_token_limit, tokens_used, updated_at)
       VALUES ($1, CURRENT_DATE, $2, $3, NOW())
       ON CONFLICT (subject_key, usage_date) DO UPDATE
         SET tokens_used = ai_daily_token_usage.tokens_used + EXCLUDED.tokens_used,
             daily_token_limit = EXCLUDED.daily_token_limit,
             updated_at = NOW()
       RETURNING tokens_used, daily_token_limit`,
      [subjectKey, dailyTokenLimit, safeTokens]
    );
    const row = result.rows[0] as { tokens_used?: number; daily_token_limit?: number } | undefined;
    return toAiUsageSnapshot(
      Number(row?.tokens_used ?? safeTokens),
      Number(row?.daily_token_limit ?? dailyTokenLimit)
    );
  } catch (err) {
    console.error('[ai usage] db write failed, using in-memory:', err instanceof Error ? err.message : err);
    return addMemoryUsage(subjectKey, safeTokens, dailyTokenLimit);
  }
}

