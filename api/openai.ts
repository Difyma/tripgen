import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { TRAVEL_JSON_SYSTEM_PROMPT } from '../src/prompts/travelJsonSystemPrompt';
import { parseTripPlanResponse } from '../src/lib/parseTripPlanResponse';
import { formatTripPlanToMarkdown } from '../src/lib/formatTripPlanToMarkdown';
import { mergeHotelRecommendationsWithSource } from '../src/lib/mergeHotelRecommendationsWithSource';
import type { SourceHotelForWhitelist } from '../src/types/tripPlan';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PARTNER_SLUG = process.env.OSTROVOK_PARTNER_SLUG || '270392.affiliate.a0bd';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function buildTestHotelUrl(checkIn: string, checkOut: string, guests: number): string {
  const toDMY = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  };
  const u = new URL('https://www.ostrovok.ru/rooms/test_hotel/');
  u.searchParams.set('utm_medium', 'partners');
  u.searchParams.set('partner_slug', PARTNER_SLUG);
  u.searchParams.set('utm_source', PARTNER_SLUG);
  u.searchParams.set('dates', `${toDMY(checkIn)}-${toDMY(checkOut)}`);
  u.searchParams.set('guests', String(guests));
  u.searchParams.set('cur', 'RUB');
  u.searchParams.set('lang', 'ru');
  return u.toString();
}

const SYSTEM_PROMPT = `Ты — опытный туристический ассистент и профессиональный travel-блогер.
Твоя задача — помогать пользователям планировать путешествия, предоставляя персонализированные рекомендации.

ВАЖНО: В твоём распоряжении есть актуальные данные об отелях из Ostrovok.ru с реальными ценами, фото и ссылками на бронирование.
Используй ТОЛЬКО эти данные при составлении рекомендаций по размещению. НЕ ПРИДУМЫВАЙ отели — используй только те, что в списке ниже.

ПРАВИЛА ОТВЕТОВ:
1. Используй ТОЛЬКО отели из предоставленного списка "Рекомендуемые отели"
2. Для каждого отеля ОБЯЗАТЕЛЬНО включи фото используя markdown: ![название отеля](URL_фото)
3. Добавь кнопку бронирования ТОЧНО в формате: [🛎️ Забронировать отель](URL_бронирования)
4. Укажи цену, звёздность, рейтинг и расстояние до центра
5. Добавь краткое описание отеля

⚠️ ВАЖНО: Используй ТОЛЬКО bookingUrl из предоставленных данных. Не придумывай ссылки.`;

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterCompletionResponse {
  choices?: OpenRouterChoice[];
}

interface HotelForApi {
  id: string;
  name: string;
  stars: number;
  rating?: number;
  address: string;
  price: number;
  currency: string;
  images?: { category: string; url: string }[];
  bookingUrl: string;
  distanceToCenter?: number;
}

function getDemoHotelsForVercel(
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number
): HotelForApi[] {
  const bookingUrl = buildTestHotelUrl(checkIn, checkOut, guests);
  return [
    {
      id: 'test_hotel',
      name: 'Test Hotel (тестовый отель)',
      stars: 4,
      rating: 8,
      address: `Тестовый отель, ${destination}`,
      price: 5000,
      currency: 'RUB',
      images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop' }],
      bookingUrl,
      distanceToCenter: 1000,
    },
    {
      id: 'demo_2',
      name: 'Отель для демо',
      stars: 3,
      rating: 7.5,
      address: `Демо-адрес, ${destination}`,
      price: 3500,
      currency: 'RUB',
      images: [{ category: 'exterior', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop' }],
      bookingUrl,
      distanceToCenter: 1500,
    },
  ];
}

function formatHotelsForPrompt(hotels: HotelForApi[]): string {
  if (hotels.length === 0) return '';
  let text = '\n\n# 🏨 Рекомендуемые отели (используй ТОЛЬКО эти отели)\n\n';
  hotels.forEach((hotel, index) => {
    const stars = '⭐'.repeat(hotel.stars);
    text += `### ${index + 1}. ${hotel.name} ${stars}\n\n`;
    if (hotel.images?.[0]) {
      text += `![${hotel.name}](${hotel.images[0].url})\n\n`;
    }
    text += `- **Адрес:** ${hotel.address}\n`;
    if (hotel.rating) text += `- **Рейтинг:** ${hotel.rating}/10\n`;
    text += `- **Цена:** от ${hotel.price.toLocaleString('ru-RU')} ${hotel.currency}\n`;
    if (hotel.distanceToCenter) {
      const km = hotel.distanceToCenter / 1000;
      text += `- **До центра:** ${km < 1 ? `${Math.round(hotel.distanceToCenter)} м` : `${km.toFixed(1)} км`}\n`;
    }
    text += `\n[🛎️ Забронировать ${hotel.name}](${hotel.bookingUrl})\n\n---\n\n`;
  });
  text += '\n⚠️ **ВАЖНО:** Используй ТОЛЬКО эти отели в своих рекомендациях.\n';
  return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({
      error: 'OpenRouter API key is not configured',
      message: 'Set OPENROUTER_API_KEY in Vercel environment variables',
    });
  }

  try {
    const body = req.body as {
      messages?: { role: string; text: string }[];
      filters?: Record<string, unknown>;
      stream?: boolean;
    };
    const messages = body?.messages ?? [];
    const filters = body?.filters as { destination?: string; dates?: { start?: string; end?: string }; budget?: { min?: number; max?: number }; travelers?: number } | undefined;
    const useStream = body?.stream === true;

    const destination = filters?.destination ?? 'Москва';
    const start = filters?.dates?.start ?? new Date().toISOString().split('T')[0];
    const end = filters?.dates?.end ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const travelers = filters?.travelers ?? 2;
    const budgetMin = filters?.budget?.min ?? 1000;
    const budgetMax = filters?.budget?.max ?? 100000;

    const hotels = getDemoHotelsForVercel(destination, start, end, travelers);
    const hotelsText = formatHotelsForPrompt(hotels);

    const conversationMessages = messages.map((msg) => ({
      role: msg.role || 'user',
      content: msg.text || '',
    }));

    const contextBlock = `Контекст путешествия:\n- Направление: ${destination}\n- Даты: с ${start} по ${end}\n- Бюджет: от ${budgetMin} до ${budgetMax} ₽\n- Путешественников: ${travelers}${hotelsText}`;
    const systemPromptForRequest = useStream ? SYSTEM_PROMPT : TRAVEL_JSON_SYSTEM_PROMPT;
    const systemContent = `${systemPromptForRequest}\n\n${contextBlock}`;

    if (useStream) {
      const streamHeaders = {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      };
      res.writeHead(200, streamHeaders);
      res.write(`data: ${JSON.stringify({ type: 'hotels', hotels })}\n\n`);

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemContent },
            ...conversationMessages,
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': req.headers.origin || 'https://vercel.app',
            'X-Title': 'AI Travel Assistant',
          },
          responseType: 'stream',
          timeout: 60000,
        }
      );

      (response.data as NodeJS.ReadableStream).pipe(res);
      return;
    }

    const response = await axios.post<OpenRouterCompletionResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          ...conversationMessages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.origin || 'https://vercel.app',
          'X-Title': 'AI Travel Assistant',
        },
        timeout: 25000,
      }
    );

    const assistantMessage = response.data.choices?.[0]?.message?.content;
    if (!assistantMessage) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(502).json({ error: 'Empty response from OpenRouter API' });
    }

    let textToSend: string;
    let itineraryToSend: import('../src/types/tripPlan').TripPlanDay[] | undefined;
    const parsed = parseTripPlanResponse(assistantMessage);
    if (parsed) {
      const sourceHotels: SourceHotelForWhitelist[] = hotels.map((h) => ({
        name: h.name,
        bookingUrl: h.bookingUrl,
        photoUrl: h.images?.[0]?.url,
        price: h.price,
        currency: h.currency,
        rating: h.rating,
        stars: h.stars,
        address: h.address,
        distanceToCenter: h.distanceToCenter,
      }));
      const merged = mergeHotelRecommendationsWithSource(parsed, sourceHotels);
      textToSend = formatTripPlanToMarkdown(merged);
      if (!textToSend) textToSend = assistantMessage;
      if (merged.itinerary?.length) itineraryToSend = merged.itinerary;
    } else {
      textToSend = assistantMessage;
    }

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({
      text: textToSend,
      hotels,
      ...(itineraryToSend && { itinerary: itineraryToSend }),
    });
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    console.error('[api/openai] Error:', err?.message, err?.response?.data);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({
      error: 'Internal server error',
      message: err?.message ?? 'Unknown error',
    });
  }
}
