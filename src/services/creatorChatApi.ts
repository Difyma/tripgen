import { supabase } from '../lib/supabase';

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
  status: 'active' | 'closed' | 'archived';
  last_message_at: string | null;
  created_at: string;
  creator_name: string | null;
  creator_email: string;
  client_name: string | null;
  client_email: string;
  unread_count: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'creator' | 'client';
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  };
}

export const creatorChatApi = {
  // Получить список креаторов
  async getCreators(): Promise<Creator[]> {
    const response = await fetch(`${API_URL}/api/creator-chat/creators`);
    if (!response.ok) throw new Error('Failed to fetch creators');
    const data = await response.json();
    return data.creators;
  },

  // Получить список чатов текущего пользователя
  async getChats(): Promise<Chat[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/creator-chat/chats`, { headers });
    if (!response.ok) throw new Error('Failed to fetch chats');
    const data = await response.json();
    return data.chats;
  },

  // Создать или получить чат с креатором
  async createChat(creatorId: string): Promise<{ chat_id: string; creator: Creator }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/creator-chat/chats`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ creator_id: creatorId })
    });
    if (!response.ok) throw new Error('Failed to create chat');
    return response.json();
  },

  // Получить сообщения чата
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/api/creator-chat/chats/${chatId}/messages?limit=${limit}&offset=${offset}`,
      { headers }
    );
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.messages;
  },

  // Отправить сообщение
  async sendMessage(chatId: string, content: string): Promise<Message> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/creator-chat/chats/${chatId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    return data.message;
  },

  // Отметить сообщения как прочитанные
  async markAsRead(chatId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/creator-chat/chats/${chatId}/read`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('Failed to mark as read');
  },

  // Получить количество непрочитанных сообщений
  async getUnreadCount(): Promise<number> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/creator-chat/unread-count`, { headers });
    if (!response.ok) throw new Error('Failed to get unread count');
    const data = await response.json();
    return data.count;
  }
};

export default creatorChatApi;
