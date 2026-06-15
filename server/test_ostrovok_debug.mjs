#!/usr/bin/env node
/**
 * Debug script for ETG/Ostrovok API testing.
 * Requires env vars; never hardcode real credentials in this file.
 */

import axios from 'axios';

const KEY_ID = process.env.OSTROVOK_KEY_ID || process.env.OSTROVOK_API_KEY || '';
const API_TOKEN = process.env.OSTROVOK_API_TOKEN || process.env.OSTROVOK_API_SECRET || '';
const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '<partner_slug>';
const API_URL = process.env.OSTROVOK_API_URL || 'https://api.worldota.net';

if (!KEY_ID || !API_TOKEN) {
  console.error('Set OSTROVOK_KEY_ID and OSTROVOK_API_TOKEN before running this script.');
  process.exit(1);
}

const getAuthHeaders = () => ({
  Authorization: `Basic ${Buffer.from(`${KEY_ID}:${API_TOKEN}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'User-Agent': 'PartnerName/ai-travel; ClientVersion/1.0.0',
});

async function testAPI() {
  console.log('OSTROVOK API DEBUG TEST');
  console.log('Key ID:', KEY_ID);
  console.log('API Token:', '<redacted>');
  console.log('Partner slug:', PARTNER_SLUG);
  console.log('API URL:', API_URL);

  const url = `${API_URL}/api/b2b/v3/search/serp/hotels/`;
  const body = {
    ids: ['test_hotel', 'test_hotel_do_not_book'],
    checkin: process.env.TEST_CHECKIN || '2026-06-20',
    checkout: process.env.TEST_CHECKOUT || '2026-06-21',
    guests: [{ adults: 2, children: [] }],
    language: 'ru',
    currency: 'RUB',
    residency: 'ru',
  };

  const response = await axios.post(url, body, { headers: getAuthHeaders(), timeout: 30000 });
  console.log('Status:', response.status);
  console.log('Hotels found:', response.data?.hotels?.length || 0);
  console.log('Hotel ids:', (response.data?.hotels || []).map((h) => h.id));
}

testAPI().catch((error) => {
  console.error('FAILED:', error.response?.status, error.response?.data || error.message);
  process.exit(1);
});
