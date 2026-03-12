import axios from 'axios';

async function testRequest() {
  try {
    console.log('Testing API...');
    const response = await axios.post('http://localhost:3001/api/openai', {
      messages: [{ role: 'user', content: 'Привет' }],
      filters: {
        destination: 'Москва',
        dates: { start: '2026-03-01', end: '2026-03-08' },
        budget: { min: 1000, max: 100000 },
        travelers: 2
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });
    console.log('Response:', response.data.text.substring(0, 100));
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRequest();
