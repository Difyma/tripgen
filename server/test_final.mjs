#!/usr/bin/env node
/**
 * Final ETG smoke script. Requires env vars; never hardcode real credentials.
 */

import axios from 'axios';

const KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const API_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';

if (!KEY_ID || !TOKEN) {
  console.error('Set OSTROVOK_KEY_ID and OSTROVOK_API_TOKEN before running this script.');
  process.exit(1);
}

const requestBody = {
  ids: ['test_hotel', 'test_hotel_do_not_book'],
  checkin: process.env.TEST_CHECKIN || '2026-06-20',
  checkout: process.env.TEST_CHECKOUT || '2026-06-21',
  guests: [{ adults: 2, children: [] }],
  language: 'ru',
  currency: 'RUB',
  residency: 'ru',
};

console.log('OSTROVOK API - FINAL TEST');
console.log('Date:', new Date().toISOString());
console.log('Key ID:', KEY_ID);
console.log('API Token:', '<redacted>');
console.log('API URL:', API_URL);

const response = await axios.post(
  `${API_URL}/api/b2b/v3/search/serp/hotels/`,
  requestBody,
  {
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TestScript/1.0',
    },
    timeout: 15000,
  }
);

console.log('SUCCESS:', response.status);
console.log('Hotels found:', response.data?.hotels?.length || 0);
console.log('Hotel ids:', (response.data?.hotels || []).map((h) => h.id));
