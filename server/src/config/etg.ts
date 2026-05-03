import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Load env eagerly so ETG_* constants are correct even when this module is imported
// before server bootstrap calls dotenv.config().
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config();

export const ETG_BASE_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';
export const ETG_KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
export const ETG_API_TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';

const parsedTimeout = Number(process.env.ETG_SEARCH_TIMEOUT_MS || 15000);
const parsedMaxTimeout = Number(process.env.ETG_SEARCH_TIMEOUT_MAX_MS || 30000);
export const ETG_TIMEOUT_MS = Number.isFinite(parsedTimeout) ? Math.max(1000, parsedTimeout) : 15000;
export const ETG_TIMEOUT_MAX_MS = Number.isFinite(parsedMaxTimeout) ? Math.max(ETG_TIMEOUT_MS, parsedMaxTimeout) : 30000;

export const ETG_ENABLE_TEST_FALLBACK = process.env.ETG_ENABLE_TEST_FALLBACK === 'true';
export const ETG_DEBUG_MODE = process.env.ETG_DEBUG_MODE === 'true';
export const CERT_MODE = process.env.CERT_MODE || 'real';
export const FORCE_TEST_HOTELS = CERT_MODE === 'test_hotels';

export function clampEtgTimeout(timeoutMs?: number): number {
  if (!timeoutMs || !Number.isFinite(timeoutMs)) return ETG_TIMEOUT_MS;
  return Math.min(Math.max(timeoutMs, 1000), ETG_TIMEOUT_MAX_MS);
}

export function hasEtgCredentials(): boolean {
  return Boolean(ETG_KEY_ID && ETG_API_TOKEN);
}

export function etgAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${ETG_KEY_ID}:${ETG_API_TOKEN}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PartnerName/ai-travel; ClientVersion/1.0.0',
  };
}
