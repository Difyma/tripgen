import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Chat {
  id: string;
  creatorId: string;
  clientId: string;
  messages: Message[];
  unreadCount: { [userId: string]: number };
}

const chats = new Map<string, Chat>();
const userSockets = new Map<string, string>();

export function initChatWebSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: '*' },
    path: '/socket.io/chat'
  });

  io.on('connection', (socket: Socket) => {
    console.log('[ChatWS] Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('[ChatWS] Client disconnected:', socket.id);
    });
  });

  return io;
}
