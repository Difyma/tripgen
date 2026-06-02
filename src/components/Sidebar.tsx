import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Settings, ChevronLeft, ChevronRight, Users, Trash2, Mountain } from 'lucide-react';
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
  const [showChatList, setShowChatList] = useState(true);
  const [activeChatTab, setActiveChatTab] = useState<'regular' | 'tours'>('regular');
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

  // Обновляем список чатов при переходе в основной чат,
  // чтобы новые чаты (в том числе по турам) появлялись в сайдбаре
  useEffect(() => {
    if (user && location.pathname.startsWith('/chat')) {
      getUserChats().then(setUserChats).catch(console.error);
    }
  }, [location.pathname, location.search, user]);

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

  // Чат по турам: отдельный тип, чтобы не дублировать в обычных чатах
  const isTourChat = (chat: Chat) => {
    const title = (chat.title || '').trim().toLowerCase();
    // Исторически тур-чаты могли называться по-разному:
    // - "Тур: <название тура>" — новая схема
    // - "Я перешёл из детальной страницы тура…" — старая схема
    // - Чаты с организаторами (creator chats)
    return (
      title.startsWith('тур:') ||
      title.startsWith('я перешёл из детальной страницы тура') ||
      (chat as any).isCreatorChat === true
    );
  };

  const toggleChatList = () => {
    setShowChatList(prev => !prev);
  };

  const hasTourChats = userChats.some(isTourChat);

  return (
    <div>
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
          'fixed inset-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ' +
          (isSidebarCollapsed ? 'w-[72px] max-w-[72px]' : 'w-[280px] max-w-[100vw]') +
          ' ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full') +
          ' lg:translate-x-0 lg:inset-y-0 lg:left-0 lg:right-auto ' +
          (isSidebarCollapsed ? 'lg:w-[72px] lg:max-w-none lg:z-40' : 'lg:w-[280px] lg:max-w-none lg:z-40') +
          ' ' +
          (className || '')
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
              <button
                type="button"
                onClick={toggleChatList}
                className={
                  'w-full flex items-center gap-3 h-10 rounded-xl transition-colors duration-200 text-left ' +
                  (isSidebarCollapsed ? 'justify-center px-0 w-10 min-w-0 mx-auto' : 'px-3') +
                  ' ' +
                  (isActivePath('/chat')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                  Чаты
                </span>
                {!isSidebarCollapsed && (
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showChatList ? 'rotate-90' : ''}`} />
                )}
              </button>

              {/* Таббар "Чаты / Чат туров" + списки, внутри выпадающего блока */}
              {showChatList && !isSidebarCollapsed && (
                <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto">
                  {/* Tabbar */}
                  <div className="px-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveChatTab('regular')}
                      className={
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ' +
                        (activeChatTab === 'regular'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Чаты</span>
                    </button>
                    {hasTourChats && (
                      <button
                        type="button"
                        onClick={() => setActiveChatTab('tours')}
                        className={
                          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ' +
                          (activeChatTab === 'tours'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                        }
                      >
                        <Mountain className="w-4 h-4" />
                        <span>Чат туров</span>
                      </button>
                    )}
                  </div>

                  {/* Кнопка "Новый чат" только для обычных чатов */}
                  {activeChatTab === 'regular' && (
                    <button
                      onClick={() => navigate('/chat?new=1')}
                      className="mt-1 w-full flex items-center gap-3 px-3 h-10 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Новый чат</span>
                    </button>
                  )}

                  {/* Обычные чаты */}
                  {user && !isLoadingChats && userChats.length > 0 && activeChatTab === 'regular' && (
                    <div className="space-y-1 mt-1">
                      <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Обычные чаты
                      </div>
                      {userChats
                        .filter(chat => !isTourChat(chat))
                        .map(chat => (
                          <Link
                            key={chat.id}
                            to={`/chat?chat=${chat.id}`}
                            className={
                              'group flex items-center gap-3 px-3 py-2 rounded-xl ml-2 transition-colors duration-200 ' +
                              (location.search.includes('chat=' + chat.id)
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }
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

                  {/* Чаты туров */}
                  {user && !isLoadingChats && hasTourChats && activeChatTab === 'tours' && (
                    <div className="space-y-1 mt-1">
                      <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Чаты туров
                      </div>
                      {userChats
                        .filter(isTourChat)
                        .map(chat => {
                          // Для чатов с организаторами используем creatorChat параметр
                          const isCreatorChat = (chat as any).isCreatorChat;
                          const chatUrl = isCreatorChat 
                            ? `/chat?creatorChat=${(chat as any).creatorChatId || chat.id}`
                            : `/chat?chat=${chat.id}`;
                          
                          return (
                            <Link
                              key={chat.id}
                              to={chatUrl}
                              className={
                                'group flex items-center gap-3 px-3 py-2 rounded-xl ml-2 transition-colors duration-200 ' +
                                (location.search.includes('chat=' + chat.id) || location.search.includes('creatorChat=' + chat.id)
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                              }
                            >
                              <Mountain className="w-4 h-4 shrink-0" />
                              <span className="font-medium truncate flex-1">{chat.title}</span>
                              {!isCreatorChat && (
                                <button
                                  onClick={(e) => handleDeleteChat(e, chat.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                                  title="Удалить чат"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(chat.updated_at).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Пункт "Мои путешествия" временно скрыт */}

            {/* Пункт "Избранное" временно скрыт из сайдбара */}

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
    </div>
  );
} 
