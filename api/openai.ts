import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Check which API to use
const useOpenRouter = process.env.USE_OPENROUTER === 'true' || !!process.env.OPENROUTER_API_KEY;

// Configure OpenAI client
// If using OpenRouter, we need to change the baseURL
const openai = new OpenAI({
  apiKey: useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: useOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
});

// Log environment status for debugging
console.log('Using OpenRouter:', useOpenRouter);
console.log('API Key exists:', useOpenRouter ? !!process.env.OPENROUTER_API_KEY : !!process.env.OPENAI_API_KEY);

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

  // Check if API key is configured
  const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const keyName = useOpenRouter ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY';
    console.error(`${keyName} is not set`);
    return res.status(500).json({
      error: 'API key is not configured',
      details: `Please set ${keyName} environment variable in Vercel dashboard`,
    });
  }

  try {
    const { messages, filters } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Use different model names for OpenRouter
    let model: string;
    if (useOpenRouter) {
      // OpenRouter uses different model identifiers
      const modelMap: Record<string, string> = {
        'gpt-4o-mini': 'openai/gpt-4o-mini',
        'gpt-4o': 'openai/gpt-4o',
        'gpt-4': 'openai/gpt-4',
        'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      };
      model = modelMap[process.env.OPENAI_MODEL || ''] || 'openai/gpt-4o-mini';
    } else {
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }
    
    console.log('Using provider:', useOpenRouter ? 'OpenRouter' : 'OpenAI');
    console.log('Using model:', model);
    console.log('Messages count:', messages.length);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
      // OpenRouter specific headers
      ...(useOpenRouter && {
        headers: {
          'HTTP-Referer': 'https://tripgen.ru',
          'X-Title': 'TripGen',
        },
      }),
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ.';

    return res.status(200).json({
      response: responseMessage,
      model,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle specific errors
    if (error.status === 401) {
      return res.status(500).json({
        error: 'Authentication failed',
        details: `Invalid ${useOpenRouter ? 'OpenRouter' : 'OpenAI'} API key. Please check your environment variable.`,
      });
    }
    
    if (error.status === 429) {
      return res.status(500).json({
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again later.',
      });
    }

    return res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message,
    });
  }
}
