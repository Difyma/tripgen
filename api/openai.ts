import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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

  try {
    const { messages, filters } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ.';

    return res.status(200).json({
      response: responseMessage,
      model,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    return res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message,
    });
  }
}
