import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Inlined from ./etgExtractCert to avoid ESM import resolution issues on Vercel
function _firstPt(rate: any) { return rate?.payment_options?.payment_types?.[0]; }
function extractTaxesLine(rate: any): string {
  const pt = _firstPt(rate); const td = pt?.tax_data;
  if (typeof td?.taxes === 'string' && td.taxes.trim()) return td.taxes.trim();
  if (td && typeof td === 'object') {
    const details = td.tax_details ?? td.items;
    if (Array.isArray(details) && details.length > 0) {
      const names: string[] = []; let inc = 0; let notInc = 0;
      for (const t of details) {
        if (!t || typeof t !== 'object') continue;
        const n = String((t as any).name || (t as any).title || (t as any).type || '').trim();
        if (n) names.push(n);
        if ((t as any).included_by_supplier === true) inc += 1;
        if ((t as any).included_by_supplier === false) notInc += 1;
      }
      if (inc > 0 || notInc > 0) {
        const labels = names.slice(0, 2).join(', ');
        const suffix = labels ? ` (${labels}${names.length > 2 ? '…' : ''})` : '';
        if (inc > 0 && notInc > 0) return `Налоги/сборы: включено ${inc}, оплачивается отдельно ${notInc}${suffix}`;
        if (inc > 0) return `Налоги/сборы включены в тариф${suffix}`;
        return `Есть дополнительные налоги/сборы${suffix}`;
      }
      if (names.length > 0) return `Налоги/сборы: ${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`;
      return 'Налоги/сборы присутствуют (детали в тарифе)';
    }
    if (td.tax_amount != null || td.total_taxes != null) {
      const amt = Number(td.tax_amount ?? td.total_taxes);
      const cur = pt?.show_currency_code || pt?.currency_code || rate?.currency || 'RUB';
      if (Number.isFinite(amt) && amt > 0) return `Налоги/сборы: ${amt.toLocaleString('ru-RU')} ${cur}`;
    }
  }
  const show = Number(pt?.show_amount); const net = Number(pt?.amount ?? rate?.amount);
  const cur = pt?.show_currency_code || pt?.currency_code || rate?.currency || 'RUB';
  if (Number.isFinite(show) && Number.isFinite(net) && show > net && show > 0) {
    const extra = show - net;
    if (extra > 0 && extra <= show * 0.3) return `Доп. сборы/налоги к тарифу: ${extra.toLocaleString('ru-RU')} ${cur}`;
  }
  return 'Налоги/сборы уточняются на шаге бронирования';
}
function extractMealLine(rate: any): string {
  const v = rate?.meal_data?.value || rate?.meal_data?.meal_name || rate?.meal || _firstPt(rate)?.meal_data?.value || _firstPt(rate)?.meal;
  if (typeof v === 'string' && v.trim()) {
    const m = v.trim().toLowerCase();
    if (m === 'breakfast') return 'Завтрак';
    if (m === 'lunch') return 'Обед';
    if (m === 'dinner') return 'Ужин';
    if (m === 'half board') return 'Полупансион';
    if (m === 'full board') return 'Полный пансион';
    if (m === 'all inclusive') return 'Все включено';
    if (m === 'no meals' || m === 'without meals' || m === 'nomeal' || m === 'room only') return 'Без питания';
    return v.trim();
  }
  return 'Тип питания не указан в блоке тарифа';
}
function _firstCancel(rate: any) {
  const cp = rate?.cancellation_penalties;
  if (Array.isArray(cp) && cp.length > 0) return cp[0];
  if (cp && typeof cp === 'object' && !Array.isArray(cp)) return cp;
  return undefined;
}
function extractCancellationPolicyLine(rate: any): string {
  const pen = _firstCancel(rate);
  if (!pen) return 'Условия отмены уточняются в тарифе';
  if (pen.free_cancellation_before) {
    try { const d = new Date(pen.free_cancellation_before); if (!Number.isNaN(d.getTime())) return `Бесплатная отмена до ${d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`; } catch { /* ignore */ }
  }
  if (Array.isArray(pen.policies) && pen.policies.length > 0) {
    const p0 = pen.policies[0]; const amt = p0?.amount_show ?? p0?.amount_charge ?? p0?.amount; const cur = rate?.currency || 'RUB';
    if (amt != null && Number(amt) > 0) return `Отмена со штрафом от ${Number(amt).toLocaleString('ru-RU')} ${cur} (по данным API)`;
    return 'Частично/условно возвратный тариф (см. условия бронирования)';
  }
  return 'Условия отмены доступны на шаге бронирования';
}
function extractCancellationDeadlineLine(rate: any): string {
  const pen = _firstCancel(rate);
  if (!pen) return '—';
  if (pen.free_cancellation_before) {
    try { const d = new Date(pen.free_cancellation_before); if (!Number.isNaN(d.getTime())) return d.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }); } catch { /* ignore */ }
    return String(pen.free_cancellation_before);
  }
  if (pen.start_at) return String(pen.start_at);
  if (Array.isArray(pen.policies) && pen.policies[0]?.date_from) return String(pen.policies[0].date_from);
  return '—';
}
function extractCheckInOut(hotel: any): { in: string; out: string } {
  const fmt = (v: unknown) => { if (v == null || v === '') return '—'; if (typeof v === 'string') return v.replace(/:00$/, '').replace(/:00:00$/, ''); return String(v); };
  return { in: fmt(hotel?.check_in_time || hotel?.checkin_time), out: fmt(hotel?.check_out_time || hotel?.checkout_time) };
}

// Catch process-level crashes so they appear in Vercel function logs
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err?.message, err?.stack?.slice(0, 500));
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason instanceof Error ? reason.message : String(reason));
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';
const ETG_BASE_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
const ETG_KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const ETG_API_TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const ETG_ENABLE_TEST_FALLBACK = process.env.ETG_ENABLE_TEST_FALLBACK === 'true';
const CERT_MODE = process.env.CERT_MODE || 'real';
const FORCE_TEST_HOTELS = CERT_MODE === 'test_hotels';
const CERT_TEST_HOTEL_IDS = ['test_hotel', 'test_hotel_do_not_book'] as const;
const parsedEtgTimeout = Number(process.env.ETG_SEARCH_TIMEOUT_MS || 15000);
const ETG_SEARCH_TIMEOUT_MS = Number.isFinite(parsedEtgTimeout)
  ? Math.min(Math.max(parsedEtgTimeout, 1000), 30000)
  : 15000;
const parsedAiDailyTokenLimit = Number(process.env.AI_DAILY_TOKEN_LIMIT || 100000);
const AI_DAILY_TOKEN_LIMIT = Number.isFinite(parsedAiDailyTokenLimit)
  ? Math.max(1000, Math.round(parsedAiDailyTokenLimit))
  : 100000;
const AI_USAGE_WINDOW_HOURS = Math.max(1, Math.round(Number(process.env.AI_USAGE_WINDOW_HOURS || 5) || 5));
const AI_USAGE_WINDOW_MS = AI_USAGE_WINDOW_HOURS * 60 * 60 * 1000;
const AI_MAX_COMPLETION_TOKENS = 1500;
const BUILD_VERSION = 'v1.8.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type SearchTrace = {
  traceId: string;
  timestamp: string;
  rawUserQuery?: string;
  parsedDestination?: string;
  normalizedDestination?: string;
  parsedDates?: { checkIn: string; checkOut: string };
  adults?: number;
  children?: number;
  childrenAges?: number[];
  endpoint?: string;
  selectedEndpoint?: string;
  etgRequestPayload?: unknown;
  etgResponseSummary?: unknown;
  numberOfHotels?: number;
  firstReferralLink?: string;
  durationMs?: number;
  responseStatus?: number;
  responseTimeMs?: number;
  hotelsFound?: number;
  errorReason?: string;
};

const inMemoryTraces: SearchTrace[] = [];
const inMemoryAiUsage = new Map<string, { windowStartedAt: string; tokensUsed: number; tokenLimit: number }>();

const ANON_DAILY_LIMIT = 5;

type AiUsageSnapshot = {
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

function isAiUsageWindowExpired(windowStartedAt: string, now = new Date()): boolean {
  return getResetAt(windowStartedAt).getTime() <= now.getTime();
}

function toAiUsageSnapshot(tokensUsed: number, tokenLimit = AI_DAILY_TOKEN_LIMIT, windowStartedAt = new Date().toISOString()): AiUsageSnapshot {
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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function getAiUsageKey(req: VercelRequest): string {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const payload = decodeJwtPayload(token);
    const subject = typeof payload?.sub === 'string' ? payload.sub : '';
    if (subject) return `user:${subject}`;
  }
  return `anon:${getClientIp(req)}`;
}

function getAiUsage(key: string): AiUsageSnapshot {
  const current = inMemoryAiUsage.get(key);
  if (!current || isAiUsageWindowExpired(current.windowStartedAt)) {
    const fresh = { windowStartedAt: new Date().toISOString(), tokensUsed: 0, tokenLimit: AI_DAILY_TOKEN_LIMIT };
    inMemoryAiUsage.set(key, fresh);
    return toAiUsageSnapshot(0, fresh.tokenLimit, fresh.windowStartedAt);
  }
  return toAiUsageSnapshot(current.tokensUsed, current.tokenLimit, current.windowStartedAt);
}

function addAiUsage(key: string, tokens: number): AiUsageSnapshot {
  const current = inMemoryAiUsage.get(key);
  const active = current && !isAiUsageWindowExpired(current.windowStartedAt)
    ? current
    : { windowStartedAt: new Date().toISOString(), tokensUsed: 0, tokenLimit: AI_DAILY_TOKEN_LIMIT };
  const next = {
    windowStartedAt: active.windowStartedAt,
    tokensUsed: Math.max(0, active.tokensUsed + Math.max(0, Math.round(tokens))),
    tokenLimit: active.tokenLimit || AI_DAILY_TOKEN_LIMIT,
  };
  inMemoryAiUsage.set(key, next);
  return toAiUsageSnapshot(next.tokensUsed, next.tokenLimit, next.windowStartedAt);
}

async function getActiveDbAiUsage(key: string, tokensToAdd = 0): Promise<AiUsageSnapshot> {
  const pool = await getPgPool();
  const current = await pool.query(
    `SELECT window_start, token_limit, tokens_used
       FROM ai_token_usage_windows
      WHERE subject_key = $1
      ORDER BY window_start DESC
      LIMIT 1`,
    [key]
  );
  const row = current.rows[0] as { window_start?: Date | string; token_limit?: number; tokens_used?: number } | undefined;
  const rowWindowStart = row?.window_start ? new Date(row.window_start).toISOString() : '';

  if (!row || !rowWindowStart || isAiUsageWindowExpired(rowWindowStart)) {
    const inserted = await pool.query(
      `INSERT INTO ai_token_usage_windows (subject_key, window_start, reset_at, token_limit, tokens_used, updated_at)
       VALUES ($1, NOW(), NOW() + ($2::int * INTERVAL '1 hour'), $3, $4, NOW())
       RETURNING window_start, token_limit, tokens_used`,
      [key, AI_USAGE_WINDOW_HOURS, AI_DAILY_TOKEN_LIMIT, Math.max(0, Math.round(tokensToAdd))]
    );
    const insertedRow = inserted.rows[0] as { window_start: Date | string; token_limit: number; tokens_used: number };
    return toAiUsageSnapshot(
      Number(insertedRow.tokens_used ?? 0),
      Number(insertedRow.token_limit ?? AI_DAILY_TOKEN_LIMIT),
      new Date(insertedRow.window_start).toISOString()
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
      [key, row.window_start, Math.max(0, Math.round(tokensToAdd)), AI_DAILY_TOKEN_LIMIT]
    );
    const updatedRow = updated.rows[0] as { window_start: Date | string; token_limit: number; tokens_used: number };
    return toAiUsageSnapshot(
      Number(updatedRow.tokens_used ?? tokensToAdd),
      Number(updatedRow.token_limit ?? AI_DAILY_TOKEN_LIMIT),
      new Date(updatedRow.window_start).toISOString()
    );
  }

  return toAiUsageSnapshot(
    Number(row.tokens_used ?? 0),
    Number(row.token_limit ?? AI_DAILY_TOKEN_LIMIT),
    rowWindowStart
  );
}

async function getAiUsageSnapshot(key: string): Promise<AiUsageSnapshot> {
  if (!hasDatabaseConfig()) return getAiUsage(key);
  try {
    return await getActiveDbAiUsage(key);
  } catch (err) {
    console.error('[ai usage] db read failed, using in-memory:', err instanceof Error ? err.message : err);
    return getAiUsage(key);
  }
}

async function addAiUsageTokens(key: string, tokens: number): Promise<AiUsageSnapshot> {
  const safeTokens = Math.max(0, Math.round(tokens));
  if (!hasDatabaseConfig()) return addAiUsage(key, safeTokens);
  try {
    return await getActiveDbAiUsage(key, safeTokens);
  } catch (err) {
    console.error('[ai usage] db write failed, using in-memory:', err instanceof Error ? err.message : err);
    return addAiUsage(key, safeTokens);
  }
}

function estimateTokensFromText(text: string): number {
  const clean = String(text || '').trim();
  if (!clean) return 0;
  return Math.ceil(clean.length / 4);
}

function estimateMessagesTokens(messages: Array<{ role?: string; content?: string }>): number {
  return messages.reduce((sum, msg) => sum + 4 + estimateTokensFromText(msg.role || '') + estimateTokensFromText(msg.content || ''), 0);
}

function getOpenRouterTotalTokens(response: OpenRouterCompletionResponse, fallback: number): number {
  const usage = response.usage;
  const total = Number(usage?.total_tokens);
  if (Number.isFinite(total) && total > 0) return Math.round(total);
  const prompt = Number(usage?.prompt_tokens);
  const completion = Number(usage?.completion_tokens);
  if (Number.isFinite(prompt) || Number.isFinite(completion)) {
    return Math.max(0, Math.round((Number.isFinite(prompt) ? prompt : 0) + (Number.isFinite(completion) ? completion : 0)));
  }
  return Math.max(0, Math.round(fallback));
}

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0].split(',')[0].trim();
  return 'unknown';
}

function isAuthenticatedRequest(req: VercelRequest): boolean {
  const auth = req.headers['authorization'];
  return typeof auth === 'string' && auth.startsWith('Bearer ') && auth.length > 50;
}

async function checkAndIncrementRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!hasDatabaseConfig()) return { allowed: true, remaining: ANON_DAILY_LIMIT };
  try {
    const pool = await getPgPool();
    const result = await pool.query(
      `INSERT INTO anonymous_rate_limits (ip, request_count, window_date)
       VALUES ($1, 1, CURRENT_DATE)
       ON CONFLICT (ip) DO UPDATE
         SET request_count = CASE
               WHEN anonymous_rate_limits.window_date < CURRENT_DATE THEN 1
               ELSE anonymous_rate_limits.request_count + 1
             END,
             window_date = CURRENT_DATE
       RETURNING request_count`,
      [ip]
    );
    const count = Number((result.rows[0] as { request_count?: number } | undefined)?.request_count ?? 1);
    return { allowed: count <= ANON_DAILY_LIMIT, remaining: Math.max(0, ANON_DAILY_LIMIT - count) };
  } catch (err) {
    console.error('[rate limit] db error, allowing request:', err instanceof Error ? err.message : err);
    return { allowed: true, remaining: ANON_DAILY_LIMIT };
  }
}

function hasEtgCredentials(): boolean {
  return Boolean(ETG_KEY_ID && ETG_API_TOKEN);
}

function hasPgConfig(): boolean {
  // pg enrichment is opt-in: set ENABLE_ROOM_ENRICHMENT=true in Vercel env vars to activate.
  // Default OFF to prevent pg pool crashes in serverless environment.
  if (process.env.ENABLE_ROOM_ENRICHMENT !== 'true') return false;
  return hasDatabaseConfig();
}

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.PGDATABASE && process.env.PGHOST && process.env.PGUSER)
  );
}

let pgPool: any = null;

async function getPgPool(): Promise<any> {
  if (pgPool) return pgPool;
  const { Pool } = await import('pg');
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
        max: 2,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
      };
  pgPool = new Pool(config);
  // CRITICAL: without this handler, a failed connection crashes the Node.js process
  // (Node.js throws unhandled 'error' events as uncaught exceptions → FUNCTION_INVOCATION_FAILED).
  pgPool.on('error', (err: Error) => {
    console.error('[pg pool] background connection error (non-fatal):', err.message);
    pgPool = null;
  });
  return pgPool;
}

function etgAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${ETG_KEY_ID}:${ETG_API_TOKEN}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PartnerName/ai-travel; ClientVersion/1.0.0',
  };
}

function createTraceId(): string {
  return `etg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function logSearchStep(level: 'info' | 'warn' | 'error', traceId: string, step: string, payload?: unknown): void {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger(`[search] ${traceId} ${step}`, payload ?? '');
}
function upsertTrace(trace: Partial<SearchTrace> & { traceId: string }): void {
  const idx = inMemoryTraces.findIndex((t) => t.traceId === trace.traceId);
  if (idx === -1) {
    inMemoryTraces.push({
      timestamp: new Date().toISOString(),
      ...trace,
    });
  } else {
    inMemoryTraces[idx] = { ...inMemoryTraces[idx], ...trace };
  }
  if (inMemoryTraces.length > 200) inMemoryTraces.splice(0, inMemoryTraces.length - 200);
}

function listRecentTraces(limit = 20): SearchTrace[] {
  return [...inMemoryTraces].slice(-limit).reverse();
}

function normalizeDestination(input: string): { regionHint: string; latitude?: number; longitude?: number; radiusKm?: number } {
  const normalized = (input || '').trim().toLowerCase();
  const coords: Record<string, { lat: number; lng: number; radius: number }> = {
    москва: { lat: 55.7558, lng: 37.6173, radius: 15 },
    moscow: { lat: 55.7558, lng: 37.6173, radius: 15 },
    'санкт-петербург': { lat: 59.9311, lng: 30.3609, radius: 15 },
    'saint petersburg': { lat: 59.9311, lng: 30.3609, radius: 15 },
    питер: { lat: 59.9311, lng: 30.3609, radius: 15 },
    париж: { lat: 48.8566, lng: 2.3522, radius: 12 },
    paris: { lat: 48.8566, lng: 2.3522, radius: 12 },
    дубай: { lat: 25.2048, lng: 55.2708, radius: 20 },
    dubai: { lat: 25.2048, lng: 55.2708, radius: 20 },
  };
  const c = coords[normalized];
  return { regionHint: input || 'Москва', latitude: c?.lat, longitude: c?.lng, radiusKm: c?.radius };
}

function resolveSearchEndpoint(input: { hasCoordinates?: boolean; regionResultCount?: number }) {
  if ((input.regionResultCount ?? 1) === 0 && input.hasCoordinates) {
    return { endpoint: '/api/b2b/v3/search/serp/geo/', reason: 'region_empty_geo_fallback' as const };
  }
  return { endpoint: '/api/b2b/v3/search/serp/region/', reason: 'primary_region_search' as const };
}

function toDMY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function parseDurationDays(text: string): number | null {
  if (!text) return null;
  const m = text
    .toLowerCase()
    .match(/(?:^|\s)(\d{1,2})\s*(?:дн(?:я|ей)?|дня|дней|д\.?|day|days)(?:\s|$)/i);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n <= 30 ? n : null;
}

function isDurationOnlyMessage(text: string): boolean {
  if (!text) return false;
  return /^\s*\d{1,2}\s*(?:дн(?:я|ей)?|дня|дней|д\.?|day|days)\s*$/i.test(text);
}

function resolveCertificationHotelIds(input: string): readonly string[] | null {
  const text = String(input || '').toLowerCase();
  if (!text) return null;

  const ids = new Set<string>();
  const hasGenericTestIntent =
    /test[_\s-]?hotel/.test(text) ||
    /тестов\w*\s+отел/.test(text) ||
    /сертификац\w*\s+отел/.test(text) ||
    /do\s*not\s*book/.test(text);

  if (hasGenericTestIntent) {
    ids.add('test_hotel');
    ids.add('test_hotel_do_not_book');
  }
  if (/test[_\s-]?hotel[_\s-]?do[_\s-]?not[_\s-]?book/.test(text) || /do\s*not\s*book/.test(text)) {
    ids.add('test_hotel_do_not_book');
  }
  if (/(?:hid|хид|hotel\s*id|id)\s*[:#№-]?\s*1\b/.test(text)) ids.add('test_hotel');
  if (/(?:hid|хид|hotel\s*id|id)\s*[:#№-]?\s*2\b/.test(text)) ids.add('test_hotel_do_not_book');

  if (ids.size === 0) return null;
  return CERT_TEST_HOTEL_IDS.filter((id) => ids.has(id));
}

function parseIsoDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function diffDaysUtc(start: Date, end: Date): number {
  const diff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
}

function rewriteOstrovokHybridHotelPathToSerp(url: string): string | null {
  const raw = String(url || '').trim().replace(/&amp;/gi, '&');
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;
  let pathname = '';
  try {
    pathname = new URL(raw).pathname;
  } catch {
  return null;
}

  if (!/^\/hotel\/[^/]+/i.test(pathname)) return null;
  if (!/(?:[?&])q=(\d+)(?:&|#|$)/i.test(raw)) return null;
  try {
    const u = new URL(raw);
    const serp = new URL('https://www.ostrovok.ru/hotels/');
    u.searchParams.forEach((v, k) => serp.searchParams.set(k, v));
    return serp.toString();
  } catch {
    return null;
  }
}

function stripContextUpdateBlock(text: string): string {
  return String(text || '').replace(/<context_update>\s*[\s\S]*?\s*<\/context_update>/i, '').trim();
}

function extractJsonObject(text: string): string | null {
  const clean = stripContextUpdateBlock(text);
  if (!clean) return null;
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;
  return clean.slice(firstBrace, lastBrace + 1);
}

function rewriteOstrovokHotelPathToRooms(url: string): string | null {
  const raw = String(url || '').trim().replace(/&amp;/gi, '&');
  if (!raw || !/ostrovok\.ru/i.test(raw)) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (/^\/rooms\/[^/]+/i.test(parsed.pathname)) return raw;
  if (!/^\/hotel\/[^/]+/i.test(parsed.pathname)) return null;

  const parts = parsed.pathname
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'hotel') return null;

  let slug = '';
  if (parts.length === 2) {
    const q = parsed.searchParams.get('q');
    if (q && /^\d+$/.test(q)) return null;
    slug = parts[1] || '';
  } else {
    for (let i = parts.length - 1; i >= 1; i -= 1) {
      const seg = parts[i];
      if (!seg) continue;
      if (/^mid\d+$/i.test(seg)) continue;
      if (/^(hotel|hotels|rooms)$/i.test(seg)) continue;
      slug = seg;
      break;
    }
  }

  if (!slug || /^\d+$/.test(slug)) return null;
  const rooms = new URL(`https://www.ostrovok.ru/rooms/${encodeURIComponent(slug)}/`);
  parsed.searchParams.forEach((v, k) => rooms.searchParams.set(k, v));
  return rooms.toString();
}

// Маппинг популярных городов на region_id Ostrovok
const CITY_REGION_MAP: Record<string, number> = {
  // В текущем ETG-окружении нужны валидные region_id из доступного набора ключа.
  'москва': 2395, 'moscow': 2395,
  'париж': 2734, 'paris': 2734,
  'казань': 1993, 'kazan': 1993, 'казани': 1993,
  'дубай': 6053839, 'dubai': 6053839,
  'лос-анджелес': 2011, 'los angeles': 2011, 'pasadena': 2011,
};

function getRegionIdByCity(destination?: string): number | null {
  if (!destination) return null;
  const normalized = destination.toLowerCase().trim();
  return CITY_REGION_MAP[normalized] || null;
}

function stableRgExtKey(rgExt: Record<string, unknown> | null | undefined): string | null {
  if (!rgExt || typeof rgExt !== 'object') return null;
  const keys = Object.keys(rgExt).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) normalized[key] = rgExt[key];
  return JSON.stringify(normalized);
}

type RoomGroupStaticRow = {
  name: string | null;
  room_amenities: unknown;
  images: unknown;
};

async function getRoomGroupByRgExt(hid: string, rgExt: Record<string, unknown> | null | undefined): Promise<RoomGroupStaticRow | null> {
  const key = stableRgExtKey(rgExt);
  if (!key || !hasPgConfig()) return null;
  const pool = await getPgPool();
  const result = await pool.query(
    `SELECT name, room_amenities, images
       FROM etg_room_groups
      WHERE hid = $1 AND rg_ext_key = $2
      LIMIT 1`,
    [hid, key]
  );
  return result.rows[0] ?? null;
}

function buildTextSearchFallbackLink(checkIn: string, checkOut: string, adults: number, destination?: string): string {
  const u = new URL('https://www.ostrovok.ru/hotels/');
  // Если известен город, используем его region_id для поиска
  const regionId = getRegionIdByCity(destination);
  if (regionId) {
    u.searchParams.set('q', String(regionId));
  }
  // IMPORTANT: text q (e.g. "Париж") can produce 404 on Ostrovok partner SERP.
  // Keep fallback generic when numeric region_id is unavailable.
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(adults));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

function buildHotelPageFallbackLink(hotelSlug: string, checkIn: string, checkOut: string, adults: number): string {
  const u = new URL(`https://www.ostrovok.ru/rooms/${encodeURIComponent(hotelSlug)}/`);
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(adults));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

function buildSerpFallbackLink(
  checkIn: string,
  checkOut: string,
  adults: number,
  destination?: string,
  regionId?: unknown
): string {
  const u = new URL('https://www.ostrovok.ru/hotels/');
  const rid = typeof regionId === 'number' || (typeof regionId === 'string' && /^\d+$/.test(regionId))
    ? String(regionId)
    : '';
  if (rid) u.searchParams.set('q', rid);
  else return buildTextSearchFallbackLink(checkIn, checkOut, adults, destination);
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(adults));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

async function searchSerpRegion(regionId: number, params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response: any = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/region/`,
    {
      region_id: regionId,
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: ETG_SEARCH_TIMEOUT_MS }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

async function searchSerpGeo(latitude: number, longitude: number, radiusKm: number, params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response: any = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/geo/`,
    {
      latitude,
      longitude,
      radius: radiusKm,
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: ETG_SEARCH_TIMEOUT_MS }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

async function searchSerpHotels(ids: readonly string[], params: { checkIn: string; checkOut: string; adults: number; childrenAges: number[] }) {
  const response: any = await axios.post(
    `${ETG_BASE_URL}/api/b2b/v3/search/serp/hotels/`,
    {
      ids: [...ids],
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: [{ adults: params.adults, children: params.childrenAges }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    { headers: etgAuthHeaders(), timeout: ETG_SEARCH_TIMEOUT_MS }
  );
  return response.data?.data?.hotels || response.data?.hotels || [];
}

// Inline the JSON-system-prompt to avoid Vercel runtime module resolution issues
// (ERR_MODULE_NOT_FOUND for ../src/prompts/travelJsonSystemPrompt).
const TRAVEL_JSON_SYSTEM_PROMPT = `Ты — персональный travel-эксперт сервиса TripGen. Составляешь персонализированные маршруты в структурированном JSON для пользователей из России и СНГ.

Сначала определи намерение пользователя, но не называй его вслух:
- SMALL_TALK: приветствие или вопрос о возможностях.
- DREAM: размытое желание без деталей.
- INFO_REQUEST: вопрос о месте, стране, визах, погоде.
- TRIP_PLANNING: запрос на маршрут, отели или план поездки.
- OFF_TOPIC: не про путешествия.

Правила поведения:
- Если данных не хватает, не выдумывай финальный маршрут. Дай полезное краткое резюме в tripSummary, оставь itinerary пустым и задай один вопрос в followUpQuestion.
- Для финального маршрута желательно знать направление, даты или длительность, бюджет и состав группы. Если часть данных уже есть в контексте, не спрашивай повторно.
- В tripSummary для финального маршрута начни с: "Исходя из того, что вы рассказали: ...".
- Маршрут должен быть реалистичным: реальные места, адреса/районы, сезонность, логистика и время в дороге.
- Для зарубежных поездок учитывай визы и особенности перелетов из России; если данные о рейсах могут быть устаревшими, честно скажи об этом в practicalTips.
- В itinerary каждый день должен отличаться по содержанию. Не повторяй одинаковые блоки утро/день/вечер.
- В itinerary указывай конкретные места, рестораны, музеи, районы и практические советы, а не абстрактные "музей" или "парк".
- Каждый пункт в morning/daytime/evening должен начинаться с времени или диапазона времени в формате "09:00-10:30 — ...".
- Для мест и заведений пиши название так, чтобы система могла сделать ссылку Google Maps.
- Если в контексте есть блок "Проверенные места и заведения", используй его как основной источник для placeRecommendations и itinerary.
- В placeRecommendations объясняй, почему место подходит именно этому пользователю: интересы, бюджет, состав группы, темп поездки, район отеля.

Правила отелей Ostrovok:
- Используй ТОЛЬКО отели из переданного списка.
- bookingUrl, photoUrl, цены, рейтинг, адрес, налоги, питание, отмену и комнаты бери только из API-контекста.
- Не генерируй ссылки на отели самостоятельно.
- Если отелей в контексте нет, hotelRecommendations должен быть пустым массивом.

КРИТИЧНО — формат ответа:
Верни ТОЛЬКО один валидный JSON-объект. Нельзя markdown, текст до/после JSON, code fence или комментарии.

Обязательная структура JSON:
{
  "tripSummary": "string",
  "assumptions": ["string"],
  "recommendedAreas": [
    { "name": "string", "reason": "string" }
  ],
  "hotelRecommendations": [
    {
      "name": "string",
      "whyThisHotel": "string",
      "bookingUrl": "string",
      "photoUrl": "string",
      "price": "string",
      "stars": "string",
      "rating": "string",
      "address": "string",
      "distanceToCenter": "string",
      "description": "string"
    }
  ],
  "placeRecommendations": [
    {
      "name": "string",
      "type": "restaurant | cafe | museum | attraction | park | viewpoint | shopping | nightlife",
      "area": "string",
      "whyMatchesUser": "string",
      "bestTimeToVisit": "string",
      "priceLevel": "string",
      "duration": "string",
      "mapUrl": "string",
      "source": "context | model_knowledge"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "morning": ["string"],
      "daytime": ["string"],
      "evening": ["string"]
    }
  ],
  "highlights": ["string"],
  "foodRecommendations": ["string"],
  "practicalTips": ["string"],
  "followUpQuestion": "string",
  "context_update": {
    "intent": "SMALL_TALK | DREAM | INFO_REQUEST | TRIP_PLANNING | OFF_TOPIC",
    "destination": "string",
    "dates": "string",
    "budget": "string",
    "group": "string",
    "interests": ["string"],
    "restrictions": ["string"],
    "citizenship": "string",
    "missing": ["string"]
  }
}` as const;

const SYSTEM_PROMPT = `Ты — персональный travel-эксперт сервиса TripGen. Помогаешь планировать путешествия по всему миру для пользователей из России и СНГ.

РАСПОЗНАВАНИЕ НАМЕРЕНИЙ:
Перед ответом определи тип сообщения пользователя:

SMALL_TALK — приветствие, вопрос "что умеешь", "как дела"
→ Отвечай тепло и коротко, в конце мягко предложи помочь с поездкой.

DREAM — размытое желание без деталей: "хочу на море", "устал, хочу уехать"
→ Подхвати эмоцию, предложи 2-3 направления, задай один вопрос.

INFO_REQUEST — вопрос о месте, стране, визах, погоде
→ Ответь на вопрос, потом мягко верни к планированию поездки.

TRIP_PLANNING — явный запрос на маршрут с деталями или без
→ Собирай недостающие данные по одному вопросу за раз.

OFF_TOPIC — вопросы не про путешествия вообще
→ Вежливо объясни свою специализацию и предложи вернуться к теме.

НИКОГДА не называй тип намерения вслух — просто реагируй соответственно.

СТИЛЬ ОБЩЕНИЯ:
- Веди диалог как опытный друг-путешественник, а не как справочник.
- Если данных не хватает — предложи 2-3 варианта на выбор и задай один уточняющий вопрос в конце сообщения.
- Задавай ТОЛЬКО ОДИН вопрос за раз.
- После получения ответа — подтверди выбор и двигайся дальше.
- Не составляй финальный маршрут, пока не знаешь минимум: направление, даты или длительность, бюджет, состав группы.

ПАМЯТЬ КОНТЕКСТА:
- Учитывай всё, что пользователь сказал в этом чате.
- Если он уже называл город, даты, бюджет или состав группы — не спрашивай повторно.
- Если он сменил предпочтение — обнови понимание и учти это.
- В начале финального маршрута напиши: "Исходя из того, что вы рассказали: ..."

ПРАВИЛА МАРШРУТОВ:
- Только реально существующие места с конкретными адресами или районами.
- Учитывай сезонность и реалистичную логистику между точками.
- Для зарубежных поездок предупреждай о визах и особенностях перелётов из России; если данные о рейсах могут быть устаревшими — честно скажи и предложи проверить на Aviasales.
- Бюджет расписывай с разбивкой по категориям, если пользователь просит финальный маршрут.

ПРАВИЛА ОТЕЛЕЙ OSTROVOK:
- Используй ТОЛЬКО отели из переданного списка.
- bookingUrl, фото, цены, рейтинг, налоги, питание, отмену и комнаты бери только из API-контекста.
- Не генерируй ссылки на отели самостоятельно.
- Если bookingUrl отсутствует — не показывай кнопку бронирования.

ПРАВИЛА ССЫЛОК НА МЕСТА:
- Для ключевых достопримечательностей, музеев, парков и ресторанов можно давать ссылку Google Maps.
- Формат: [Название места](https://www.google.com/maps/search/?api=1&query=НАЗВАНИЕ+МЕСТА+ГОРОД).
- Не перегружай ответ: 2-4 ссылки на день достаточно.
- Если в контексте есть блок "Проверенные места и заведения", в первую очередь используй эти места и объясняй, почему они подходят под интересы, бюджет и состав группы.

В конце КАЖДОГО текстового ответа добавляй скрытый блок, который система вырежет перед показом пользователю:
<context_update>
{
  "intent": "SMALL_TALK | DREAM | INFO_REQUEST | TRIP_PLANNING | OFF_TOPIC",
  "destination": "",
  "dates": "",
  "budget": "",
  "group": "",
  "interests": [],
  "restrictions": [],
  "citizenship": "RU",
  "missing": []
}
</context_update>

ЯЗЫК: всегда русский.`

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterCompletionResponse {
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface HotelForApi {
  id: string;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  price: number;
  currency: string;
  images?: { category: string; url: string }[];
  bookingUrl?: string;
  distanceToCenter?: number;
  taxesAndFees?: string;
  mealType?: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  checkInTime?: string;
  checkOutTime?: string;
  metapolicyHighlights?: string[];
  roomName?: string;
  roomAmenities?: string[];
  amenities?: string[];
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x)).filter(Boolean);
}

function toImageArray(input: unknown): Array<{ category: string; url: string }> {
  if (!Array.isArray(input)) return [];
  return input
    .map((img) => {
      if (typeof img === 'string') {
        return { category: 'room', url: img };
      }
      if (!img || typeof img !== 'object') return null;
      const url = typeof (img as any).url === 'string' ? (img as any).url : '';
      if (!url) return null;
      const category =
        typeof (img as any).category === 'string' && (img as any).category.trim()
          ? (img as any).category.trim()
          : 'room';
      return { category, url };
    })
    .filter((x): x is { category: string; url: string } => Boolean(x));
}

function buildTestHotelUrl(checkIn: string, checkOut: string, guests: number): string {
  const u = new URL('https://www.ostrovok.ru/rooms/test_hotel/');
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(guests));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

function getCertificationTestHotels(destination: string, checkIn: string, checkOut: string, guests: number): HotelForApi[] {
  const bookingUrl = buildTestHotelUrl(checkIn, checkOut, guests);
  return [
    {
      id: 'test_hotel',
      name: `Test Hotel (${destination})`,
      stars: 4,
      rating: 8.1,
      address: `${destination}, test address`,
      price: 5000,
      currency: 'RUB',
      bookingUrl,
      images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop' }],
      mealType: 'Режим CERT_MODE=test_hotels: для проверки полей сертификации включите CERT_MODE=real и live SERP.',
      cancellationPolicy: 'Режим CERT_MODE=test_hotels: нет live cancellation_penalties.',
      cancellationDeadline: '—',
      checkInTime: '—',
      checkOutTime: '—',
      taxesAndFees: 'Режим CERT_MODE=test_hotels: нет live tax_data.',
    },
  ];
}

function humanizeHotelId(value: string): string {
  const cleaned = String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function mapEtgHotelToApi(
  hotel: any,
  checkIn: string,
  checkOut: string,
  adults: number,
  destination?: string,
  fallbackRegionId?: number | string
): HotelForApi {
  const rawId = String(hotel?.id || hotel?.hid || '').trim();
  const fallbackName =
    rawId === 'test_hotel'
      ? 'Test Hotel'
      : rawId === 'test_hotel_do_not_book'
      ? 'Test Hotel Do Not Book'
      : rawId
      ? humanizeHotelId(rawId)
      : 'Hotel';
  const fallbackAddress = rawId.startsWith('test_hotel') ? 'Test Address' : '';
  const rate = hotel?.rates?.[0];
  const startDate = parseIsoDate(checkIn);
  const endDate = parseIsoDate(checkOut);
  const nights = startDate && endDate ? diffDaysUtc(startDate, endDate) : 1;
  const dailyPrices = Array.isArray(rate?.daily_prices)
    ? (rate.daily_prices as unknown[])
        .map((p) => Number(p))
        .filter((p) => Number.isFinite(p) && p > 0)
    : [];
  const rawAmount = Number(
    rate?.payment_options?.payment_types?.[0]?.show_amount ?? rate?.amount ?? hotel?.min_price ?? 0
  );
  const amount =
    dailyPrices.length > 0
      ? Math.min(...dailyPrices)
      : Number.isFinite(rawAmount) && rawAmount > 0
      ? (nights > 1 ? rawAmount / nights : rawAmount)
      : 0;
  const bookingUrl =
    typeof rate?.payment_options?.payment_types?.[0]?.link === 'string'
      ? rewriteOstrovokHotelPathToRooms(rate.payment_options.payment_types[0].link) ||
        rewriteOstrovokHybridHotelPathToSerp(rate.payment_options.payment_types[0].link) ||
        rate.payment_options.payment_types[0].link
      : rawId && !/^\d+$/.test(rawId)
      ? buildHotelPageFallbackLink(rawId, checkIn, checkOut, adults)
      : buildSerpFallbackLink(
          checkIn,
          checkOut,
          adults,
          destination,
          hotel?.region?.id ?? hotel?.region_id ?? fallbackRegionId
        );

  const cinout = extractCheckInOut(hotel);

  return {
    id: rawId,
    name: hotel?.name || fallbackName,
    stars: Number(hotel?.stars || 0),
    rating: typeof hotel?.rating === 'number' ? hotel.rating : undefined,
    address: hotel?.address || fallbackAddress,
    price: Number.isFinite(amount) ? amount : 0,
    currency: rate?.payment_options?.show_currency_code || hotel?.currency || 'RUB',
    images: Array.isArray(hotel?.images_ext)
      ? hotel.images_ext.map((i: any) => ({ category: i?.category || 'exterior', url: i?.url || '' }))
      : undefined,
    bookingUrl,
    distanceToCenter: typeof hotel?.distance_center === 'number' ? hotel.distance_center : undefined,
    taxesAndFees: extractTaxesLine(rate),
    mealType: extractMealLine(rate),
    cancellationPolicy: extractCancellationPolicyLine(rate),
    cancellationDeadline: extractCancellationDeadlineLine(rate),
    checkInTime: cinout.in,
    checkOutTime: cinout.out,
    metapolicyHighlights: hotel?.metapolicy_struct ? [JSON.stringify(hotel.metapolicy_struct)] : undefined,
    roomName: rate?.room_name,
    roomAmenities: Array.isArray(rate?.amenities) ? rate.amenities.map((a: any) => String(a)) : undefined,
    amenities: Array.isArray(hotel?.amenities) ? hotel.amenities.map((a: any) => String(a)) : undefined,
  };
}

async function enrichHotelsWithRoomGroups(rawHotels: any[], hotels: HotelForApi[]): Promise<HotelForApi[]> {
  if (!hasPgConfig()) return hotels;
  const enriched: HotelForApi[] = [];
  for (let i = 0; i < hotels.length; i += 1) {
    const mapped = hotels[i];
    const raw = rawHotels[i];
    const hid = String(raw?.hid ?? '');
    const rgExt = raw?.rates?.[0]?.rg_ext as Record<string, unknown> | undefined;
    if (!hid || !rgExt) {
      enriched.push(mapped);
      continue;
    }
    try {
      const row = await getRoomGroupByRgExt(hid, rgExt);
      if (!row) {
        enriched.push(mapped);
        continue;
      }
      const staticAmenities = toStringArray(row.room_amenities);
      const roomImages = toImageArray(row.images).slice(0, 4);
      const mergedImages =
        roomImages.length > 0
          ? [...roomImages, ...(mapped.images || [])]
          : mapped.images;
      enriched.push({
        ...mapped,
        roomName: row.name && row.name.trim() ? row.name : mapped.roomName,
        roomAmenities:
          staticAmenities.length > 0 ? staticAmenities : mapped.roomAmenities,
        images: mergedImages,
      });
    } catch {
      enriched.push(mapped);
    }
  }
  return enriched;
}

function formatHotelsForPrompt(hotels: HotelForApi[]): string {
  if (hotels.length === 0) return '';
  let text = '\n\n# 🏨 Рекомендуемые отели (используй ТОЛЬКО эти отели)\n\n';
  hotels.forEach((hotel, index) => {
    const stars = '⭐'.repeat(hotel.stars);
    text += `### ${index + 1}. ${hotel.name} ${stars}\n\n`;
    if (hotel.images?.[0]) {
      text += `![${hotel.name}](${hotel.images[0].url})\n\n`;
    }
    text += `- **Адрес:** ${hotel.address}\n`;
    if (hotel.rating) text += `- **Рейтинг:** ${hotel.rating}/10\n`;
    text += `- **Цена:** от ${hotel.price.toLocaleString('ru-RU')} ${hotel.currency}\n`;
    if (hotel.taxesAndFees) text += `- **Налоги и сборы:** ${hotel.taxesAndFees}\n`;
    if (hotel.mealType) text += `- **Питание:** ${hotel.mealType}\n`;
    if (hotel.cancellationPolicy) text += `- **Политика отмены:** ${hotel.cancellationPolicy}\n`;
    if (hotel.cancellationDeadline) text += `- **Дедлайн отмены:** ${hotel.cancellationDeadline}\n`;
    if (hotel.checkInTime || hotel.checkOutTime) {
      text += `- **Check-in / Check-out:** ${hotel.checkInTime || '-'} / ${hotel.checkOutTime || '-'}\n`;
    }
    if (hotel.metapolicyHighlights?.length) {
      text += `- **Важные ограничения:** ${hotel.metapolicyHighlights.join('; ')}\n`;
    }
    if (hotel.roomName) text += `- **Номер:** ${hotel.roomName}\n`;
    if (hotel.distanceToCenter) {
      const km = hotel.distanceToCenter / 1000;
      text += `- **До центра:** ${km < 1 ? `${Math.round(hotel.distanceToCenter)} м` : `${km.toFixed(1)} км`}\n`;
    }
    if (hotel.bookingUrl) {
      text += `\n[🛎️ Забронировать ${hotel.name}](${hotel.bookingUrl})\n`;
    }
    text += '\n---\n\n';
  });
  text += '\n⚠️ **ВАЖНО:** Используй ТОЛЬКО эти отели в своих рекомендациях.\n';
  return text;
}

type PlaceType = 'restaurant' | 'cafe' | 'museum' | 'attraction' | 'park' | 'viewpoint' | 'shopping' | 'nightlife';
type PromptPlace = {
  name: string;
  type: PlaceType;
  area: string;
  why: string;
  bestTimeToVisit: string;
  priceLevel: string;
  duration: string;
  interests: string[];
};

const PROMPT_PLACES: Record<string, PromptPlace[]> = {
  'москва': [
    { name: 'ГЭС-2', type: 'museum', area: 'Болотная набережная', why: 'современное искусство, архитектура и культурная программа в центре', bestTimeToVisit: 'днем или ранним вечером', priceLevel: 'средний', duration: '1.5-2 часа', interests: ['art', 'architecture', 'culture', 'museum'] },
    { name: 'Патриаршие пруды', type: 'attraction', area: 'Пресня', why: 'короткая прогулка, кафе и вечерняя атмосфера старой Москвы', bestTimeToVisit: 'вечером', priceLevel: 'бесплатно', duration: '45-90 минут', interests: ['walks', 'food', 'local', 'romantic'] },
    { name: 'Северяне', type: 'restaurant', area: 'Большая Никитская', why: 'русская кухня в современной подаче для ужина без туристического ощущения', bestTimeToVisit: 'ужин', priceLevel: 'выше среднего', duration: '1.5-2 часа', interests: ['food', 'local', 'restaurant'] },
    { name: 'Аптекарский огород', type: 'park', area: 'Проспект Мира', why: 'спокойная зеленая локация для разгрузки плотного маршрута', bestTimeToVisit: 'утро или день', priceLevel: 'низкий', duration: '1-1.5 часа', interests: ['nature', 'walks', 'family'] },
  ],
  'санкт-петербург': [
    { name: 'Новая Голландия', type: 'park', area: 'Адмиралтейский район', why: 'еда, прогулка и культурные события в одной компактной локации', bestTimeToVisit: 'днем или вечером', priceLevel: 'средний', duration: '1.5-3 часа', interests: ['walks', 'food', 'culture', 'family'] },
    { name: 'Эрарта', type: 'museum', area: 'Васильевский остров', why: 'современное искусство без перегруза классикой', bestTimeToVisit: 'днем', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'museum', 'culture'] },
    { name: 'Севкабель Порт', type: 'viewpoint', area: 'Васильевский остров', why: 'вид на залив, кафе и расслабленный вечерний сценарий', bestTimeToVisit: 'закат', priceLevel: 'средний', duration: '1.5-2 часа', interests: ['view', 'walks', 'food', 'nightlife'] },
    { name: 'Бекицер', type: 'restaurant', area: 'Рубинштейна', why: 'неформальная еда и оживленная улица для вечернего маршрута', bestTimeToVisit: 'ужин', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'casual', 'nightlife'] },
  ],
  'париж': [
    { name: 'Musée d’Orsay', type: 'museum', area: '7-й округ', why: 'импрессионисты и сильная коллекция в красивом здании бывшего вокзала', bestTimeToVisit: 'утро', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'museum', 'culture'] },
    { name: 'Le Marais', type: 'attraction', area: '3-4-й округа', why: 'бутики, галереи, еда и исторические улицы без длинных переездов', bestTimeToVisit: 'день', priceLevel: 'бесплатно', duration: '2-3 часа', interests: ['walks', 'shopping', 'food', 'architecture'] },
    { name: 'Bouillon République', type: 'restaurant', area: 'République', why: 'классическая французская еда по умеренной цене и быстрый формат', bestTimeToVisit: 'обед или ужин', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'budget', 'local'] },
    { name: 'Parc des Buttes-Chaumont', type: 'park', area: '19-й округ', why: 'менее очевидный парк с видами и паузой от музеев', bestTimeToVisit: 'день', priceLevel: 'бесплатно', duration: '1-2 часа', interests: ['nature', 'walks', 'view'] },
  ],
  'стамбул': [
    { name: 'Айя-София', type: 'attraction', area: 'Султанахмет', why: 'главная историческая точка рядом с Голубой мечетью и цистерной', bestTimeToVisit: 'утро', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['history', 'architecture', 'culture'] },
    { name: 'Цистерна Базилика', type: 'museum', area: 'Султанахмет', why: 'атмосферная короткая остановка рядом с главными достопримечательностями', bestTimeToVisit: 'день', priceLevel: 'средний', duration: '45-60 минут', interests: ['history', 'architecture'] },
    { name: 'Karaköy Lokantası', type: 'restaurant', area: 'Каракёй', why: 'турецкая кухня в удобном районе между Галатой и набережной', bestTimeToVisit: 'обед или ужин', priceLevel: 'выше среднего', duration: '1.5 часа', interests: ['food', 'local', 'restaurant'] },
    { name: 'Kadıköy Çarşı', type: 'shopping', area: 'Кадыкёй', why: 'рынок, уличная еда и более локальная азиатская сторона города', bestTimeToVisit: 'день или вечер', priceLevel: 'средний', duration: '2-3 часа', interests: ['food', 'local', 'shopping', 'walks'] },
  ],
  'дубай': [
    { name: 'Alserkal Avenue', type: 'museum', area: 'Al Quoz', why: 'галереи, дизайн-пространства и кафе за пределами моллового Дубая', bestTimeToVisit: 'днем', priceLevel: 'средний', duration: '2-3 часа', interests: ['art', 'culture', 'coffee'] },
    { name: 'Dubai Creek Harbour', type: 'viewpoint', area: 'Creek Harbour', why: 'виды на skyline и спокойная прогулка у воды', bestTimeToVisit: 'закат', priceLevel: 'бесплатно', duration: '1-1.5 часа', interests: ['view', 'walks', 'romantic'] },
    { name: 'Arabian Tea House', type: 'restaurant', area: 'Al Fahidi', why: 'знакомство с эмиратской кухней рядом с историческим кварталом', bestTimeToVisit: 'завтрак или обед', priceLevel: 'средний', duration: '1-1.5 часа', interests: ['food', 'local', 'history'] },
    { name: 'Museum of the Future', type: 'museum', area: 'Trade Centre', why: 'зрелищная архитектура и интерактивный формат для первого визита', bestTimeToVisit: 'утро', priceLevel: 'выше среднего', duration: '2 часа', interests: ['architecture', 'family', 'museum'] },
  ],
};

const PLACE_ALIASES: Record<string, string> = {
  moscow: 'москва',
  'питер': 'санкт-петербург',
  'петербург': 'санкт-петербург',
  'saint petersburg': 'санкт-петербург',
  paris: 'париж',
  istanbul: 'стамбул',
  dubai: 'дубай',
};

function normalizePlaceText(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

function getPromptPlaces(destination: string, preferences: string[] = [], budgetMax?: number): PromptPlace[] {
  const normalized = normalizePlaceText(destination);
  const key =
    Object.entries(PLACE_ALIASES).find(([alias]) => normalized.includes(normalizePlaceText(alias)))?.[1] ||
    Object.keys(PROMPT_PLACES).find((candidate) => normalized.includes(normalizePlaceText(candidate)));
  const places = key ? PROMPT_PLACES[key] || [] : [];
  const interestText = preferences.map(normalizePlaceText).join(' ');
  return [...places]
    .sort((a, b) => {
      const score = (p: PromptPlace) =>
        p.interests.reduce((sum, tag) => sum + (interestText.includes(tag) ? 3 : 0), 0) -
        (budgetMax && budgetMax < 70000 && p.priceLevel === 'выше среднего' ? 2 : 0);
      return score(b) - score(a);
    })
    .slice(0, 10);
}

function formatPlacesForPrompt(places: PromptPlace[], destination: string): string {
  if (places.length === 0) {
    return '\n\n# 📍 Места и заведения\n\nНет проверенного списка мест для этого направления. Можно рекомендовать общеизвестные реальные места, но не выдумывать адреса, рейтинги и часы работы.\n';
  }
  let text = '\n\n# 📍 Проверенные места и заведения для маршрута\n\n';
  places.forEach((place, index) => {
    const query = encodeURIComponent(`${place.name} ${destination}`);
    text += `### ${index + 1}. ${place.name}\n`;
    text += `- **Тип:** ${place.type}\n`;
    text += `- **Район:** ${place.area}\n`;
    text += `- **Почему подходит:** ${place.why}\n`;
    text += `- **Лучшее время:** ${place.bestTimeToVisit}\n`;
    text += `- **Бюджет:** ${place.priceLevel}\n`;
    text += `- **Время на месте:** ${place.duration}\n`;
    text += `- **Google Maps:** https://www.google.com/maps/search/?api=1&query=${query}\n\n`;
  });
  text += '⚠️ Для placeRecommendations и маршрута в первую очередь используй эти места. Если добавляешь другое место, оно должно быть общеизвестным и реально существующим.\n';
  return text;
}

function formatStructuredTripPlanForApi(plan: Record<string, unknown>): string {
  const out: string[] = [];
  const summary = typeof plan.tripSummary === 'string' ? plan.tripSummary.trim() : '';
  if (summary) out.push(summary);

  const placeRecommendations = Array.isArray(plan.placeRecommendations) ? plan.placeRecommendations : [];
  const placeLines = placeRecommendations
    .map((raw) => {
      const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
      const name = typeof p.name === 'string' ? p.name.trim() : '';
      if (!name) return '';
      const mapUrl = typeof p.mapUrl === 'string' && p.mapUrl.trim() ? p.mapUrl.trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}`)}`;
      const details = [p.type, p.area, p.bestTimeToVisit, p.priceLevel, p.duration]
        .map((x) => typeof x === 'string' ? x.trim() : '')
        .filter(Boolean)
        .join(', ');
      const reason = typeof p.whyMatchesUser === 'string' ? p.whyMatchesUser.trim() : '';
      return `- [${name}](${mapUrl})${details ? ` — ${details}` : ''}${reason ? `. ${reason}` : ''}`;
    })
    .filter(Boolean);
  if (placeLines.length > 0) out.push(`## 📍 Места и заведения\n\n${placeLines.join('\n')}`);

  const foodRecommendations = Array.isArray(plan.foodRecommendations)
    ? plan.foodRecommendations.map((x) => typeof x === 'string' ? x.trim() : '').filter(Boolean)
    : [];
  if (foodRecommendations.length > 0) out.push(`## 🍽 Еда и рестораны\n\n${foodRecommendations.map((x) => `- ${x}`).join('\n')}`);

  const practicalTips = Array.isArray(plan.practicalTips)
    ? plan.practicalTips.map((x) => typeof x === 'string' ? x.trim() : '').filter(Boolean)
    : [];
  if (practicalTips.length > 0) out.push(`## 💡 Практические советы\n\n${practicalTips.map((x) => `- ${x}`).join('\n')}`);

  const followUp = typeof plan.followUpQuestion === 'string' ? plan.followUpQuestion.trim() : '';
  if (followUp) out.push(followUp);
  return out.join('\n\n').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    const traceId = typeof req.query.traceId === 'string' ? req.query.traceId : undefined;
    if (traceId) {
      const trace = inMemoryTraces.find((t) => t.traceId === traceId);
      if (!trace) return res.status(404).json({ error: 'Trace not found' });
      return res.status(200).json({ trace });
    }
    return res.status(200).json({ traces: listRecentTraces(30), buildVersion: BUILD_VERSION });
  }

  if (req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({
      error: 'OpenRouter API key is not configured',
      message: 'Set OPENROUTER_API_KEY in Vercel environment variables',
    });
  }

  // Rate limiting for anonymous users (5 requests per day)
  try {
    if (!isAuthenticatedRequest(req)) {
      const ip = getClientIp(req);
      const { allowed, remaining } = await checkAndIncrementRateLimit(ip);
      if (!allowed) {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(429).json({
          error: 'rate_limit_exceeded',
          message: 'Вы использовали все 5 бесплатных запросов на сегодня. Зарегистрируйтесь для неограниченного доступа.',
          rateLimitExceeded: true,
          remaining: 0,
        });
      }
      logSearchStep('info', 'rate-limit', 'anonymous_request', { ip, remaining });
    }
  } catch (rateLimitErr) {
    console.error('[rate limit] unexpected error, continuing:', rateLimitErr instanceof Error ? rateLimitErr.message : rateLimitErr);
  }

  let useStream = false;
  try {
    const body = req.body as {
      messages?: { role: string; text: string }[];
      conversationSummary?: string;
      filters?: Record<string, unknown>;
      stream?: boolean;
    };
    const messages = body?.messages ?? [];
    const conversationSummary = typeof body?.conversationSummary === 'string' ? body.conversationSummary.trim() : '';
    const filters = body?.filters as {
      destination?: string;
      dates?: { start?: string; end?: string };
      durationDays?: number;
      budget?: { min?: number; max?: number };
      preferences?: string[];
      travelers?: number;
    } | undefined;
    // IMPORTANT:
    // На Vercel иногда стриминг (`stream=true`) падает с FUNCTION_INVOCATION_FAILED.
    // Чтобы гарантировать стабильность и корректную работу фронта,
    // отключаем stream и всегда возвращаем обычный JSON.
    useStream = false;

    const destination = filters?.destination ?? 'Москва';
    const lastUserText = [...messages]
      .reverse()
      .find((m) => (m?.role || 'user') === 'user' && typeof m?.text === 'string');
    const durationFromMessage = parseDurationDays(String(lastUserText?.text || ''));
    const durationFromFilters = Number(filters?.durationDays);
    const requestedDurationDays =
      Number.isFinite(durationFromFilters) && durationFromFilters > 0
        ? Math.max(1, Math.min(30, Math.round(durationFromFilters)))
        : durationFromMessage;
    const startDate = parseIsoDate(filters?.dates?.start) || new Date();
    let endDate = parseIsoDate(filters?.dates?.end);
    if (!endDate || endDate.getTime() <= startDate.getTime()) {
      endDate = addDaysUtc(startDate, requestedDurationDays || 7);
    } else if (durationFromMessage) {
      endDate = addDaysUtc(startDate, durationFromMessage);
    }
    const start = formatIsoDate(startDate);
    const end = formatIsoDate(endDate);
    const travelers = filters?.travelers ?? 2;
    const childrenAges = Array.isArray((filters as any)?.childrenAges)
      ? ((filters as any).childrenAges as unknown[]).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x >= 0 && x <= 17)
      : [];
    const budgetMin = filters?.budget?.min ?? 1000;
    const budgetMax = filters?.budget?.max ?? 100000;
    const traceId = createTraceId();
    const rawUserQuery = messages?.[messages.length - 1]?.text || '';
    const certificationHotelIds = resolveCertificationHotelIds(`${rawUserQuery}\n${destination}`);
    upsertTrace({
      traceId,
      rawUserQuery,
      parsedDestination: destination,
      parsedDates: { checkIn: start, checkOut: end },
      adults: travelers,
      children: childrenAges.length,
      childrenAges,
    });
    logSearchStep('info', traceId, 'request_received', {
      destination,
      start,
      end,
      requestedDurationDays: requestedDurationDays || diffDaysUtc(startDate, endDate),
      travelers,
      childrenAgesCount: childrenAges.length
    });
    if (certificationHotelIds) {
      logSearchStep('info', traceId, 'certification_test_hotel_requested', {
        ids: certificationHotelIds,
      });
    }
    const normalized = normalizeDestination(destination);
    const regionId = getRegionIdByCity(normalized.regionHint || destination);
    upsertTrace({ traceId, normalizedDestination: normalized.regionHint });
    logSearchStep('info', traceId, 'destination_normalized', { ...normalized, regionId });

    const endpoint = resolveSearchEndpoint({
      hasCoordinates: Boolean(normalized.latitude && normalized.longitude),
      regionResultCount: regionId ? 1 : 0,
    });
    upsertTrace({ traceId, endpoint: endpoint.endpoint });
    logSearchStep('info', traceId, 'endpoint_selected', endpoint);

    let hotels: HotelForApi[] = [];
    const HOTEL_RESULTS_LIMIT = 10;
    const canUseTestIdFallback = ETG_ENABLE_TEST_FALLBACK && process.env.NODE_ENV !== 'production';
    const searchStartedAt = Date.now();
    try {
      if (FORCE_TEST_HOTELS) {
        hotels = getCertificationTestHotels(destination, start, end, travelers);
        upsertTrace({
          traceId,
          selectedEndpoint: 'test_hotels:forced_by_cert_mode',
          numberOfHotels: hotels.length,
          firstReferralLink: hotels[0]?.bookingUrl,
        });
      } else {
      if (!hasEtgCredentials()) {
        throw new Error('ETG credentials are not configured');
      }

      let rawHotels: any[] = [];
      const stepErrors: string[] = [];
      if (certificationHotelIds) {
        try {
          rawHotels = await searchSerpHotels(certificationHotelIds, {
            checkIn: start,
            checkOut: end,
            adults: travelers,
            childrenAges,
          });
          if (rawHotels.length === 0) {
            logSearchStep('warn', traceId, 'certification_test_hotel_empty', { ids: certificationHotelIds });
          }
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/hotels/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/hotels/',
              ids: certificationHotelIds,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_hotels_failed';
          stepErrors.push(`certification_hotels:${msg}`);
          logSearchStep('warn', traceId, 'certification_test_hotel_failed', {
            ids: certificationHotelIds,
            error: msg,
          });
        }
      }

      if (rawHotels.length === 0 && regionId) {
        try {
          rawHotels = await searchSerpRegion(regionId, {
            checkIn: start,
            checkOut: end,
            adults: travelers,
            childrenAges,
          });
          if (rawHotels.length === 0) {
            logSearchStep('warn', traceId, 'serp_region_empty', { regionId });
          }
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/region/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/region/',
              region_id: regionId,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_region_failed';
          stepErrors.push(`serp_region:${msg}`);
          logSearchStep('warn', traceId, 'serp_region_failed', { regionId, error: msg });
        }
      }

      if (rawHotels.length === 0 && normalized.latitude && normalized.longitude) {
        try {
          const geoEndpoint = resolveSearchEndpoint({
            hasCoordinates: true,
            regionResultCount: 0,
          });
          upsertTrace({ traceId, endpoint: geoEndpoint.endpoint });
          logSearchStep('warn', traceId, 'region_empty_geo_fallback', geoEndpoint);
          rawHotels = await searchSerpGeo(
            normalized.latitude,
            normalized.longitude,
            normalized.radiusKm || 10,
            {
              checkIn: start,
              checkOut: end,
              adults: travelers,
              childrenAges,
            }
          );
          if (rawHotels.length === 0) {
            logSearchStep('warn', traceId, 'serp_geo_empty', {
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              radius: normalized.radiusKm || 10,
            });
          }
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/geo/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/geo/',
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              radius: normalized.radiusKm || 10,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_geo_failed';
          stepErrors.push(`serp_geo:${msg}`);
          logSearchStep('warn', traceId, 'serp_geo_failed', { error: msg });
        }
      }

      if (rawHotels.length === 0 && canUseTestIdFallback) {
        try {
          logSearchStep('warn', traceId, 'primary_search_empty_use_test_hotel_ids', {
            ids: CERT_TEST_HOTEL_IDS,
          });
          rawHotels = await searchSerpHotels(CERT_TEST_HOTEL_IDS, {
            checkIn: start,
            checkOut: end,
            adults: travelers,
            childrenAges,
          });
          upsertTrace({
            traceId,
            selectedEndpoint: '/api/b2b/v3/search/serp/hotels/',
            etgRequestPayload: {
              endpoint: '/api/b2b/v3/search/serp/hotels/',
              ids: CERT_TEST_HOTEL_IDS,
              checkin: start,
              checkout: end,
              guests: [{ adults: travelers, children: childrenAges }],
            },
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'serp_hotels_failed';
          stepErrors.push(`serp_hotels:${msg}`);
          logSearchStep('warn', traceId, 'serp_hotels_failed', { error: msg });
        }
      }

      if (rawHotels.length === 0) {
        throw new Error(
          `No hotels returned from region/geo search${canUseTestIdFallback ? '/test-hotel fallback' : ''}${stepErrors.length ? ` (${stepErrors.join('; ')})` : ''}`
        );
      }

      rawHotels = rawHotels.slice(0, HOTEL_RESULTS_LIMIT);
      const fallbackRegionId = rawHotels
        .map((h: any) => h?.region?.id ?? h?.region_id)
        .find((id: unknown) => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)));
      hotels = rawHotels.map((h) =>
        mapEtgHotelToApi(
          h,
          start,
          end,
          travelers,
          destination,
          fallbackRegionId as number | string | undefined
        )
      );
      hotels = await enrichHotelsWithRoomGroups(rawHotels, hotels);
      upsertTrace({
        traceId,
        responseStatus: 200,
        responseTimeMs: Date.now() - searchStartedAt,
        hotelsFound: hotels.length,
        etgResponseSummary: {
          hotelsCount: hotels.length,
        },
        numberOfHotels: hotels.length,
        firstReferralLink: hotels[0]?.bookingUrl,
        durationMs: Date.now() - searchStartedAt,
      });
      logSearchStep('info', traceId, 'search_success', { hotelsFound: hotels.length, responseTimeMs: Date.now() - searchStartedAt });
      }
    } catch (searchError: unknown) {
      const reason = searchError instanceof Error ? searchError.message : 'search_failed';
      upsertTrace({
        traceId,
        responseStatus: 500,
        responseTimeMs: Date.now() - searchStartedAt,
        hotelsFound: 0,
        errorReason: reason,
      });
      logSearchStep('error', traceId, 'search_failed', { reason, responseTimeMs: Date.now() - searchStartedAt });
      if (FORCE_TEST_HOTELS || canUseTestIdFallback) {
        upsertTrace({ traceId, selectedEndpoint: 'test_hotels:fallback_after_error' });
        hotels = getCertificationTestHotels(destination, start, end, travelers);
      }
      // hotels остаётся [] — продолжаем и возвращаем GPT-ответ без карточек отелей
      logSearchStep('info', traceId, 'etg_failed_continuing_gpt', { hotelsCount: 0 });
    }
    const hotelsText = formatHotelsForPrompt(hotels);
    const places = getPromptPlaces(
      destination,
      Array.isArray(filters?.preferences) ? filters.preferences : [],
      budgetMax
    );
    const placesText = formatPlacesForPrompt(places, destination);

    const conversationMessages = messages
      .map((msg) => ({
        role: msg.role || 'user',
        content: msg.text || '',
      }))
      .filter((msg) => msg.role !== 'system')
      .filter((msg) => typeof msg.content === 'string' && msg.content.trim() !== '')
      .slice(-8)
      .map((msg) => ({
        role: msg.role,
        content: String(msg.content).slice(0, msg.role === 'assistant' ? 2200 : 1800),
      }));

    if (durationFromMessage && isDurationOnlyMessage(String(lastUserText?.text || ''))) {
      conversationMessages.push({
        role: 'user',
        content: `Составь детальный маршрут по ${destination} на ${durationFromMessage} дня по дням (утро/день/вечер), с практическими советами, логичной последовательностью и временем для каждого пункта.`,
      });
    }

    const effectiveDurationDays = requestedDurationDays || diffDaysUtc(startDate, endDate);
    const contextBlock = `Контекст путешествия:\n- Направление: ${destination}\n- Даты: с ${start} по ${end}\n- Длительность: ${effectiveDurationDays} дней\n- Бюджет: от ${budgetMin} до ${budgetMax} ₽\n- Путешественников: ${travelers}${hotelsText}${placesText}`;
    const systemPromptForRequest = useStream ? SYSTEM_PROMPT : TRAVEL_JSON_SYSTEM_PROMPT;
    const durationInstruction =
      effectiveDurationDays > 0
        ? `\n\nКРИТИЧНО: В поле itinerary верни РОВНО ${effectiveDurationDays} дней (day: 1..${effectiveDurationDays}), без пропусков и пустых дней. Каждый пункт внутри morning/daytime/evening начинай с времени: "09:00-10:30 — ...".`
        : '';
    const systemContent = `${systemPromptForRequest}${durationInstruction}\n\n${contextBlock}`;
    const summaryMessages = conversationSummary
      ? [{ role: 'system', content: `Краткое резюме предыдущего диалога:\n${conversationSummary.slice(0, 1400)}` }]
      : [];
    const openRouterMessages = [
      { role: 'system', content: systemContent },
      ...summaryMessages,
      ...conversationMessages,
    ];
    const aiUsageKey = getAiUsageKey(req);
    const aiUsageBefore = await getAiUsageSnapshot(aiUsageKey);
    if (aiUsageBefore.remainingTokens <= 0) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(429).json({
        error: 'ai_limit_exceeded',
        message: `Вы достигли лимита AI. Следующий сброс — ${aiUsageBefore.resetAtLabel}.`,
        aiLimitExceeded: true,
        aiUsage: aiUsageBefore,
      });
    }

    if (useStream) {
      const streamHeaders = {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      };
      res.writeHead(200, streamHeaders);
      res.write(`data: ${JSON.stringify({ type: 'hotels', hotels })}\n\n`);
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4o-mini',
            messages: openRouterMessages,
            temperature: 0.7,
            max_tokens: AI_MAX_COMPLETION_TOKENS,
            stream: true,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': req.headers.origin || 'https://vercel.app',
              'X-Title': 'AI Travel Assistant',
            },
            responseType: 'stream',
            timeout: 60000,
          }
        );

        const upstream = response.data as NodeJS.ReadableStream;
        let upstreamBuffer = '';
        let streamedAssistantMessage = '';
        const collectStreamText = (rawChunk: string) => {
          upstreamBuffer += rawChunk;
          let lineEnd = upstreamBuffer.indexOf('\n');
          while (lineEnd !== -1) {
            const line = upstreamBuffer.slice(0, lineEnd).trim();
            upstreamBuffer = upstreamBuffer.slice(lineEnd + 1);
            lineEnd = upstreamBuffer.indexOf('\n');
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (typeof content === 'string') streamedAssistantMessage += content;
            } catch {
              // Ignore non-JSON stream comments/chunks from upstream.
            }
          }
        };
        upstream.on('data', (chunk: Buffer | string) => {
          if (res.writableEnded) return;
          collectStreamText(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
          res.write(chunk);
        });
        upstream.on('end', async () => {
          if (res.writableEnded) return;
          try {
            const fallbackTokens = estimateMessagesTokens(openRouterMessages) + estimateTokensFromText(streamedAssistantMessage);
            const aiUsageAfter = await addAiUsageTokens(aiUsageKey, fallbackTokens);
            res.write(`data: ${JSON.stringify({ type: 'aiUsage', aiUsage: aiUsageAfter })}\n\n`);
          } catch (err) {
            console.error('[api/openai] Failed to persist stream AI usage:', err instanceof Error ? err.message : err);
          }
          if (!res.writableEnded) res.end();
        });
        upstream.on('error', (err: Error) => {
          console.error('[api/openai] upstream stream error:', err.message);
          if (!res.writableEnded) res.end();
        });
        return;
      } catch (streamError) {
        // Важно: в режиме stream нельзя пытаться вернуть JSON 500 —
        // headers уже отправлены. Завершаем stream корректно.
        console.error('[api/openai] streamError:', streamError);
        try {
          res.write(
            `data: ${JSON.stringify({
              error: {
                message: 'Streaming failed',
              },
            })}\n\n`
          );
        } catch {
          // ignore write errors
        }
        res.end();
        return;
      }
    }

    const response = await axios.post<OpenRouterCompletionResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: openRouterMessages,
        temperature: 0.7,
        max_tokens: AI_MAX_COMPLETION_TOKENS,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.origin || 'https://vercel.app',
          'X-Title': 'AI Travel Assistant',
        },
        timeout: 25000,
      }
    );

    const assistantMessage = response.data.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(502).json({ error: 'Empty response from OpenRouter API' });
    }

    let textToSend = stripContextUpdateBlock(assistantMessage);
    let itineraryFromGpt: unknown[] | undefined;
    try {
      const gptJson = JSON.parse(extractJsonObject(assistantMessage) || assistantMessage) as Record<string, unknown>;
      const formatted = formatStructuredTripPlanForApi(gptJson);
      if (formatted) textToSend = formatted;
      if (Array.isArray(gptJson.itinerary) && gptJson.itinerary.length > 0) {
        itineraryFromGpt = gptJson.itinerary as unknown[];
      }
    } catch {
      // GPT вернул не JSON — используем как есть
    }

    const fallbackTokens =
      estimateMessagesTokens(openRouterMessages) + estimateTokensFromText(assistantMessage);
    const aiUsageAfter = await addAiUsageTokens(aiUsageKey, getOpenRouterTotalTokens(response.data, fallbackTokens));

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({
      text: textToSend,
      hotels,
      itinerary: itineraryFromGpt,
      aiUsage: aiUsageAfter,
      buildVersion: BUILD_VERSION,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    console.error('[api/openai] Error:', err?.message, err?.response?.data);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    if (useStream && res.headersSent) {
      try {
        res.end();
      } catch {
        // ignore
      }
      return;
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: err?.message ?? 'Unknown error',
    });
  }
}
