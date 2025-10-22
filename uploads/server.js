import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OSTROVOK_API_URL = process.env.VITE_OSTROVOK_API_URL || 'https://api.ostrovok.com/v1';
const OSTROVOK_API_KEY = process.env.VITE_OSTROVOK_API_TOKEN;

// Validate required environment variables
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI API endpoint
app.post('/api/openai', async (req, res) => {
  try {
    console.log('=== Starting OpenAI request processing ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
      console.error('Invalid request format:', req.body);
      return res.status(400).json({ 
        error: 'Неверный формат запроса',
        details: 'Ожидается массив сообщений в формате { messages: [...] }' 
      });
    }

    // Валидация формата сообщений
    const isValidMessage = (msg) => {
      return msg && 
        typeof msg === 'object' && 
        typeof msg.text === 'string' && 
        typeof msg.role === 'string' && 
        ['system', 'user', 'assistant'].includes(msg.role);
    };

    if (!req.body.messages.every(isValidMessage)) {
      console.error('Invalid message format in request');
      return res.status(400).json({
        error: 'Неверный формат сообщений',
        details: 'Каждое сообщение должно содержать text и role (system/user/assistant)'
      });
    }

    // Преобразуем сообщения в формат OpenAI
    const openaiMessages = req.body.messages.map(msg => ({
      role: msg.role,
      content: msg.text
    }));

    // Добавляем специальные инструкции для планирования маршрутов
    const systemMessage = openaiMessages.find(msg => msg.role === 'system');
    if (systemMessage) {
      systemMessage.content += `

ОСОБЫЕ ИНСТРУКЦИИ ДЛЯ ПЛАНИРОВАНИЯ МАРШРУТОВ:

Когда пользователь просит спланировать маршрут (например, "хочу поехать в Японию, спланируй мне маршрут"), следуй этим правилам:

1. ВСЕГДА создавай маршрут на 7 дней, если не указано иначе
2. Структурируй ответ по дням с подробным расписанием
3. Включай время для каждой активности
4. Добавляй рекомендации по отелям, ресторанам и достопримечательностям
5. Учитывай логистику и время на переезды
6. Предлагай альтернативные варианты для разных бюджетов

Формат ответа для маршрута:
# 🗾 Маршрут по [Страна/Город] на 7 дней

## 📅 День 1: Прибытие и знакомство
**Утро (09:00-12:00)**
- 09:00-10:00 ✈️ Прибытие в аэропорт
- 10:00-11:00 🚌 Трансфер в отель
- 11:00-12:00 🏨 Заселение и отдых

**День (12:00-17:00)**
- 12:00-13:30 🍽️ Обед в [ресторан]
- 14:00-16:30 🎯 [Достопримечательность]
- 16:30-17:00 ☕ Кофе-брейк

**Вечер (17:00-22:00)**
- 17:00-19:00 🌸 [Вечерняя активность]
- 19:30-21:00 🍜 Ужин в [ресторан]
- 21:00-22:00 🌃 Прогулка

И так далее для всех 7 дней.

💡 **Полезные советы:**
💰 **Бюджет:**
🏨 **Где остановиться:**
🍽️ **Где поесть:**
🎯 **Что посмотреть:**`;
    }

    const apiRequestBody = {
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 3000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    console.log('Sending request to OpenAI API');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody)
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response structure from OpenAI API');
    }

    res.json({ text: data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
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
      openaiConfigured: !!OPENAI_API_KEY,
      ostrovokApiUrl: OSTROVOK_API_URL
    }
  });
});

// Environment variables endpoint for debugging
app.get('/api/env', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    telegramToken: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
    telegramChatId: process.env.TELEGRAM_CHAT_ID ? 'configured' : 'missing'
  });
});

// Serve static files from dist directory
app.use(express.static('dist'));

// Serve index.html for all non-API routes (SPA routing)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Serve index.html for all other routes
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('API Configuration:');
  console.log('- OpenAI API configured:', !!OPENAI_API_KEY);
  console.log('- Ostrovok API URL:', OSTROVOK_API_URL);
});