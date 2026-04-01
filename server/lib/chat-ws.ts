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
  tourTitle?: string;
  messages: Message[];
  unreadCount: { [userId: string]: number };
  lastMessageAt: string;
  createdAt: string;
  status?: string;
}

// In-memory storage
const chats = new Map<string, Chat>();
const userSockets = new Map<string, string>();

export function initChatWebSocket(httpServer: HttpServer) {
  try {
    const io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      path: '/socket.io/chat'
    });

    // Authentication middleware
    io.use(async (socket: Socket, next: (err?: Error) => void) => {
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
      
      console.log('[ChatWS] User connected:', userId);
      
      userSockets.set(userId, socket.id);

      // Send unread count on connect
      const unreadCount = getUnreadCount(userId);
      socket.emit('unread_count', { count: unreadCount });

      // Join user's chat rooms
      const userChats = getUserChats(userId);
      userChats.forEach((chat: Chat) => {
        socket.join(chat.id);
      });

      // Create or join chat
      socket.on('join_chat', (data: { creatorId?: string; chatId?: string; clientId?: string; tourTitle?: string }) => {
        try {
          let chat: Chat | undefined;
          
          // If chatId provided - join existing chat
          if (data.chatId) {
            chat = chats.get(data.chatId);
            if (chat) {
              // Verify user has access
              if (chat.creatorId !== userId && chat.clientId !== userId) {
                socket.emit('error', { message: 'Access denied' });
                return;
              }
            }
          }
          
          // If creatorId provided - find or create chat
          if (!chat && data.creatorId) {
            const clientId = data.clientId || userId;
            chat = findChat(data.creatorId, clientId);
            
            if (!chat) {
              chat = createChat(data.creatorId, clientId, data.tourTitle);
            }
          }
          
          if (!chat) {
            socket.emit('error', { message: 'Chat not found' });
            return;
          }
          
          socket.join(chat.id);
          socket.emit('chat_joined', { 
            chatId: chat.id, 
            messages: chat.messages,
            creatorId: chat.creatorId,
            clientId: chat.clientId
          });
        } catch (err) {
          console.error('[ChatWS] Error joining chat:', err);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Send message
      socket.on('send_message', (data: { chatId: string; content: string }) => {
        try {
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
        } catch (err) {
          console.error('[ChatWS] Error sending message:', err);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark messages as read
      socket.on('mark_read', (data: { chatId: string }) => {
        try {
          const { chatId } = data;
          const chat = chats.get(chatId);
          
          if (!chat) return;

          // Mark all messages from other user as read
          let hasUnread = false;
          chat.messages.forEach((msg: Message) => {
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
        } catch (err) {
          console.error('[ChatWS] Error marking read:', err);
        }
      });

      // Get user's chats
      socket.on('get_chats', () => {
        try {
          const userChats = getUserChats(userId).map((chat: Chat) => formatChat(chat, userId));
          socket.emit('chats_list', { chats: userChats });
        } catch (err) {
          console.error('[ChatWS] Error getting chats:', err);
          socket.emit('chats_list', { chats: [] });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('[ChatWS] User disconnected:', userId);
        userSockets.delete(userId);
      });
    });

    return io;
  } catch (err) {
    console.error('[ChatWS] Failed to initialize:', err);
    return null;
  }
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
    (c: Chat) => c.creatorId === creatorId && c.clientId === clientId
  );
}

function getUserChats(userId: string): Chat[] {
  return Array.from(chats.values())
    .filter((c: Chat) => c.creatorId === userId || c.clientId === userId)
    .sort((a: Chat, b: Chat) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function getUnreadCount(userId: string): number {
  return Array.from(chats.values())
    .filter((c: Chat) => c.creatorId === userId || c.clientId === userId)
    .reduce((sum: number, chat: Chat) => sum + (chat.unreadCount[userId] || 0), 0);
}

function formatChat(chat: Chat, userId: string) {
  const isCreator = chat.creatorId === userId;
  const otherId = isCreator ? chat.clientId : chat.creatorId;
  
  return {
    chat_id: chat.id,
    creator_id: chat.creatorId,
    client_id: chat.clientId,
    tourTitle: chat.tourTitle,
    last_message_at: chat.lastMessageAt,
    unread_count: chat.unreadCount[userId] || 0,
    isCreator,
    otherId
  };
}

// Express API routes for polling fallback
export function getChatRoutes() {
  return {
    getUnreadCount,
    getUserChats: (userId: string) => getUserChats(userId).map((c: Chat) => formatChat(c, userId)),
    getChatMessages: (chatId: string) => {
      const chat = chats.get(chatId);
      return chat ? chat.messages : [];
    }
  };
}
