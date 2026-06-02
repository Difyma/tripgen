/* eslint-disable no-console */
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

async function callOpenAi(payload) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/openai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, duration: Date.now() - started };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRealHotelsPayload(data) {
  assert(Array.isArray(data.hotels), 'Hotels array missing');
  assert(data.hotels.length > 0, 'No hotels returned from ETG search');
  const hasSyntheticCertMarker = data.hotels.some((h) =>
    String(h?.mealType || '').includes('CERT_MODE=test_hotels')
  );
  assert(!hasSyntheticCertMarker, 'Synthetic test fallback detected (CERT_MODE=test_hotels marker)');
  const hasLiveRateFields = data.hotels.some((h) =>
    Number.isFinite(Number(h?.price)) &&
    Number(h?.price) > 0 &&
    typeof h?.bookingUrl === 'string' &&
    h.bookingUrl.includes('partner_slug=') &&
    h.bookingUrl.includes('/rooms/') &&
    typeof h?.taxesAndFees === 'string' &&
    h.taxesAndFees.length > 0
  );
  assert(hasLiveRateFields, 'No live ETG tariff fields found in hotels payload');
}

function assertHotelsListSize(data, min = 10) {
  assert(Array.isArray(data.hotels), 'Hotels array missing');
  assert(data.hotels.length >= min, `Expected at least ${min} hotels, got ${data.hotels.length}`);
}

async function scenario(name, payload, validator) {
  console.log(`\n[smoke] ${name}`);
  const result = await callOpenAi(payload);
  console.log(`[smoke] status=${result.status}, duration=${result.duration}ms`);
  await validator(result);
  console.log(`[smoke] ${name} OK`);
}

const basePayload = {
  messages: [{ role: 'user', text: 'Подбери отель' }],
  stream: false,
  filters: {
    destination: 'Москва',
    dates: { start: '2026-06-10', end: '2026-06-12' },
    budget: { min: 5000, max: 20000 },
    travelers: 2,
    children: 0,
    childrenAges: [],
  },
};

async function run() {
  await scenario('2 adults city search', basePayload, async ({ status, data }) => {
    assert(status === 200, 'Expected 200 from /api/openai');
    assertRealHotelsPayload(data);
    assertHotelsListSize(data, 10);
  });

  await scenario('2 adults + child 5', {
    ...basePayload,
    filters: { ...basePayload.filters, children: 1, childrenAges: [5] },
  }, async ({ status }) => {
    assert(status === 200 || status === 502, 'Unexpected status');
  });

  await scenario('2 adults + children 3 and 11', {
    ...basePayload,
    filters: { ...basePayload.filters, children: 2, childrenAges: [3, 11] },
  }, async ({ status }) => {
    assert(status === 200 || status === 502, 'Unexpected status');
  });

  await scenario('geo normalization destination', {
    ...basePayload,
    filters: { ...basePayload.filters, destination: 'Питер' },
  }, async ({ status }) => {
    assert(status === 200 || status === 502, 'Unexpected status');
  });

  await scenario('no results scenario', {
    ...basePayload,
    filters: { ...basePayload.filters, destination: 'Неизвестный-Город-XYZ' },
  }, async ({ status, data }) => {
    assert([200, 502].includes(status), 'Unexpected status');
    if (status === 502) assert(data.emptyState === true, 'Expected emptyState for no results');
  });

  await scenario('timeout scenario', {
    ...basePayload,
    filters: { ...basePayload.filters, destination: 'Москва' },
  }, async ({ duration }) => {
    assert(duration < 40000, 'Request exceeded max timeout envelope');
  });

  await scenario('referral link correctness', basePayload, async ({ status, data }) => {
    if (status !== 200 || !Array.isArray(data.hotels) || data.hotels.length === 0) return;
    const link = data.hotels[0]?.bookingUrl || '';
    assert(link.includes('partner_slug='), 'Missing partner_slug');
    assert(link.includes('utm_medium=partners'), 'Missing utm_medium');
    assert(link.includes('/rooms/'), 'Expected hotel page link, received SERP fallback');
  });

  await scenario('response contains cancellation/taxes/check-in', basePayload, async ({ status, data }) => {
    if (status !== 200 || !Array.isArray(data.hotels) || data.hotels.length === 0) return;
    const h = data.hotels[0];
    const hasFields =
      typeof h.taxesAndFees !== 'undefined' ||
      typeof h.cancellationPolicy !== 'undefined' ||
      typeof h.checkInTime !== 'undefined';
    const text = String(data.text || '').toLowerCase();
    const hasTextHints =
      text.includes('налог') ||
      text.includes('отмен') ||
      text.includes('check-in') ||
      text.includes('check-out');
    if (!(hasFields || hasTextHints)) {
      console.warn('[smoke] Warning: tariff/policy fields are not present in this sample response');
    }
  });
}

run()
  .then(() => {
    console.log('\n[smoke] All scenarios passed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[smoke] Failed:', err.message);
    process.exit(1);
  });
