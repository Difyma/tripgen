import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

dotenv.config();

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
router.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Middleware для проверки наличия необходимых переменных окружения
const checkEnvVariables = (req, res, next) => {
  const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    console.error('Missing environment variables:', {
      hasApiKey: !!YANDEX_API_KEY,
      hasFolderId: !!YANDEX_FOLDER_ID
    });
    return res.status(500).json({ error: 'Отсутствуют необходимые переменные окружения' });
  }
  next();
};

router.post('/yandex-gpt', checkEnvVariables, async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const requestBody = req.body;
    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      return res.status(400).json({ error: 'Неверный формат запроса. Ожидается массив сообщений.' });
    }

    const apiRequestBody = {
      modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.7,
        maxTokens: 2000,
        partialResults: false,
      },
      messages: requestBody.messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }))
    };

    console.log('Sending request to Yandex GPT:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': process.env.YANDEX_FOLDER_ID,
      },
      body: JSON.stringify(apiRequestBody)
    });

    console.log('Yandex GPT response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Yandex GPT error response:', errorData);
      return res.status(response.status).json({ 
        error: 'Ошибка при обращении к Yandex GPT API',
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Yandex GPT response data:', JSON.stringify(data, null, 2));

    if (!data.result?.alternatives?.[0]?.message?.text) {
      console.error('Invalid response format from Yandex GPT:', data);
      return res.status(500).json({ 
        error: 'Некорректный формат ответа от Yandex GPT',
        details: data
      });
    }

    const text = data.result.alternatives[0].message.text;
    res.json({ text });
  } catch (error) {
    console.error('Error in /yandex-gpt route:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

export default router;