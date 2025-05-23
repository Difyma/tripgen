export const config = {
  runtime: 'edge'
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  text: string;
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
    console.log('=== Starting GPT request processing ===');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      hasYandexKey: !!process.env.YANDEX_API_KEY,
      hasYandexFolder: !!process.env.YANDEX_FOLDER_ID
    });

    const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
    
    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Отсутствуют необходимые переменные окружения',
          details: {
            hasApiKey: !!YANDEX_API_KEY,
            hasFolderId: !!YANDEX_FOLDER_ID
          }
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

    const apiRequestBody = {
      modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
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

    console.log('Sending request to Yandex GPT API');
    console.log('Request URL:', 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion');
    console.log('Request body:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': YANDEX_FOLDER_ID,
      },
      body: JSON.stringify(apiRequestBody)
    });

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw response:', responseText);
    } catch (error) {
      console.error('Error reading response:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка при чтении ответа от API',
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

    if (!response.ok) {
      console.error('Yandex GPT API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка при обращении к Yandex GPT API',
          details: responseText
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    let data: YandexGPTResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка при разборе ответа от API',
          details: 'Invalid JSON response'
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

    console.log('Yandex GPT response received:', {
      status: 'success',
      hasResult: !!data.result,
      hasAlternatives: !!data.result?.alternatives?.length,
      response: data
    });
    
    const text = data.result?.alternatives?.[0]?.message?.text;
    
    if (!text) {
      console.error('Empty response from Yandex GPT:', {
        data,
        error: 'No text in response'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Пустой ответ от сервера',
          details: 'Ответ получен, но текст отсутствует'
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

    console.log('Successfully processed GPT request');
    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

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