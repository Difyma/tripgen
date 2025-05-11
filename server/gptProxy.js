import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

dotenv.config();

const router = express.Router();

// Enable CORS
router.use(cors());
router.use(express.json());

// Middleware для проверки наличия необходимых переменных окружения
const checkEnvVariables = (req, res, next) => {
  const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    return res.status(500).json({ error: 'Отсутствуют необходимые переменные окружения' });
  }
  next();
};

router.post('/yandex-gpt', checkEnvVariables, async (req, res) => {
  try {
    const requestBody = req.body;
    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      return res.status(400).json({ error: 'Неверный формат запроса. Ожидается массив сообщений.' });
    }

    const apiRequestBody = {
      modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt/latest`,
      completionOptions: {
        stream: false, // отключаем стриминг
        temperature: 0.7,
        maxTokens: 2000,
        partialResults: false,
      },
      messages: requestBody.messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }))
    };

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': process.env.YANDEX_FOLDER_ID,
      },
      body: JSON.stringify(apiRequestBody)
    });

    const data = await response.json();
    const text = data.result?.alternatives?.[0]?.message?.text || '';
    res.json({ text });
  } catch (error) {
    console.error('Error in /yandex-gpt route:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;