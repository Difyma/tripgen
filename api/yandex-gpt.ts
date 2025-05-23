import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

interface Message {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

interface YandexGPTResponse {
  result: {
    alternatives: Array<{
      message: {
        role: string;
        text: string;
      };
      status: string;
    }>;
    usage: {
      inputTextTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    modelVersion: string;
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    console.log('=== Starting GPT request processing ===');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      hasYandexKey: !!process.env.YANDEX_API_KEY,
      hasYandexFolder: !!process.env.YANDEX_FOLDER_ID
    });

    const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
    
    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      console.error('Missing required environment variables');
      return res.status(500).json({ 
        error: 'Отсутствуют необходимые переменные окружения',
        details: {
          hasApiKey: !!YANDEX_API_KEY,
          hasFolderId: !!YANDEX_FOLDER_ID
        }
      });
    }

    const requestBody = req.body;
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      return res.status(400).json({ 
        error: 'Неверный формат запроса',
        details: 'Ожидается массив сообщений в формате { messages: [...] }' 
      });
    }

    // Валидация формата сообщений
    const isValidMessage = (msg: any): boolean => {
      return msg && 
        typeof msg === 'object' && 
        typeof msg.text === 'string' && 
        typeof msg.role === 'string' && 
        ['system', 'user', 'assistant'].includes(msg.role);
    };

    if (!requestBody.messages.every(isValidMessage)) {
      console.error('Invalid message format in request');
      return res.status(400).json({
        error: 'Неверный формат сообщений',
        details: 'Каждое сообщение должно содержать text и role (system/user/assistant)'
      });
    }

    const apiRequestBody = {
      modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
      completionOptions: {
        stream: false,
        temperature: 0.6,
        maxTokens: 2000,
      },
      messages: requestBody.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        text: msg.text
      }))
    };

    console.log('Sending request to Yandex GPT API');
    console.log('Request URL:', 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion');
    console.log('Request body:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': YANDEX_FOLDER_ID,
      },
      body: JSON.stringify(apiRequestBody)
    });

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw response:', responseText);
    } catch (error) {
      console.error('Error reading response:', error);
      return res.status(500).json({ 
        error: 'Ошибка при чтении ответа от API',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (!response.ok) {
      console.error('Yandex GPT API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      return res.status(response.status).json({ 
        error: 'Ошибка при обращении к Yandex GPT API',
        details: responseText
      });
    }

    let data: YandexGPTResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).json({ 
        error: 'Ошибка при разборе ответа от API',
        details: 'Invalid JSON response'
      });
    }

    console.log('Yandex GPT response received:', {
      status: 'success',
      hasResult: !!data.result,
      hasAlternatives: !!data.result?.alternatives?.length,
      response: data
    });
    
    const text = data.result?.alternatives?.[0]?.message?.text;
    
    if (!text) {
      console.error('Empty response from Yandex GPT:', {
        data,
        error: 'No text in response'
      });
      return res.status(500).json({ 
        error: 'Пустой ответ от сервера',
        details: 'Ответ получен, но текст отсутствует'
      });
    }

    console.log('Successfully processed GPT request');
    return res.status(200).json({ text });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 