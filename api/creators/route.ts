import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const data = await request.json() as CreatorApplicationData;

    if (!data || !data.fullName) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          error: 'Required fields are missing'
        },
        { status: 400 }
      );
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

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });
  } catch (error: any) {
    console.error('[CreatorApplication] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit application',
        error: error.message
      },
      { status: 500 }
    );
  }
} 