import express, { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Enable CORS with specific options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tripgen.vercel.app', 'https://ai-travel.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

router.use(cors(corsOptions));
router.use(express.json());

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Server is working!',
    env: process.env.NODE_ENV,
    hasYandexKey: !!process.env.YANDEX_API_KEY,
    hasYandexFolder: !!process.env.YANDEX_FOLDER_ID
  });
});

interface Message {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

interface RequestBody {
  messages: Array<{
    role: string;
    text: string;
  }>;
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

// Middleware для проверки наличия необходимых переменных окружения
const checkEnvVariables = (req: Request, res: Response, next: NextFunction): void => {
  const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    YANDEX_API_KEY: YANDEX_API_KEY ? '***' : undefined,
    YANDEX_FOLDER_ID: YANDEX_FOLDER_ID || undefined,
    REQUEST_URL: req.url,
    REQUEST_METHOD: req.method,
    HEADERS: req.headers
  });
  
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    console.error('Missing required environment variables');
    res.status(500).json({ 
      error: 'Отсутствуют необходимые переменные окружения',
      details: {
        hasApiKey: !!YANDEX_API_KEY,
        hasFolderId: !!YANDEX_FOLDER_ID
      }
    });
    return;
  }
  next();
};

router.post('/yandex-gpt', checkEnvVariables, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== Starting GPT request processing ===');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      hasYandexKey: !!process.env.YANDEX_API_KEY,
      hasYandexFolder: !!process.env.YANDEX_FOLDER_ID,
      corsOrigin: corsOptions.origin
    });
    console.log('Request headers:', {
      ...req.headers,
      authorization: req.headers.authorization ? '***' : undefined
    });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const requestBody = req.body as RequestBody;
    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      res.status(400).json({ 
        error: 'Неверный формат запроса',
        details: 'Ожидается массив сообщений в формате { messages: [...] }' 
      });
      return;
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
      res.status(400).json({
        error: 'Неверный формат сообщений',
        details: 'Каждое сообщение должно содержать text и role (system/user/assistant)'
      });
      return;
    }

    const apiRequestBody = {
      modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
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
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': process.env.YANDEX_FOLDER_ID as string,
      },
      body: JSON.stringify(apiRequestBody)
    });

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw response:', responseText);
    } catch (error) {
      console.error('Error reading response:', error);
      res.status(500).json({ 
        error: 'Ошибка при чтении ответа от API',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }

    if (!response.ok) {
      console.error('Yandex GPT API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      res.status(response.status).json({ 
        error: 'Ошибка при обращении к Yandex GPT API',
        details: responseText
      });
      return;
    }

    let data: YandexGPTResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      res.status(500).json({ 
        error: 'Ошибка при разборе ответа от API',
        details: 'Invalid JSON response'
      });
      return;
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
      res.status(500).json({ 
        error: 'Пустой ответ от сервера',
        details: 'Ответ получен, но текст отсутствует'
      });
      return;
    }

    console.log('Successfully processed GPT request');
    res.json({ text });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 