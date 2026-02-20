import axios from 'axios';

const API_KEY = '8be7ae21-6759-4c42-ae09-aa8c958d8c54';
const API_SECRET = '72f3fb15ba5b19b2e469acbe7d28f654654dace2';
const API_URL = 'https://partner.ostrovok.ru';

async function testAuth(method, headers) {
  console.log(`\n=== Testing ${method} ===`);
  try {
    const response = await axios.post(
      `${API_URL}/api/b2b/v3/search/serp/hotels/`,
      {
        hids: [1],  // test_hotel has hid=1
        checkin: '2026-02-11',
        checkout: '2026-02-12',
        guests: [{ adults: 2, children: [] }],
        language: 'ru',
        currency: 'RUB',
        residency: 'ru'
      },
      { headers, timeout: 10000 }
    );
    console.log('SUCCESS! Status:', response.status);
    console.log('Hotels found:', response.data.hotels?.length || 0);
    if (response.data.hotels?.[0]) {
      console.log('First hotel:', response.data.hotels[0].name);
    }
    return true;
  } catch (error) {
    console.log('FAILED:', error.response?.status, error.response?.data?.error || error.message);
    return false;
  }
}

async function main() {
  // Test with API_SECRET
  await testAuth('Basic Auth with API_SECRET', {
    'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Test/1.0'
  });
  
  // Test on production endpoint
  await testAuth('Production API (worldota.net)', {
    'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Test/1.0'
  }, 'https://api.worldota.net');
}

main();
