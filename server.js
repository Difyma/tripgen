import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API Configuration
const YANDEX_GPT_API_URL = process.env.VITE_YANDEX_GPT_API_URL || 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;
const OSTROVOK_API_URL = process.env.VITE_OSTROVOK_API_URL || 'https://api.ostrovok.com/v1';
const OSTROVOK_API_KEY = process.env.VITE_OSTROVOK_API_TOKEN;

// Validate required environment variables
if (!YANDEX_API_KEY) {
  console.error('Error: YANDEX_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!YANDEX_FOLDER_ID) {
  console.error('Error: YANDEX_FOLDER_ID is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Yandex GPT API endpoint
app.post('/api/yandex-gpt', async (req, res) => {
  try {
    console.log('Making request to Yandex GPT API:', {
      url: YANDEX_GPT_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_API_KEY}`
      },
      body: req.body
    });

    const response = await fetch(YANDEX_GPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_API_KEY}`,
        'X-Folder-Id': YANDEX_FOLDER_ID
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yandex GPT API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Yandex GPT API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error calling Yandex GPT API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ostrovok API endpoints
app.get('/api/ostrovok/search', async (req, res) => {
  try {
    const response = await fetch(`${OSTROVOK_API_URL}/search`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: req.query
    });

    if (!response.ok) {
      throw new Error(`Ostrovok API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error calling Ostrovok API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ostrovok/hotel/:id', async (req, res) => {
  try {
    const response = await fetch(`${OSTROVOK_API_URL}/hotel/${req.params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ostrovok API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error calling Ostrovok API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hotel dump endpoints
app.get('/api/hotel/dump', async (req, res) => {
  try {
    const response = await fetch(`${OSTROVOK_API_URL}/hotel/dump`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ostrovok API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching hotel dump:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hotel/incremental-dump', async (req, res) => {
  try {
    const response = await fetch(`${OSTROVOK_API_URL}/hotel/incremental-dump`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSTROVOK_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ostrovok API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching incremental hotel dump:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    config: {
      yandexGptApiUrl: YANDEX_GPT_API_URL,
      ostrovokApiUrl: OSTROVOK_API_URL
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('API Configuration:');
  console.log('- Yandex GPT API URL:', YANDEX_GPT_API_URL);
  console.log('- Ostrovok API URL:', OSTROVOK_API_URL);
}); 