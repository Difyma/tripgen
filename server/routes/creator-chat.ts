/**
 * Creator Chat API Routes
 * 
 * Временные mock endpoints для creator-chat функциональности.
 * TODO: Заменить на полноценную реализацию с базой данных
 */

import { Router, Request, Response } from 'express';

const router = Router();

interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  attachments: any[];
  senderId: string;
  senderType: 'creator' | 'user';
  createdAt: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  userId: string;
  creatorId: string;
  userName: string;
  creatorName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'active' | 'archived';
}

// GET /api/creator-chat/unread-count
router.get('/unread-count', (req: Request, res: Response) => {
  res.json({ count: 0 });
});

// GET /api/creator-chat/chats
router.get('/chats', (req: Request, res: Response) => {
  res.json({ 
    chats: [] as Chat[],
    pagination: {
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0
    }
  });
});

// GET /api/creator-chat/chats/:id/messages
router.get('/chats/:id/messages', (req: Request, res: Response) => {
  res.json({ 
    messages: [] as ChatMessage[],
    pagination: {
      total: 0,
      page: 1,
      perPage: 50,
      totalPages: 0
    }
  });
});

// POST /api/creator-chat/chats/:id/messages
router.post('/chats/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, attachments } = req.body;
  
  const message: ChatMessage = {
    id: Date.now().toString(),
    chatId: id,
    text: text || '',
    attachments: attachments || [],
    senderId: 'creator',
    senderType: 'creator',
    createdAt: new Date().toISOString(),
    isRead: true
  };
  
  res.json({ message });
});

export default router;
