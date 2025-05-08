import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import { Readable } from 'stream';

dotenv.config();

const router = express.Router();

// Enable CORS
router.use(cors());
router.use(express.json());

// Middleware для проверки наличия необходимых переменных окружения
const checkEnvVariables = (req, res, next) => {
  const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
  
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    console.error('Missing environment variables:', { 
      hasApiKey: !!YANDEX_API_KEY, 
      hasFolderId: !!YANDEX_FOLDER_ID 
    });
    return res.status(500).json({
      error: 'Отсутствуют необходимые переменные окружения'
    });
  }
  next();
};

router.post('/yandex-gpt', checkEnvVariables, async (req, res) => {
  try {
    const requestBody = req.body;
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));

    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      return res.status(400).json({
        error: 'Неверный формат запроса. Ожидается массив сообщений.'
      });
    }

    // Настраиваем потоковый ответ
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Отправляем начальное событие
    res.write('data: {"type": "start"}\n\n');

    // Проверяем наличие необходимых полей
    const apiRequestBody = {
      modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt/latest`,
      completionOptions: {
        stream: true,
        temperature: 0.7,
        maxTokens: 2000,
        partialResults: true,
      },
      messages: requestBody.messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }))
    };

    console.log('Sending request to Yandex API:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': process.env.YANDEX_FOLDER_ID,
      },
      body: JSON.stringify(apiRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yandex GPT API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      res.write(`data: {"type": "error", "error": "Ошибка API: ${response.status}"}\n\n`);
      res.end();
      return;
    }

    const stream = Readable.from(response.body);
    let buffer = '';
    let lastSentText = '';

    stream.on('data', chunk => {
      try {
        const newData = chunk.toString();
        buffer += newData;

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line) {
            try {
              const data = JSON.parse(line);
              if (data.result?.alternatives?.[0]?.message?.text) {
                const text = data.result.alternatives[0].message.text;
                if (text !== lastSentText) {
                  res.write(`data: {"type": "chunk", "text": ${JSON.stringify(text)}}\n\n`);
                  lastSentText = text;
                }
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error processing chunk:', error);
        res.write(`data: {"type": "error", "error": "Ошибка обработки данных"}\n\n`);
      }
    });

    stream.on('end', () => {
      try {
        if (buffer.trim()) {
          const data = JSON.parse(buffer);
          if (data.result?.alternatives?.[0]?.message?.text) {
            const text = data.result.alternatives[0].message.text;
            if (text !== lastSentText) {
              res.write(`data: {"type": "chunk", "text": ${JSON.stringify(text)}}\n\n`);
            }
          }
        }
        res.write('data: {"type": "end"}\n\n');
      } catch (error) {
        console.error('Error processing final chunk:', error);
        res.write(`data: {"type": "error", "error": "Ошибка обработки финальных данных"}\n\n`);
      } finally {
        res.end();
      }
    });

    stream.on('error', error => {
      console.error('Stream error:', error);
      res.write(`data: {"type": "error", "error": "Ошибка потока данных"}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error in /yandex-gpt route:', error);
    res.write(`data: {"type": "error", "error": "Внутренняя ошибка сервера"}\n\n`);
    res.end();
  }
});

export default router;