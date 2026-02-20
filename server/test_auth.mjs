import axios from 'axios';

const API_KEY = '8be7ae21-6759-4c42-ae09-aa8c958d8c54';
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
    return true;
  } catch (error) {
    console.log('FAILED:', error.response?.status, error.response?.data?.error || error.message);
    return false;
  }
}

async function main() {
  // Test 1: Basic Auth с пустым паролем
  await testAuth('Basic Auth (empty password)', {
    'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
    'Content-Type': 'application/json'
  });

  // Test 2: Bearer token
  await testAuth('Bearer token', {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  });

  // Test 3: X-API-Key header
  await testAuth('X-API-Key header', {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  });

  // Test 4: Просто API key как заголовок
  await testAuth('Plain API key', {
    'Authorization': API_KEY,
    'Content-Type': 'application/json'
  });
  
  // Test 5: Basic Auth с 'test' как пароль
  await testAuth('Basic Auth (password: test)', {
    'Authorization': `Basic ${Buffer.from(`${API_KEY}:test`).toString('base64')}`,
    'Content-Type': 'application/json'
  });
}

main();
