import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { getUserFromToken } from './supabase.js';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'creator' | 'client';
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Chat {
  id: string;
  creatorId: string;
  clientId: string;
  creatorName?: string;
  clientName?: string;
  tourTitle?: string;
  messages: Message[];
  unreadCount: { [userId: string]: number };
  lastMessageAt: string;
  createdAt: string;
}

// In-memory storage
const chats = new Map<string, Chat>();
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export function initChatWebSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io/chat'
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }

      (socket as any).userId = user.id;
      (socket as any).userEmail = user.email;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;
    
    console.log('[ChatWS] User connected:', userId, userEmail);
    
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Send unread count on connect
    const unreadCount = getUnreadCount(userId);
    socket.emit('unread_count', { count: unreadCount });

    // Join user's chat rooms
    const userChats = getUserChats(userId);
    userChats.forEach(chat => {
      socket.join(chat.id);
    });

    // Create or join chat
    socket.on('join_chat', (data: { creatorId: string; clientId?: string; tourTitle?: string }) => {
      const { creatorId, clientId = userId, tourTitle } = data;
      
      // Find existing chat or create new
      let chat = findChat(creatorId, clientId);
      
      if (!chat) {
        chat = createChat(creatorId, clientId, tourTitle);
      }
      
      socket.join(chat.id);
      socket.emit('chat_joined', { 
        chatId: chat.id, 
        messages: chat.messages,
        creatorId: chat.creatorId,
        clientId: chat.clientId
      });
    });

    // Send message
    socket.on('send_message', (data: { chatId: string; content: string }) => {
      const { chatId, content } = data;
      const chat = chats.get(chatId);
      
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Verify user is in this chat
      if (chat.creatorId !== userId && chat.clientId !== userId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      const senderType = chat.creatorId === userId ? 'creator' : 'client';
      const recipientId = senderType === 'creator' ? chat.clientId : chat.creatorId;

      const message: Message = {
        id: Date.now().toString(),
        chatId,
        senderId: userId,
        senderType,
        content: content.trim(),
        isRead: false,
        createdAt: new Date().toISOString()
      };

      chat.messages.push(message);
      chat.lastMessageAt = message.createdAt;
      
      // Update unread count for recipient
      chat.unreadCount[recipientId] = (chat.unreadCount[recipientId] || 0) + 1;

      // Broadcast to chat room
      io.to(chatId).emit('new_message', { message });
      
      // Update unread count for recipient if online
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        const recipientUnread = getUnreadCount(recipientId);
        io.to(recipientSocketId).emit('unread_count', { count: recipientUnread });
      }

      // Notify about updated chat list
      io.to(chatId).emit('chat_updated', { chat: formatChat(chat, userId) });
    });

    // Mark messages as read
    socket.on('mark_read', (data: { chatId: string }) => {
      const { chatId } = data;
      const chat = chats.get(chatId);
      
      if (!chat) return;

      // Mark all messages from other user as read
      let hasUnread = false;
      chat.messages.forEach(msg => {
        if (msg.senderId !== userId && !msg.isRead) {
          msg.isRead = true;
          hasUnread = true;
        }
      });

      if (hasUnread) {
        chat.unreadCount[userId] = 0;
        
        // Notify sender that messages were read
        const senderId = chat.creatorId === userId ? chat.clientId : chat.creatorId;
        const senderSocketId = userSockets.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { chatId, by: userId });
        }

        // Update unread count
        const unreadCount = getUnreadCount(userId);
        socket.emit('unread_count', { count: unreadCount });
      }
    });

    // Get user's chats
    socket.on('get_chats', () => {
      const userChats = getUserChats(userId).map(chat => formatChat(chat, userId));
      socket.emit('chats_list', { chats: userChats });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('[ChatWS] User disconnected:', userId);
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
    });
  });

  return io;
}

// Helper functions
function createChat(creatorId: string, clientId: string, tourTitle?: string): Chat {
  const id = `${creatorId}_${clientId}_${Date.now()}`;
  const chat: Chat = {
    id,
    creatorId,
    clientId,
    tourTitle,
    messages: [],
    unreadCount: { [creatorId]: 0, [clientId]: 0 },
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  chats.set(id, chat);
  return chat;
}

function findChat(creatorId: string, clientId: string): Chat | undefined {
  return Array.from(chats.values()).find(
    c => c.creatorId === creatorId && c.clientId === clientId && c.status !== 'closed'
  );
}

function getUserChats(userId: string): Chat[] {
  return Array.from(chats.values())
    .filter(c => c.creatorId === userId || c.clientId === userId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function getUnreadCount(userId: string): number {
  return Array.from(chats.values())
    .filter(c => c.creatorId === userId || c.clientId === userId)
    .reduce((sum, chat) => sum + (chat.unreadCount[userId] || 0), 0);
}

function formatChat(chat: Chat, userId: string) {
  const isCreator = chat.creatorId === userId;
  const otherId = isCreator ? chat.clientId : chat.creatorId;
  
  return {
    chatId: chat.id,
    creatorId: chat.creatorId,
    clientId: chat.clientId,
    tourTitle: chat.tourTitle,
    lastMessageAt: chat.lastMessageAt,
    unreadCount: chat.unreadCount[userId] || 0,
    isCreator,
    otherId
  };
}

// Express API routes for polling fallback
export function getChatRoutes() {
  return {
    getUnreadCount,
    getUserChats: (userId: string) => getUserChats(userId).map(c => formatChat(c, userId)),
    getChatMessages: (chatId: string) => {
      const chat = chats.get(chatId);
      return chat ? chat.messages : [];
    }
  };
}
