#!/usr/bin/env node
/**
 * Auth smoke test. Requires env vars; never hardcode real credentials here.
 */

import axios from 'axios';

const KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const API_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';

if (!KEY_ID || !TOKEN) {
  console.error('Set OSTROVOK_KEY_ID and OSTROVOK_API_TOKEN before running this script.');
  process.exit(1);
}

async function main() {
  const response = await axios.post(
    `${API_URL}/api/b2b/v3/search/serp/hotels/`,
    {
      ids: ['test_hotel', 'test_hotel_do_not_book'],
      checkin: process.env.TEST_CHECKIN || '2026-06-20',
      checkout: process.env.TEST_CHECKOUT || '2026-06-21',
      guests: [{ adults: 2, children: [] }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru',
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${KEY_ID}:${TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Test/1.0',
      },
      timeout: 10000,
    }
  );

  console.log('SUCCESS:', response.status, 'hotels:', response.data?.hotels?.length || 0);
}

main().catch((error) => {
  console.error('FAILED:', error.response?.status, error.response?.data || error.message);
  process.exit(1);
});
