import { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Recommendations from './Recommendations';

const Chat = () => {
  const [messages, setMessages] = useState<Array<{text: string; isUser: boolean}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, isUser: true }]);
      setInputMessage('');
      // Здесь можно добавить логику для обработки сообщений
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBFD]">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className={`flex-1 transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
      }`}>
        {/* Header */}
        <nav className={`py-4 px-8 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 transition-all duration-300`}>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/')}
                  className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-xl font-semibold tracking-wide text-gray-800">Чат с TripGen</div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <span className="text-sm">Where</span>
                </button>
                <button className="px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <span className="text-sm">When</span>
                </button>
                <button className="px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">2 travelers</span>
                  </div>
                </button>
                <button className="px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
                  <span className="text-sm">Budget</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Chat Container */}
        <div className="px-4 pt-6 pb-32">
          <div className="space-y-6">
            {/* Приветственное сообщение */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <img 
                  src="/src/images/TRIPGEN_logo_white.png"
                  alt="TripGen"
                  className="w-6 h-6"
                />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-sm max-w-[80%]">
                <p className="text-gray-800">
                  Привет! Я ваш персональный помощник в планировании путешествий. Расскажите, куда бы вы хотели отправиться?
                </p>
              </div>
            </div>

            {/* Сообщения */}
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-4 ${message.isUser ? 'justify-end' : ''}`}>
                {!message.isUser && (
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/src/images/TRIPGEN_logo_white.png"
                      alt="TripGen"
                      className="w-6 h-6"
                    />
                  </div>
                )}
                <div className={`${
                  message.isUser 
                    ? 'bg-black text-white rounded-2xl rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-none'
                } px-6 py-4 shadow-sm max-w-[80%]`}>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className={`fixed bottom-0 bg-white border-t border-gray-200/50 p-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'left-[72px]' : 'left-[240px]'
        } right-[500px]`}>
          <div className="w-full">
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black resize-none"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-900 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <Recommendations />
    </div>
  );
};

export default Chat; 