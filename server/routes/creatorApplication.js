import { Router } from 'express';
import axios from 'axios';

const router = Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Все заявки креаторов шлём в фиксированный канал
const TELEGRAM_CHAT_ID = '-5155824311';

const sendTelegramMessage = async (text) => {
  const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text
  });
  
  if (!response.data.ok) {
    throw new Error(response.data.description || 'Telegram API error');
  }
};

// Добавляем обработчик для корневого маршрута
router.post('/', async (req, res) => {
  console.log('[CreatorApplication] Received POST request');
  console.log('[CreatorApplication] Headers:', req.headers);
  console.log('[CreatorApplication] Body:', req.body);

  try {
    const data = req.body;

    if (!data || !data.fullName) {
      console.error('[CreatorApplication] Invalid request data:', data);
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        error: 'Required fields are missing'
      });
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('[CreatorApplication] Telegram credentials missing');
      throw new Error('Telegram credentials are not configured');
    }

    // Отправляем несколько сообщений вместо одного большого
    await sendTelegramMessage('🎉 Новая заявка на роль креатора!');
    
    await sendTelegramMessage(
      `👤 Личная информация:\n` +
      `• Имя: ${data.fullName}\n` +
      `• Email: ${data.email}\n` +
      `• Телефон: ${data.phone}`
    );

    await sendTelegramMessage(
      `📱 Социальные сети:\n` +
      `• Instagram: ${data.instagram || 'Не указан'}\n` +
      `• Telegram: ${data.telegram || 'Не указан'}\n` +
      `• YouTube: ${data.youtube || 'Не указан'}`
    );

    await sendTelegramMessage(`📝 О себе:\n${data.bio}`);
    
    await sendTelegramMessage(`✈️ Опыт путешествий:\n${data.experience}`);
    
    await sendTelegramMessage(`💫 Почему хочет стать креатором:\n${data.expectations}`);

    console.log('[CreatorApplication] Successfully sent to Telegram');
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('[CreatorApplication] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// Добавляем обработчик для проверки маршрута
router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Creator application endpoint is working' });
});

export default router; 