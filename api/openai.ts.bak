import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `Ты — TripGen AI, эксперт по путешествиям по всему миру с особой экспертизой в России.

Правила:
1. Помогай с любыми направлениями — от Парижа до Токио, но особо хорошо знаешь Россию
2. Отвечай на русском, используй markdown и эмодзи
3. Для отелей добавляй кнопку: [🛎️ Забронировать](https://ostrovok.ru/hotel/название/)
4. Будь дружелюбным и полезным`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages required' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;
    
    if (!openRouterKey && !openAIKey) {
      return res.status(500).json({ error: 'No API key configured' });
    }

    const useOpenRouter = !!openRouterKey;
    const apiKey = useOpenRouter ? openRouterKey : openAIKey;
    const url = useOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    const model = useOpenRouter ? 'openai/gpt-4o-mini' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

    // Format messages
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-5).map((m: any) => ({
        role: m.role || 'user',
        content: m.text || m.content || ''
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(useOpenRouter && {
          'HTTP-Referer': 'https://tripgen.ru',
          'X-Title': 'TripGen'
        })
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'API request failed',
        details: errorText 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Извините, произошла ошибка.';

    return res.status(200).json({
      response: content,
      provider: useOpenRouter ? 'openrouter' : 'openai'
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
}
