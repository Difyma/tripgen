import { createClient, Session, AuthError as SupabaseAuthError, type SupabaseClient } from '@supabase/supabase-js';

// Read from Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const parsedAuthTimeout = Number(import.meta.env.VITE_SUPABASE_AUTH_TIMEOUT_MS || 2500);
const SUPABASE_AUTH_TIMEOUT_MS = Number.isFinite(parsedAuthTimeout)
  ? Math.min(Math.max(parsedAuthTimeout, 500), 10000)
  : 2500;

// Check if we're in production
const isProduction = import.meta.env.PROD;

const createMockSupabase = (): SupabaseClient => {
  console.warn(
    'Supabase environment variables are missing. Falling back to a mock client so the UI can render.'
  );
  
  // In production, throw error instead of mock
  if (isProduction) {
    throw new Error(
      'Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }

  const mockResponse = {
    select: () => mockResponse,
    eq: () => mockResponse,
    single: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    upsert: async () => ({ data: null, error: null })
  };

  return {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase is not configured')
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase is not configured')
      }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (_callback: (event: any, session: any) => void) => ({
        data: { subscription: { unsubscribe: () => undefined } }
      })
    },
    from: () => mockResponse
  } as unknown as SupabaseClient;
};

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SUPABASE_AUTH_TIMEOUT_MS);
  const signal = init.signal;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

export const supabase: SupabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Avoid reusing stale sessions created by older deployments with the default sb-* key.
        storageKey: 'tripgen-auth',
      },
      global: {
        fetch: fetchWithTimeout,
      },
    })
  : createMockSupabase();

export const getSafeAuthSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Auth] Supabase session unavailable, continuing anonymously:', error.message);
      return null;
    }
    return session;
  } catch (error) {
    console.warn('[Auth] Supabase session request failed, continuing anonymously:', error);
    return null;
  }
};

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  session: Session | null;
  error: SupabaseAuthError | null;
  message: string;
  needsEmailConfirmation: boolean;
}

// Helper function to ensure profile exists
const ensureProfileExists = async (userId: string, email: string): Promise<Error | null> => {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return new Error('Ошибка при проверке профиля');
    }

    if (existingProfile) {
      return null; // Profile already exists
    }

    // If no profile exists, create one with minimal fields
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      // Если профиль уже существует (конфликт), это не ошибка
      if (insertError.code === '23505') { // код ошибки уникального ограничения
        return null;
      }
      return new Error(insertError.message);
    }
    return null;
  } catch (error: any) {
    console.error('Exception ensuring profile exists:', error);
    return error instanceof Error ? error : new Error('Unknown error ensuring profile exists');
  }
};

// Auth helper functions
export const auth = {
  // Отправка OTP кода на email через Supabase
  sendOTP: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Auth] Sending OTP via Supabase to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        console.error('[Auth] Supabase error:', error);
        if (error.message.includes('rate limit')) {
          throw new Error('Слишком много попыток. Подождите 1 минуту перед следующей отправкой.');
        }
        throw new Error('Не удалось отправить код. Попробуйте позже.');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Auth] Error:', error);
      return { success: false, error: error.message || 'Не удалось отправить код' };
    }
  },

  // Проверка OTP кода через Supabase
  verifyOTP: async (email: string, token: string): Promise<AuthResponse> => {
    try {
      console.log('[Auth] Verifying OTP for:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      console.log('[Auth] Verify result:', { hasSession: !!data.session, error: error?.message });

      if (error) {
        console.error('[Auth] Verify error:', error);
        if (error.message.includes('Invalid token') || error.message.includes('Token has expired')) {
          throw new Error('Неверный или устаревший код. Запросите новый.');
        }
        throw new Error('Ошибка проверки кода. Попробуйте снова.');
      }

      if (!data.session) {
        throw new Error('Не удалось войти. Попробуйте снова.');
      }

      // Ensure profile exists (в фоне, не блокируем)
      ensureProfileExists(data.user!.id, email).catch(console.error);

      return { 
        session: data.session, 
        error: null, 
        message: 'Авторизация успешна!', 
        needsEmailConfirmation: false 
      };
    } catch (error: any) {
      throw error;
    }
  },

  // Legacy method - kept for compatibility
  signInOrSignUp: async (_email: string, _password: string): Promise<AuthResponse> => {
    // Placeholder - use sendOTP and verifyOTP instead
    throw new Error('Use sendOTP and verifyOTP instead');
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    return getSafeAuthSession();
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Типы для чата
export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  role?: 'system' | 'user' | 'assistant';
  showCreateRoute?: boolean;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// Функции для работы с историей чатов
export const saveChatHistory = async (messages: ChatMessage[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated, chat history will not be saved');
    return;
  }

  try {
    const { data: existingChat, error: fetchError } = await supabase
      .from('chat_history')
      .select()
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = не найдено
      throw fetchError;
    }

    if (existingChat) {
      // Обновляем существующую историю
      const { error: updateError } = await supabase
        .from('chat_history')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('id', existingChat.id);

      if (updateError) throw updateError;
    } else {
      // Создаем новую запись
      const { error: insertError } = await supabase
        .from('chat_history')
        .insert([{ 
          user_id: user.id,
          messages
        }]);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

export const loadChatHistory = async (): Promise<ChatMessage[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated, no chat history to load');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select()
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Не найдено
        return [];
      }
      throw error;
    }

    return data.messages;
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
};

// ============================================
// НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С НЕСКОЛЬКИМИ ЧАТАМИ
// ============================================

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  /** Чат с организатором тура (WebSocket), не строка в Supabase */
  isCreatorChat?: boolean;
  creatorChatId?: string;
  unread_count?: number;
}

export interface ChatMessageDB {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// Получить список чатов пользователя
export const getUserChats = async (): Promise<Chat[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated');
    return [];
  }

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }

  return data || [];
};

// Создать новый чат
export const createChat = async (title: string = 'Новый чат'): Promise<Chat | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('chats')
    .insert([{ user_id: user.id, title }])
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }

  return data;
};

// Получить сообщения чата
export const getChatMessages = async (chatId: string): Promise<ChatMessageDB[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated');
    return [];
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data || [];
};

// Добавить сообщение в чат
export const addChatMessage = async (
  chatId: string, 
  role: 'user' | 'assistant' | 'system', 
  content: string
): Promise<void> => {
  const { error } = await supabase
    .from('chat_messages')
    .insert([{ chat_id: chatId, role, content }]);

  if (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }

  // Обновляем updated_at у чата
  await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId);
};

// Удалить чат
export const deleteChat = async (chatId: string): Promise<void> => {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Обновить название чата
export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId);

  if (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};

// Генерация короткого названия чата по первому сообщению (в стиле ChatGPT)
const MAX_TITLE_WORDS = 6;

export const generateChatTitle = (message: string): string => {
  const trimmed = message.trim();
  if (!trimmed) return 'Новый чат';
  const words = trimmed.split(/\s+/).filter(Boolean);
  const short = words.slice(0, MAX_TITLE_WORDS).join(' ');
  return words.length > MAX_TITLE_WORDS ? `${short}…` : short;
};
