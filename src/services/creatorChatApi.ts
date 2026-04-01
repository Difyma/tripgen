import { supabase } from '../lib/supabase';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// WebSocket socket instance
let socket: Socket | null = null;
let messageCallbacks: ((message: Message) => void)[] = [];
let unreadCallbacks: ((count: number) => void)[] = [];

// Initialize WebSocket connection
async function getSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  if (socket?.connecting) return socket;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  socket = io(API_URL, {
    path: '/socket.io/chat',
    auth: { token: session.access_token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5
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

  return socket;
}

export const creatorChatApi = {
  // Подключиться к WebSocket
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
    const response = await fetch(`${API_URL}/api/creator-chat/creators`);
    if (!response.ok) throw new Error('Failed to fetch creators');
    const data = await response.json();
    return data.creators;
  },

  // Получить список чатов через WebSocket
  async getChats(): Promise<Chat[]> {
    const s = await getSocket();
    if (!s) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      s.emit('get_chats');
      s.once('chats_list', (data: { chats: Chat[] }) => {
        clearTimeout(timeout);
        resolve(data.chats);
      });
    });
  },

  // Создать или присоединиться к чату
  async joinChat(creatorId: string, tourTitle?: string): Promise<{ chat_id: string; messages: Message[] }> {
    const s = await getSocket();
    if (!s) throw new Error('Not connected');

    const { data: { session } } = await supabase.auth.getSession();
    const clientId = session?.user?.id;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      s.emit('join_chat', { creatorId, clientId, tourTitle });
      s.once('chat_joined', (data: { chatId: string; messages: Message[] }) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  },

  // Получить сообщения чата (по chatId)
  async getMessages(chatId: string): Promise<Message[]> {
    const s = await getSocket();
    if (!s) throw new Error('Not connected');

    // Join existing chat by chatId
    s.emit('join_chat', { chatId });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      s.once('chat_joined', (data: { messages: Message[] }) => {
        clearTimeout(timeout);
        resolve(data.messages);
      });
    });
  },

  // Отправить сообщение
  async sendMessage(chatId: string, content: string): Promise<Message> {
    const s = await getSocket();
    if (!s) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
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
    if (!s) return;
    
    s.emit('mark_read', { chatId });
  },

  // Получить количество непрочитанных сообщений (через WebSocket)
  async getUnreadCount(): Promise<number> {
    const s = await getSocket();
    if (!s) return 0;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(0), 3000);
      
      s.once('unread_count', (data: { count: number }) => {
        clearTimeout(timeout);
        resolve(data.count);
      });
    });
  }
};

export default creatorChatApi;
