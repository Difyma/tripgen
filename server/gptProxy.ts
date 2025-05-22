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
  origin: '*',
  methods: 'POST',
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions));
router.use(express.json());

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Server is working!' });
});

interface Message {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

interface RequestBody {
  messages: Message[];
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
  console.log('Environment variables check:', {
    YANDEX_API_KEY: YANDEX_API_KEY ? '***' : undefined,
    YANDEX_FOLDER_ID: YANDEX_FOLDER_ID || undefined
  });
  
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    console.error('Missing environment variables');
    res.status(500).json({ error: 'Отсутствуют необходимые переменные окружения' });
    return;
  }
  next();
};

router.post('/yandex-gpt', checkEnvVariables, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== Starting request processing ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const requestBody = req.body as RequestBody;
    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      res.status(400).json({ error: 'Неверный формат запроса. Ожидается массив сообщений.' });
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

    console.log('Sending request to Yandex GPT');
    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': process.env.YANDEX_FOLDER_ID as string,
      },
      body: JSON.stringify(apiRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Yandex GPT error:', errorData);
      res.status(response.status).json({ 
        error: 'Ошибка при обращении к Yandex GPT API',
        details: errorData
      });
      return;
    }

    const data = await response.json() as YandexGPTResponse;
    console.log('Yandex GPT response:', JSON.stringify(data, null, 2));
    
    const text = data.result?.alternatives?.[0]?.message?.text;
    
    if (!text) {
      console.error('Empty response from Yandex GPT:', data);
      res.status(500).json({ 
        error: 'Пустой ответ от сервера',
        details: data
      });
      return;
    }

    res.json({ text });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router; 