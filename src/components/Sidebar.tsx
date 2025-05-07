import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Heart, 
  Bell, 
  Send,
  PlusSquare,
  ChevronLeft,
  User,
  Plus
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: MessageSquare, label: 'Chats', count: 2 },
    { icon: Search, label: 'Explore' },
    { icon: Heart, label: 'Saved' },
    { icon: Bell, label: 'Updates' },
    { icon: Send, label: 'Inspiration' },
  ];

  return (
    <div 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200/50 transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="/src/images/TRIPGEN_logo_2.png"
            alt="TripGen"
            className="w-8 h-8"
          />
          {!isCollapsed && (
            <span className="text-xl font-semibold">TRIPGEN</span>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => navigate('/chat')}
          className={`w-full flex items-center gap-2 bg-black text-white p-3 rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors mb-4 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && (
            <span>Новый чат</span>
          )}
        </button>
      </div>

      <div className="mt-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <item.icon className="w-6 h-6" />
            {!isCollapsed && (
              <span className="text-base font-medium">{item.label}</span>
            )}
            {!isCollapsed && item.count && (
              <span className="ml-auto bg-gray-100 px-2 py-0.5 rounded-full text-sm">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onToggle}
        className={`absolute top-1/2 -right-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center transform transition-transform ${
          isCollapsed ? 'rotate-180' : ''
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <User className="w-6 h-6" />
          {!isCollapsed && (
            <span className="text-base font-medium">Traveler</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 