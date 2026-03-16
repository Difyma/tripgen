import { NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'edge';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Фиксируем канал для заявок креаторов
const TELEGRAM_CHAT_ID = '-5155824311';

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as CreatorApplicationData;

    if (!data || !data.fullName) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: 'Required fields are missing'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Telegram credentials are not configured');
    }

    // Одно большое сообщение с полной анкетой
    const text =
      '🎉 Новая заявка на роль креатора!\n\n' +
      '👤 Личная информация:\n' +
      `• Имя: ${data.fullName}\n` +
      `• Email: ${data.email}\n` +
      `• Телефон: ${data.phone}\n\n` +
      '📱 Социальные сети:\n' +
      `• Instagram: ${data.instagram || 'Не указан'}\n` +
      `• Telegram: ${data.telegram || 'Не указан'}\n` +
      `• YouTube: ${data.youtube || 'Не указан'}\n\n` +
      '📝 О себе:\n' +
      `${data.bio}\n\n` +
      '✈️ Опыт путешествий:\n' +
      `${data.experience}\n\n` +
      '💫 Почему хочет стать креатором:\n' +
      `${data.expectations}`;

    await sendTelegramMessage(text);

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Application submitted successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error: any) {
    console.error('[CreatorApplication] Error:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Failed to submit application',
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
} 