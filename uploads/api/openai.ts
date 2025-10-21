export const config = {
  runtime: 'edge'
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  try {
    console.log('=== Starting OpenAI request processing ===');
    
    const { OPENAI_API_KEY } = process.env;
    
    if (!OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return new Response(
        JSON.stringify({ 
          error: 'Отсутствует API ключ OpenAI',
          details: 'OpenAI API key is not configured'
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

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('Invalid request format:', requestBody);
      return new Response(
        JSON.stringify({ 
          error: 'Неверный формат запроса',
          details: 'Ожидается массив сообщений в формате { messages: [...] }' 
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
      return new Response(
        JSON.stringify({
          error: 'Неверный формат сообщений',
          details: 'Каждое сообщение должно содержать text и role (system/user/assistant)'
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

    // Преобразуем сообщения в формат OpenAI
    const openaiMessages: OpenAIMessage[] = requestBody.messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.text
    }));

    // Добавляем контекст о планировании маршрутов
    const systemMessage = openaiMessages.find(msg => msg.role === 'system');
    if (systemMessage) {
      systemMessage.content += `

ОСОБЫЕ ИНСТРУКЦИИ ДЛЯ ПЛАНИРОВАНИЯ МАРШРУТОВ:

Когда пользователь просит спланировать маршрут (например, "хочу поехать в Японию, спланируй мне маршрут"), следуй этим правилам:

1. ВСЕГДА создавай маршрут на 7 дней, если не указано иначе
2. Структурируй ответ по дням с подробным расписанием
3. Включай время для каждой активности
4. Добавляй рекомендации по отелям, ресторанам и достопримечательностям
5. Учитывай логистику и время на переезды
6. Предлагай альтернативные варианты для разных бюджетов

Формат ответа для маршрута:
# 🗾 Маршрут по [Страна/Город] на 7 дней

## 📅 День 1: Прибытие и знакомство
**Утро (09:00-12:00)**
- 09:00-10:00 ✈️ Прибытие в аэропорт
- 10:00-11:00 🚌 Трансфер в отель
- 11:00-12:00 🏨 Заселение и отдых

**День (12:00-17:00)**
- 12:00-13:30 🍽️ Обед в [ресторан]
- 14:00-16:30 🎯 [Достопримечательность]
- 16:30-17:00 ☕ Кофе-брейк

**Вечер (17:00-22:00)**
- 17:00-19:00 🌸 [Вечерняя активность]
- 19:30-21:00 🍜 Ужин в [ресторан]
- 21:00-22:00 🌃 Прогулка

И так далее для всех 7 дней.

💡 **Полезные советы:**
💰 **Бюджет:**
🏨 **Где остановиться:**
🍽️ **Где поесть:**
🎯 **Что посмотреть:**`;
    }

    const apiRequestBody = {
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 3000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    console.log('Sending request to OpenAI API');
    console.log('Request body:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody)
    });

    console.log('OpenAI API response status:', response.status);

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw response text length:', responseText.length);
      
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response from OpenAI API');
        return new Response(
          JSON.stringify({ 
            error: 'Empty response from OpenAI API',
            details: 'The API returned an empty response'
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

      // Try to parse the response text to validate JSON format
      try {
        const parsedResponse: OpenAIResponse = JSON.parse(responseText);
        console.log('Successfully parsed JSON response');
        
        if (!parsedResponse.choices?.[0]?.message?.content) {
          console.error('Invalid response structure:', parsedResponse);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid response structure from OpenAI API',
              details: 'The response does not contain the expected content field'
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

        return new Response(
          JSON.stringify({ text: parsedResponse.choices[0].message.content }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      } catch (parseError) {
        console.error('Invalid JSON in response:', parseError);
        console.error('Response text that failed to parse:', responseText);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON response from OpenAI API',
            details: 'The response could not be parsed as JSON'
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
    } catch (error) {
      console.error('Error reading response:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error reading response from API',
          details: error instanceof Error ? error.message : 'Unknown error'
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
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Unknown error'
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