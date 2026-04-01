type LogLevel = 'info' | 'error' | 'warn';

export interface SearchTrace {
  traceId: string;
  rawUserQuery?: string;
  parsedIntent?: Record<string, unknown>;
  normalizedDestination?: string;
  endpoint?: string;
  requestPayload?: unknown;
  responseStatus?: number;
  responseTimeMs?: number;
  hotelsFound?: number;
  errorReason?: string;
}

const traces = new Map<string, SearchTrace>();

function emit(level: LogLevel, message: string, payload?: unknown): void {
  const data = payload ? ` ${JSON.stringify(payload)}` : '';
  if (level === 'error') console.error(`[search] ${message}${data}`);
  else if (level === 'warn') console.warn(`[search] ${message}${data}`);
  else console.log(`[search] ${message}${data}`);
}

export function createTraceId(): string {
  return `etg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logSearchStep(level: LogLevel, traceId: string, step: string, payload?: unknown): void {
  emit(level, `${traceId} ${step}`, payload);
}

export function upsertTrace(trace: SearchTrace): void {
  traces.set(trace.traceId, { ...(traces.get(trace.traceId) || {}), ...trace });
}

export function getTrace(traceId: string): SearchTrace | undefined {
  return traces.get(traceId);
}

export function listRecentTraces(limit = 20): SearchTrace[] {
  return Array.from(traces.values()).slice(-limit).reverse();
}
