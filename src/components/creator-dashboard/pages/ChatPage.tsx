import React from 'react';
import { CreatorChat } from '../../creator-chat/CreatorChat';
import { MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          Чаты с клиентами
        </h1>
        <p className="text-gray-500 mt-1">
          Общайтесь с вашими клиентами в реальном времени
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <CreatorChat embedded />
      </div>
    </div>
  );
};

export default ChatPage;
