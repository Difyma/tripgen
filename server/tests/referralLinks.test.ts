import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildHotelPageLink, encodeGuests } = require('../lib/ostrovok-links.cjs');

test('encodes guests for 2 adults', () => {
  assert.equal(encodeGuests([{ adults: 2 }]), '2');
});

test('encodes guests for 2 adults + child age 5', () => {
  assert.equal(encodeGuests([{ adults: 2, childrenAges: [5] }]), '2and5');
});

test('encodes guests for 2 adults + children 3 and 11', () => {
  assert.equal(encodeGuests([{ adults: 2, childrenAges: [3, 11] }]), '2and3.11');
});

test('builds booking url with dynamic dates and guests', () => {
  const url = buildHotelPageLink('test_hotel', {
    checkIn: '2026-06-10',
    checkOut: '2026-06-15',
    rooms: [{ adults: 2, childrenAges: [5] }],
    partnerSlug: '270392.affiliate.a0bd',
  });
  assert.match(url, /dates=10\.06\.2026-15\.06\.2026/);
  assert.match(url, /guests=2and5/);
  assert.match(url, /partner_slug=270392\.affiliate\.a0bd/);
});
