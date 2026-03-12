import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import creatorChatApi, { Chat, Message } from '../../services/creatorChatApi';
import { 
  MessageCircle, 
  Send, 
  ChevronLeft,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CreatorChatProps {
  chatId?: string;
  onBack?: () => void;
  embedded?: boolean;
}

export const CreatorChat: React.FC<CreatorChatProps> = ({ 
  chatId: initialChatId, 
  onBack,
  embedded = false 
}) => {
  const { user, isCreator } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка списка чатов
  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.chat_id);
      const interval = setInterval(() => loadMessages(selectedChat.chat_id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  // Автоскролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const data = await creatorChatApi.getChats();
      setChats(data);
      
      if (initialChatId && !selectedChat) {
        const chat = data.find(c => c.chat_id === initialChatId);
        if (chat) setSelectedChat(chat);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const data = await creatorChatApi.getMessages(chatId);
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = data.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const message = await creatorChatApi.sendMessage(
        selectedChat.chat_id, 
        newMessage
      );
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      setChats(prev => prev.map(chat => 
        chat.chat_id === selectedChat.chat_id 
          ? { ...chat, last_message_at: new Date().toISOString() }
          : chat
      ).sort((a, b) => 
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      ));
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]);
    if (chat.unread_count > 0) {
      creatorChatApi.markAsRead(chat.chat_id).then(() => {
        setChats(prev => prev.map(c => 
          c.chat_id === chat.chat_id ? { ...c, unread_count: 0 } : c
        ));
      });
    }
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;

  const getChatName = (chat: Chat) => {
    if (isCreator) {
      return chat.client_name || chat.client_email || 'Клиент';
    }
    return chat.creator_name || chat.creator_email || 'Креатор';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Список чатов
  if (!selectedChat) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${embedded ? 'h-full' : 'h-[600px]'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {isCreator ? 'Чаты с клиентами' : 'Мои чаты'}
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Онлайн</span>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center">
                {isCreator 
                  ? 'У вас пока нет чатов с клиентами' 
                  : 'У вас пока нет чатов с креаторами'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {chats.map(chat => (
                <button
                  key={chat.chat_id}
                  onClick={() => handleChatSelect(chat)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {getInitials(getChatName(chat))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getChatName(chat)}
                      </h3>
                      {chat.last_message_at && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(chat.last_message_at), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {isCreator ? 'Клиент' : 'Креатор'}
                    </p>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                      {chat.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Окно чата
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${embedded ? 'h-full' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => {
            setSelectedChat(null);
            onBack?.();
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
          {getInitials(getChatName(selectedChat))}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{getChatName(selectedChat)}</h3>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Онлайн
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-140px)]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>Начните общение</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = isOwnMessage(msg);
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {showAvatar ? (
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-medium ${
                    isOwn 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {isOwn ? 'Я' : getInitials(getChatName(selectedChat))}
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="text-xs text-gray-400">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    {isOwn && (
                      msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Check className="w-3 h-3 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatorChat;
