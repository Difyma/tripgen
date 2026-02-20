import type { VercelRequest, VercelResponse } from '@vercel/node';

// System prompt for the AI
const SYSTEM_PROMPT = `Ты — TripGen AI, эксперт по путешествиям по России. Твоя задача — помогать пользователям планировать идеальные поездки.

Ты можешь:
1. Составлять маршруты по городам России
2. Рекомендовать отели (через систему бронирования)
3. Находить авиабилеты (через Aviasales API)
4. Предлагать достопримечательности
5. Давать советы по бюджету

Всегда отвечай на русском языке. Будь дружелюбным и полезным.

При составлении маршрутов учитывай:
- Бюджет пользователя
- Даты поездки
- Интересы и предпочтения
- Сезонность

Если пользователь хочет забронировать тур из готовых предложений — направь его к оформлению бронирования.`;

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
    
    console.log('Request received');
    console.log('OpenRouter key exists:', !!openRouterKey);
    console.log('OpenAI key exists:', !!openAIKey);
    console.log('Using:', useOpenRouter ? 'OpenRouter' : 'OpenAI');
    console.log('Raw messages:', JSON.stringify(messages));

    // Check if any API key is configured
    if (!openRouterKey && !openAIKey) {
      return res.status(500).json({
        error: 'API key is not configured',
        details: 'Please set OPENROUTER_API_KEY or OPENAI_API_KEY environment variable in Vercel dashboard',
      });
    }

    // Prepare messages - convert 'text' field to 'content' and filter out invalid messages
    const formattedMessages = messages
      .filter((msg: any) => msg && (msg.content || msg.text)) // Filter out messages without content
      .map((msg: any) => ({
        role: msg.role || 'user',
        content: msg.content || msg.text || '' // Use 'content' or 'text', never null
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
    console.error('API Error:', error);
    
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

    return res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message || 'Unknown error',
    });
  }
}
