import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

const sendTelegramMessage = async (text: string) => {
  const response = await axios.post<TelegramResponse>(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text
  });
  
  if (!response.data.ok) {
    throw new Error(response.data.description || 'Telegram API error');
  }
};

interface CreatorApplicationData {
  fullName: string;
  email: string;
  phone: string;
  instagram?: string;
  telegram?: string;
  youtube?: string;
  bio: string;
  experience: string;
  expectations: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as CreatorApplicationData;

    if (!data || !data.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        error: 'Required fields are missing'
      });
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
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

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    console.error('[CreatorApplication] Error:', error);

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
} 