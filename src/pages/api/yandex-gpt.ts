import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Добавляем проверку переменных окружения
  console.log('Environment variables check:', {
    hasApiKey: !!process.env.YANDEX_API_KEY,
    hasFolderId: !!process.env.YANDEX_FOLDER_ID,
    apiKeyLength: process.env.YANDEX_API_KEY?.length,
    folderId: process.env.YANDEX_FOLDER_ID
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Format messages for Yandex API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      text: msg.text || msg.content
    }));

    console.log('Sending to Yandex API:', JSON.stringify(formattedMessages, null, 2));

    // Make request to Yandex GPT API
    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'x-folder-id': process.env.YANDEX_FOLDER_ID || '',
      },
      body: JSON.stringify({
        modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 2000,
        },
        messages: formattedMessages
      }),
    });

    console.log('Yandex API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yandex API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Yandex API error',
        details: errorText || response.statusText
      });
    }

    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from Yandex API');
      return res.status(500).json({ 
        error: 'Empty response from Yandex API',
        details: 'The API returned an empty response'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Yandex API response:', e);
      return res.status(500).json({ 
        error: 'Invalid response from Yandex API',
        details: responseText
      });
    }

    if (!data.result?.alternatives?.[0]?.message?.text) {
      console.error('Invalid response structure:', data);
      return res.status(500).json({ 
        error: 'Invalid response structure from Yandex API',
        details: data
      });
    }

    return res.status(200).json({
      text: data.result.alternatives[0].message.text,
      hotels: context?.hotels || [],
    });
  } catch (error) {
    console.error('Error in Yandex GPT API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 