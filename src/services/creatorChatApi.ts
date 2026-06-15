import { getSafeAuthSession } from '../lib/supabase';
import { io, Socket } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const SOCKET_URL = (import.meta.env.VITE_CREATOR_CHAT_SOCKET_URL || API_URL).replace(/\/$/, '');
const CREATOR_CHAT_WS_ENABLED = import.meta.env.VITE_CREATOR_CHAT_WS_ENABLED === 'true';
const withApiBase = (path: string): string => `${API_URL}${path}`;

export interface Creator {
  id: string;
  full_name: string | null;
  email: string;
  bio: string | null;
  created_at: string;
}

export interface Chat {
  chat_id: string;
  creator_id: string;
  client_id: string;
  tourTitle?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string | null;
  created_at: string;
  unread_count: number;
  isCreator: boolean;
  otherId: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'creator' | 'client';
  content: string;
  is_read: boolean;
  created_at: string;
}

// WebSocket socket instance. Disabled by default on production because static/serverless
// deployments do not serve Socket.IO upgrade requests.
let socket: Socket | null = null;
let messageCallbacks: ((message: Message) => void)[] = [];
let unreadCallbacks: ((count: number) => void)[] = [];

async function getAuthHeaders(hasBody = false): Promise<HeadersInit> {
  const session = await getSafeAuthSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${session.access_token}`
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(withApiBase(path), {
    ...init,
    headers: {
      ...(await getAuthHeaders(Boolean(init.body))),
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function shouldUseSocket(s: Socket | null): s is Socket {
  return Boolean(CREATOR_CHAT_WS_ENABLED && s?.connected);
}

// Initialize WebSocket connection only when explicitly enabled.
async function getSocket(): Promise<Socket | null> {
  if (!CREATOR_CHAT_WS_ENABLED) return null;

  // Один экземпляр на сессию: не создаём второй io(), пока первый жив (в т.ч. до connect)
  if (socket) return socket;

  const session = await getSafeAuthSession();
  if (!session?.access_token) return null;

  socket = io(SOCKET_URL || undefined, {
    path: '/socket.io/chat',
    auth: { token: session.access_token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 2
  });

  socket.on('connect', () => {
    console.log('[ChatWS] Connected');
  });

  socket.on('disconnect', () => {
    console.log('[ChatWS] Disconnected');
  });

  socket.on('new_message', (data: { message: Message }) => {
    messageCallbacks.forEach(cb => cb(data.message));
  });

  socket.on('unread_count', (data: { count: number }) => {
    unreadCallbacks.forEach(cb => cb(data.count));
  });

  socket.on('error', (error: any) => {
    console.error('[ChatWS] Error:', error);
  });

  socket.on('connect_error', (error: any) => {
    console.warn('[ChatWS] connect_error:', error?.message || error);
  });

  return socket;
}

export const creatorChatApi = {
  // Подключиться к WebSocket, если он явно включен через env.
  async connect() {
    return getSocket();
  },

  // Отключиться
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Подписаться на новые сообщения
  onMessage(callback: (message: Message) => void) {
    messageCallbacks.push(callback);
    return () => {
      messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
    };
  },

  // Подписаться на изменение unread count
  onUnreadCount(callback: (count: number) => void) {
    unreadCallbacks.push(callback);
    return () => {
      unreadCallbacks = unreadCallbacks.filter(cb => cb !== callback);
    };
  },

  // Получить список креаторов (через HTTP)
  async getCreators(): Promise<Creator[]> {
    const response = await fetch(withApiBase('/api/creator-chat/creators'));
    if (!response.ok) throw new Error('Failed to fetch creators');
    const data = await response.json();
    return Array.isArray(data.creators) ? data.creators : [];
  },

  // Получить список чатов. REST является основным продовым транспортом.
  async getChats(): Promise<Chat[]> {
    const s = await getSocket();
    if (!shouldUseSocket(s)) {
      const data = await requestJson<{ chats: Chat[] }>('/api/creator-chat/chats');
      return Array.isArray(data.chats) ? data.chats : [];
    }

    return new Promise((resolve) => {
      const onChats = (data: { chats: Chat[] }) => {
        clearTimeout(timeout);
        resolve(Array.isArray(data?.chats) ? data.chats : []);
      };
      const timeout = setTimeout(async () => {
        s.off('chats_list', onChats);
        try {
          const data = await requestJson<{ chats: Chat[] }>('/api/creator-chat/chats');
          resolve(Array.isArray(data.chats) ? data.chats : []);
        } catch {
          resolve([]);
        }
      }, 5000);

      s.once('chats_list', onChats);
      s.emit('get_chats');
    });
  },

  // Создать или присоединиться к чату
  async joinChat(creatorId: string, tourTitle?: string): Promise<{ chat_id: string; messages: Message[] }> {
    const s = await getSocket();
    if (!shouldUseSocket(s)) {
      const data = await requestJson<{ chat_id: string }>('/api/creator-chat/chats', {
        method: 'POST',
        body: JSON.stringify({ creator_id: creatorId, tour_title: tourTitle })
      });
      const messages = data.chat_id ? await this.getMessages(data.chat_id).catch(() => []) : [];
      return { chat_id: data.chat_id, messages };
    }

    const session = await getSafeAuthSession();
    const clientId = session?.user?.id;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const data = await requestJson<{ chat_id: string }>('/api/creator-chat/chats', {
            method: 'POST',
            body: JSON.stringify({ creator_id: creatorId, tour_title: tourTitle })
          });
          const messages = data.chat_id ? await this.getMessages(data.chat_id).catch(() => []) : [];
          resolve({ chat_id: data.chat_id, messages });
        } catch (error) {
          reject(error);
        }
      }, 5000);

      s.emit('join_chat', { creatorId, clientId, tourTitle });
      s.once('chat_joined', (data: { chatId?: string; chat_id?: string; messages?: Message[] }) => {
        clearTimeout(timeout);
        const chat_id = data.chat_id ?? data.chatId;
        if (!chat_id) {
          reject(new Error('chat_joined: missing chat id'));
          return;
        }
        resolve({ chat_id, messages: data.messages ?? [] });
      });
    });
  },

  // Получить сообщения чата (по chatId)
  async getMessages(chatId: string): Promise<Message[]> {
    const s = await getSocket();
    if (!shouldUseSocket(s)) {
      const data = await requestJson<{ messages: Message[] }>(`/api/creator-chat/chats/${chatId}/messages`);
      return Array.isArray(data.messages) ? data.messages : [];
    }

    s.emit('join_chat', { chatId });

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          const data = await requestJson<{ messages: Message[] }>(`/api/creator-chat/chats/${chatId}/messages`);
          resolve(Array.isArray(data.messages) ? data.messages : []);
        } catch {
          resolve([]);
        }
      }, 5000);

      s.once('chat_joined', (data: { messages: Message[] }) => {
        clearTimeout(timeout);
        resolve(Array.isArray(data.messages) ? data.messages : []);
      });
    });
  },

  // Отправить сообщение
  async sendMessage(chatId: string, content: string): Promise<Message> {
    const s = await getSocket();
    if (!shouldUseSocket(s)) {
      const data = await requestJson<{ message: Message }>(`/api/creator-chat/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      return data.message;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const data = await requestJson<{ message: Message }>(`/api/creator-chat/chats/${chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content })
          });
          resolve(data.message);
        } catch (error) {
          reject(error);
        }
      }, 5000);

      s.emit('send_message', { chatId, content });
      s.once('new_message', (data: { message: Message }) => {
        clearTimeout(timeout);
        resolve(data.message);
      });
    });
  },

  // Отметить сообщения как прочитанные
  async markAsRead(chatId: string): Promise<void> {
    const s = await getSocket();
    if (shouldUseSocket(s)) {
      s.emit('mark_read', { chatId });
      return;
    }

    await requestJson<{ success: boolean }>(`/api/creator-chat/chats/${chatId}/read`, {
      method: 'POST'
    }).catch(() => undefined);
  },

  // Получить количество непрочитанных сообщений
  async getUnreadCount(): Promise<number> {
    const s = await getSocket();
    if (!shouldUseSocket(s)) {
      const data = await requestJson<{ count: number }>('/api/creator-chat/unread-count').catch(() => ({ count: 0 }));
      return Number(data.count) || 0;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        const data = await requestJson<{ count: number }>('/api/creator-chat/unread-count').catch(() => ({ count: 0 }));
        resolve(Number(data.count) || 0);
      }, 3000);

      s.once('unread_count', (data: { count: number }) => {
        clearTimeout(timeout);
        resolve(Number(data.count) || 0);
      });
    });
  }
};

export default creatorChatApi;
