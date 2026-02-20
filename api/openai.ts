import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `Ты — TripGen AI, эксперт по путешествиям по России.

Правила:
1. Отвечай на русском языке
2. Используй markdown и эмодзи
3. Для отелей добавляй кнопку: [🛎️ Забронировать](https://ostrovok.ru/hotel/название/)
4. Структурируй ответ с заголовками

Пример:
### 🏨 Отель "Алтай" ⭐⭐⭐⭐
- Описание: уютный отель у реки
- Цена: от 3500₽/ночь
[🛎️ Забронировать](https://ostrovok.ru/hotel/altai/)

// Simple fetch-based implementation for OpenRouter
async function callOpenRouter(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://tripgen.ru',
      'X-Title': 'TripGen',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Simple fetch-based implementation for OpenAI
async function callOpenAI(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${error}`);
  }

  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Determine which API to use
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;
    
    const useOpenRouter = !!openRouterKey;
    
    console.log('Request received, using:', useOpenRouter ? 'OpenRouter' : 'OpenAI');

    // Check if any API key is configured
    if (!openRouterKey && !openAIKey) {
      return res.status(500).json({
        error: 'API key is not configured',
        details: 'Please set OPENROUTER_API_KEY or OPENAI_API_KEY environment variable in Vercel dashboard',
      });
    }

    // Prepare messages - convert 'text' field to 'content' and filter out invalid messages
    // Limit to last 10 messages to avoid token limits
    const recentMessages = messages.slice(-10);
    const formattedMessages = recentMessages
      .filter((msg: any) => msg && (msg.content || msg.text))
      .map((msg: any) => ({
        role: msg.role || 'user',
        content: (msg.content || msg.text || '').slice(0, 1000) // Limit each message to 1000 chars
      }));

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formattedMessages
    ];

    // Model selection
    const requestedModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    let model: string;
    
    if (useOpenRouter) {
      // Map OpenAI model names to OpenRouter format
      const modelMap: Record<string, string> = {
        'gpt-4o-mini': 'openai/gpt-4o-mini',
        'gpt-4o': 'openai/gpt-4o',
        'gpt-4': 'openai/gpt-4',
        'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      };
      model = modelMap[requestedModel] || 'openai/gpt-4o-mini';
    } else {
      model = requestedModel;
    }

    console.log('Model:', model);

    // Call appropriate API
    let completion;
    if (useOpenRouter) {
      completion = await callOpenRouter(openRouterKey, model, fullMessages);
    } else {
      completion = await callOpenAI(openAIKey!, model, fullMessages);
    }

    const responseMessage = completion.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ.';

    return res.status(200).json({
      response: responseMessage,
      model,
      provider: useOpenRouter ? 'openrouter' : 'openai',
    });

  } catch (error: any) {
    console.error('API Error:', error.message || error);
    
    // Handle specific errors
    if (error.message?.includes('401')) {
      return res.status(500).json({
        error: 'Authentication failed',
        details: 'Invalid API key. Please check your environment variable.',
      });
    }
    
    if (error.message?.includes('429')) {
      return res.status(500).json({
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again later.',
      });
    }

    // Return proper JSON even on error
    return res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message || 'Unknown server error',
    });
  }
}
