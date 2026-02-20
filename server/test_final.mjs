#!/usr/bin/env node
/**
 * Final test script for Ostrovok API
 * Send output to support with any questions
 * 
 * Usage: node test_final.mjs
 */

import axios from 'axios';

const CONFIG = {
  keyId: '12984',
  apiToken: '8be7ae21-6759-4c42-ae09-aa8c958d8c54',
  partnerId: '270392.affiliate.a0bd'
};

const auth = Buffer.from(`${CONFIG.keyId}:${CONFIG.apiToken}`).toString('base64');

console.log('==============================================');
console.log('OSTROVOK API - FINAL TEST');
console.log('==============================================');
console.log('Date:', new Date().toISOString());
console.log('');
console.log('CONFIGURATION:');
console.log('  Key ID (Username):', CONFIG.keyId);
console.log('  API Token:', CONFIG.apiToken.substring(0, 12) + '...');
console.log('  Partner ID:', CONFIG.partnerId);
console.log('');

const requestBody = {
  hids: [1],  // test_hotel
  checkin: '2026-03-25',
  checkout: '2026-03-26',
  guests: [{ adults: 2, children: [] }],
  language: 'ru',
  currency: 'RUB',
  residency: 'ru'
};

const endpoints = [
  { url: 'https://api.worldota.net/api/b2b/v3/search/serp/hotels/', name: 'Production (api.worldota.net)' },
  { url: 'https://api-sandbox.worldota.net/api/b2b/v3/search/serp/hotels/', name: 'Sandbox (api-sandbox.worldota.net)' },
  { url: 'https://partner.ostrovok.ru/api/b2b/v3/search/serp/hotels/', name: 'Partner (partner.ostrovok.ru)' }
];

console.log('REQUEST BODY:');
console.log(JSON.stringify(requestBody, null, 2));
console.log('');
console.log('AUTHORIZATION:');
console.log('  Basic', auth);
console.log('');

console.log('==============================================');
console.log('TESTING ENDPOINTS');
console.log('==============================================');

for (const ep of endpoints) {
  console.log('\n---', ep.name, '---');
  console.log('URL:', ep.url);
  
  try {
    const response = await axios.post(ep.url, requestBody, {
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0'
      },
      timeout: 15000
    });
    
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Hotels found:', response.data.hotels?.length || 0);
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error || error.message);
    
    if (error.response?.headers) {
      const relevantHeaders = ['x-partner-error-slug', 'x-api-metric', 'request-id'];
      for (const h of relevantHeaders) {
        if (error.response.headers[h]) {
          console.log(h + ':', error.response.headers[h]);
        }
      }
    }
  }
}

console.log('\n==============================================');
console.log('CURL COMMAND (for manual testing)');
console.log('==============================================');
console.log(`curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/hotels/" \\
  -H "Authorization: Basic ${auth}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestBody)}'`);

console.log('\n==============================================');
console.log('END OF TEST');
console.log('==============================================');
