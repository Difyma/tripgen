import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { trips } from '../data/trips';
import { MessageSquare, Send } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

interface Message {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export default function TripChatPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed } = useSidebar();
  const trip = trips.find(t => t.id === tripId);
  // Мок-текущий пользователь (в реальном проекте брать из auth)
  const currentUser = trip?.participants?.[0] || { id: 'me', name: 'Вы' };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: trip?.participants?.[0]?.id || '1',
      text: 'Привет! Это групповой чат путешествия.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: trip?.participants?.[1]?.id || '2',
      text: 'Всем привет! Когда встречаемся в аэропорту?',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Определяем куда возвращаться
  let backTo = '/trips';
  if (location.state?.from === 'details') {
    backTo = `/trips/${tripId}`;
  }

  if (!trip) {
    return <div className="p-8 text-center text-gray-500">Путешествие не найдено</div>;
  }

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        userId: currentUser.id,
        text: input,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Мобильная версия */}
      <div className="md:hidden flex flex-col min-h-screen bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 mr-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Назад</span>
          </button>
          <MessageSquare className="w-6 h-6 text-primary" />
          <div className="font-semibold text-lg truncate">Чат путешествия: {trip.title}</div>
          <div className="ml-auto flex -space-x-2">
            {trip.participants?.map(u => (
              <img key={u.id} src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} />
            ))}
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
          {messages.map(msg => {
            const user = trip.participants?.find(u => u.id === msg.userId) || currentUser;
            const isMe = msg.userId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border" />
                  <div className={`rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}>{msg.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Написать сообщение..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Десктопная версия с отступом */}
      <div
        className="hidden md:block flex-1 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? '72px' : '280px' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col h-[calc(100vh-64px)] bg-white rounded-2xl border shadow">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white rounded-t-2xl">
              <button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 mr-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                <span className="hidden sm:inline">Назад</span>
              </button>
              <MessageSquare className="w-6 h-6 text-primary" />
              <div className="font-semibold text-lg truncate">Чат путешествия: {trip.title}</div>
              <div className="ml-auto flex -space-x-2">
                {trip.participants?.map(u => (
                  <img key={u.id} src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} />
                ))}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
              {messages.map(msg => {
                const user = trip.participants?.find(u => u.id === msg.userId) || currentUser;
                const isMe = msg.userId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border" />
                      <div className={`rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="p-4 border-t bg-white rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 