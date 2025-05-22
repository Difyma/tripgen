import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Compass, Heart, Bell, Settings, ChevronRight, ChevronLeft, Users } from 'lucide-react';
import { CreateTripModal } from './CreateTripModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const [userChats] = useState([
    { id: 1, name: 'Trip to Paris' },
    { id: 2, name: 'Family vacation June' },
    { id: 3, name: 'Business Trip' },
  ]);

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleInviteFriends = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      // Handle inviting friends when user is authenticated
      console.log('Implement invite friends functionality');
    }
  };

  const handleNewChat = () => {
    navigate(`/chat?new=${Date.now()}`);
  };

  const toggleChatList = () => {
    setShowChatList(!showChatList);
  };

  return (
    <>
      {/* Left Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${className}`}>
        <div className="p-4 relative">
          <Link to="/" className={`flex items-center gap-2 mb-6 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <img src="/images/TRIPGEN_logo_2.png" alt="Logo" className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} transition-all duration-300`} />
            {!isSidebarCollapsed && <span className="font-semibold">TRIPGEN</span>}
          </Link>
          <div className="space-y-2">
            <button 
              onClick={() => setIsCreateTripModalOpen(true)}
              className={`w-full bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 ${
                isSidebarCollapsed 
                  ? 'justify-center h-10 w-10 mx-auto' 
                  : 'px-3 py-1.5'
              }`}
            >
              <Plus className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Создать путешествие</span>}
            </button>
            <button 
              onClick={handleNewChat}
              className={`w-full bg-gray-50 text-gray-900 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                isSidebarCollapsed 
                  ? 'justify-center h-10 w-10 mx-auto' 
                  : 'px-3 py-1.5'
              }`}
            >
              <MessageSquare className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Новый чат</span>}
            </button>
          </div>
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            {isSidebarCollapsed ? 
              <ChevronRight className="w-4 h-4" /> : 
              <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>
        <nav className="flex-1 px-2">
          <div className="space-y-1">
            <button 
              onClick={toggleChatList}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''} ${isActivePath('/chat') ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
            >
              <MessageSquare className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && (
                <>
                  <span className="text-sm">Чаты</span>
                  <span className="ml-auto bg-gray-100 text-xs px-2 py-0.5 rounded-full">{userChats.length}</span>
                </>
              )}
            </button>
            <Link 
              to="/trips" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''} ${isActivePath('/trips') ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
            >
              <Compass className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Мои путешествия</span>}
            </Link>
            <Link 
              to="/saved" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''} ${isActivePath('/saved') ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
            >
              <Heart className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Сохраненные</span>}
            </Link>
            <Link 
              to="/updates" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''} ${isActivePath('/updates') ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
            >
              <Bell className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Обновления</span>}
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <button className={`flex items-center gap-2 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <Settings className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Настройки</span>}
            </button>
            <button 
              onClick={handleInviteFriends}
              className={`flex items-center gap-2 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100 w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Users className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-300`} />
              {!isSidebarCollapsed && <span className="text-sm">Пригласить друзей</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Chat List column */}
      {showChatList && (
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">Ваши чаты</h2>
            {userChats.map(chat => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                {chat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onSubmit={(data) => {
          console.log('Creating trip with data:', data);
          setIsCreateTripModalOpen(false);
        }}
      />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
} 