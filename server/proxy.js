require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: 'http://localhost:5173' // Your Vite dev server
}));

app.use(express.json());

const OSTROVOK_API_BASE = 'https://api.ostrovok.ru/api/b2b/v3';
const YANDEX_GPT_API_BASE = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

// Proxy for Yandex GPT
app.post('/api/yandex-gpt', async (req, res) => {
  try {
    console.log('Received Yandex GPT request:', JSON.stringify(req.body, null, 2));
    
    const response = await axios.post(YANDEX_GPT_API_BASE, req.body, {
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Yandex GPT response status:', response.status);
    console.log('Yandex GPT response data:', JSON.stringify(response.data, null, 2));
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Yandex GPT:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Proxy for hotel dump
app.get('/api/hotel/dump', async (req, res) => {
  try {
    console.log('Fetching hotel dump...');
    const response = await axios.get(`${OSTROVOK_API_BASE}/hotel/dump`, {
      headers: {
        'Authorization': `Bearer ${process.env.OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'X-API-Version': '3.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching hotel dump:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy for incremental dump
app.get('/api/hotel/incremental-dump', async (req, res) => {
  try {
    console.log('Fetching incremental dump...');
    const response = await axios.get(`${OSTROVOK_API_BASE}/hotel/incremental-dump`, {
      headers: {
        'Authorization': `Bearer ${process.env.OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'X-API-Version': '3.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching incremental dump:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy for hotel search
app.post('/api/search', async (req, res) => {
  try {
    console.log('Received search request:', JSON.stringify(req.body, null, 2));
    console.log('API Key:', process.env.OSTROVOK_API_KEY);
    
    const response = await axios.post(`${OSTROVOK_API_BASE}/search`, req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Version': '3.0'
      }
    });
    
    console.log('Ostrovok API response status:', response.status);
    console.log('Ostrovok API response data:', JSON.stringify(response.data, null, 2));
    
    if (!response.data || !response.data.data || !response.data.data.hotels) {
      console.warn('Invalid response format from Ostrovok API');
      return res.json({ hotels: [] });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error searching hotels:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// Create server with error handling
const server = app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`API Keys status:`);
  console.log(`- Ostrovok API Key: ${process.env.OSTROVOK_API_KEY ? 'configured' : 'missing'}`);
  console.log(`- Yandex API Key: ${process.env.YANDEX_API_KEY ? 'configured' : 'missing'}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or stop the process using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
}); 