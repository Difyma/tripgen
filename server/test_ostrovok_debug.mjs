#!/usr/bin/env node
/**
 * Debug script for Ostrovok API testing
 * Run: node test_ostrovok_debug.mjs
 */

import axios from 'axios';

// Configuration
// ETG API uses Basic Auth with Key ID as username and API Token as password
const KEY_ID = '12984';                          // Key ID from contract settings (username)
const API_TOKEN = '8be7ae21-6759-4c42-ae09-aa8c958d8c54';  // API Token (password)
const PARTNER_ID = '270392.affiliate.a0bd';
const API_URL = 'https://api.worldota.net';      // Production endpoint

// Generate auth headers (same as in gptProxy.ts)
const getAuthHeaders = () => {
  const auth = Buffer.from(`${KEY_ID}:${API_TOKEN}`).toString('base64');
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'User-Agent': `PartnerName/ai-travel; ClientVersion/1.0.0`
  };
};

// Print curl equivalent
function printCurlCommand(url, headers, body) {
  console.log('\n=== CURL EQUIVALENT ===');
  let curl = `curl -X POST "${url}" \\\n`;
  for (const [key, value] of Object.entries(headers)) {
    curl += `  -H "${key}: ${value}" \\\n`;
  }
  curl += `  -d '${JSON.stringify(body)}'`;
  console.log(curl);
  console.log('=======================\n');
}

async function testAPI() {
  console.log('==============================================');
  console.log('OSTROVOK API DEBUG TEST');
  console.log('==============================================');
  console.log('Key ID (username):', KEY_ID);
  console.log('API Token (password):', API_TOKEN.substring(0, 8) + '...');
  console.log('Partner ID:', PARTNER_ID);
  console.log('API URL:', API_URL);
  
  const url = `${API_URL}/api/b2b/v3/search/serp/hotels/`;
  const headers = getAuthHeaders();
  const body = {
    hids: [1],  // test_hotel has hid=1 (numeric hotel ID)
    checkin: '2026-03-20',
    checkout: '2026-03-21',
    guests: [{ adults: 2, children: [] }],
    language: 'ru',
    currency: 'RUB',
    residency: 'ru'
  };
  
  console.log('\n=== REQUEST DETAILS ===');
  console.log('Method: POST');
  console.log('URL:', url);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', JSON.stringify(body, null, 2));
  
  printCurlCommand(url, headers, body);
  
  console.log('=== SENDING REQUEST ===');
  try {
    const response = await axios.post(url, body, {
      headers,
      timeout: 30000
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Body:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('\nResponse Status:', error.response.status);
      console.log('Response Status Text:', error.response.statusText);
      console.log('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('No response received');
    }
    
    if (error.request) {
      console.log('\nRequest was made but no response received');
    }
  }
  
  console.log('\n==============================================');
  console.log('END OF TEST');
  console.log('==============================================');
}

// Test with different URLs
async function testAllUrls() {
  const urls = [
    'https://api-sandbox.worldota.net',
    'https://api.worldota.net',
    'https://partner.ostrovok.ru'
  ];
  
  for (const baseUrl of urls) {
    console.log('\n\n##############################################');
    console.log('TESTING URL:', baseUrl);
    console.log('##############################################');
    
    const url = `${baseUrl}/api/b2b/v3/search/serp/hotels/`;
    const headers = getAuthHeaders();
    const body = {
      ids: ['test_hotel'],
      checkin: '2026-03-20',
      checkout: '2026-03-21',
      guests: [{ adults: 2, children: [] }],
      language: 'ru',
      currency: 'RUB',
      residency: 'ru'
    };
    
    console.log('\nRequest URL:', url);
    console.log('Auth header:', headers.Authorization);
    
    try {
      const response = await axios.post(url, body, { headers, timeout: 15000 });
      console.log('✅ SUCCESS! Status:', response.status);
      console.log('Hotels found:', response.data.hotels?.length || 0);
    } catch (error) {
      console.log('❌ FAILED:', error.response?.status, error.response?.data?.error);
      if (error.response?.data?.debug) {
        console.log('Debug info:', JSON.stringify(error.response.data.debug, null, 2));
      }
    }
  }
}

// Run main test
testAPI();

// Uncomment to test all URLs:
// setTimeout(testAllUrls, 1000);
