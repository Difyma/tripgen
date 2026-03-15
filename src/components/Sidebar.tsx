import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Compass, Heart, Settings, ChevronLeft, ChevronRight, Users, Trash2 } from 'lucide-react';
import { CreateTripModal } from './CreateTripModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { getUserChats, deleteChat, type Chat } from '../lib/supabase';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const navigate = useNavigate();
  const [showChatList, setShowChatList] = useState(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Загрузка чатов при входе пользователя
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setUserChats([]);
        return;
      }
      
      setIsLoadingChats(true);
      try {
        const chats = await getUserChats();
        setUserChats(chats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [user]);

  // Обновляем список чатов при открытии списка
  useEffect(() => {
    if (showChatList && user) {
      getUserChats().then(setUserChats).catch(console.error);
    }
  }, [showChatList, user]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Удалить этот чат?')) return;
    
    try {
      await deleteChat(chatId);
      setUserChats(prev => prev.filter(c => c.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const toggleChatList = () => {
    setShowChatList(!showChatList);
  };

  return (
    <>
      {/* Мобильная кнопка-гамбургер */}
      <button
        className="fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-md lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {/* Затемнение фона при открытом сайдбаре на мобильных */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={
          `fixed inset-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300
          ${isSidebarCollapsed ? 'w-[72px] max-w-[72px]' : 'w-[280px] max-w-[100vw]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[${isSidebarCollapsed ? '72px' : '280px'}] lg:max-w-none lg:z-40
          ${className || ''}`
        }
      >
        {/* Кнопка закрытия на мобильных */}
        <button
          className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        >
          <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        {/* Logo */}
        <Link to="/" className={`flex items-center gap-3 h-[72px] border-b border-gray-200 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}>
          <img
            src="/images/TRIPGEN_logo_2.png"
            alt="TRIPGEN"
            className={`transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-11 h-11' : 'w-8 h-8'}`}
          />
          <span className={`font-bold text-xl transition-opacity duration-300 ${isSidebarCollapsed ? 'sr-only' : 'opacity-100'}`}>
            TRIPGEN
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="p-2 space-y-2">
          <button
            onClick={() => setIsCreateTripModalOpen(true)}
            className={`
              w-full bg-black text-white
              flex items-center justify-center gap-3
              transition-all duration-300
              hover:bg-gray-900
              ${isSidebarCollapsed
                ? 'h-8 w-8 min-w-0 p-0 rounded-lg mx-auto'
                : 'px-4 h-10 rounded-xl'
              }
            `}
          >
            <Plus className={`shrink-0 ${isSidebarCollapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              Создать маршрут
            </span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-2 space-y-1">
            <div>
              <Link
                to="/chat"
                className={`
                  flex items-center gap-3 h-10 rounded-xl transition-colors duration-200
                  ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3'}
                  ${isActivePath('/chat')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={toggleChatList}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                  Чаты
                </span>
                {!isSidebarCollapsed && (
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showChatList ? 'rotate-90' : ''}`} />
                )}
              </Link>

              {/* Список чатов */}
              {showChatList && !isSidebarCollapsed && (
                <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => navigate('/chat')}
                    className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Новый чат</span>
                  </button>
                  
                  {!user && (
                    <div className="px-3 py-2 text-xs text-gray-400">
                      Войдите, чтобы сохранять чаты
                    </div>
                  )}
                  
                  {isLoadingChats && (
                    <div className="px-3 py-2 text-xs text-gray-400">
                      Загрузка...
                    </div>
                  )}
                  
                  {user && !isLoadingChats && userChats.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">
                      У вас пока нет чатов
                    </div>
                  )}
                  
                  {userChats.map((chat) => (
                    <Link
                      key={chat.id}
                      to={`/chat?chat=${chat.id}`}
                      className={`
                        group flex items-center gap-3 px-3 py-2 rounded-xl ml-2
                        transition-colors duration-200
                        ${location.search.includes(`chat=${chat.id}`)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate flex-1">{chat.title}</span>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                        title="Удалить чат"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(chat.updated_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/trips"
              className={`
                flex items-center gap-3 h-10 rounded-xl transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3'}
                ${isActivePath('/trips')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Compass className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Мои путешествия
              </span>
            </Link>

            <Link
              to="/favorites"
              className={`
                flex items-center gap-3 h-10 rounded-xl transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3'}
                ${isActivePath('/favorites')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Heart className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Избранное
              </span>
            </Link>


          </nav>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200">
          <div className="space-y-2">
            {/* User Profile / Auth Button */}
            {user ? (
              <Link
                to="/profile"
                className={`
                  group flex items-center gap-3 h-10 rounded-xl
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200
                  ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3'}
                `}
                title="Перейти в профиль"
              >
                <div className="relative shrink-0">
                  <img
                    src="/images/user.png"
                    alt="User"
                    className="rounded-full ring-2 ring-transparent group-hover:ring-black/10 transition-all w-8 h-8 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-sm truncate group-hover:text-black transition-colors">
                      {user.email}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                  </div>
                )}
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`
                  flex items-center gap-3 h-10 rounded-xl
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-colors duration-200
                  ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3 w-full'}
                `}
              >
                <Users className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <span>Войти</span>
                )}
              </button>
            )}

            {/* Settings */}
            <Link
              to="/settings"
              className={`
                flex items-center gap-3 h-10 rounded-xl
                text-gray-600 hover:bg-gray-50 hover:text-gray-900
                transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3'}
              `}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && (
                <span>Настройки</span>
              )}
            </Link>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`
                hidden lg:flex items-center gap-3 h-10 rounded-xl
                text-gray-600 hover:bg-gray-50 hover:text-gray-900
                transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3 w-full'}
              `}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5 shrink-0" />
                  <span>Свернуть</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
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