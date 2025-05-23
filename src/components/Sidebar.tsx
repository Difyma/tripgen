import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Compass, Heart, Bell, Settings, ChevronRight, ChevronLeft, Users, Send } from 'lucide-react';
import { CreateTripModal } from './CreateTripModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

interface SidebarProps {
  className?: string;
}

interface Chat {
  id: string | number;
  name: string;
  lastMessage?: string;
  timestamp?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [showChatList, setShowChatList] = useState(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const [userChats] = useState<Chat[]>([
    { id: 1, name: 'Путешествие в Париж', lastMessage: 'Давайте спланируем маршрут по основным достопримечательностям', timestamp: '2024-03-15' },
    { id: 2, name: 'Отдых на Бали', lastMessage: 'Лучшие пляжи для серфинга в Улувату', timestamp: '2024-03-14' },
    { id: 3, name: 'Тур по Японии', lastMessage: 'Сезон цветения сакуры в Киото', timestamp: '2024-03-13' },
    { id: 4, name: 'Горнолыжный курорт', lastMessage: 'Шамони или Куршевель?', timestamp: '2024-03-12' },
    { id: 5, name: 'Греческие острова', lastMessage: 'Паром из Афин до Санторини', timestamp: '2024-03-11' },
    { id: 6, name: 'Выходные в Стамбуле', lastMessage: 'Рекомендации по отелям в районе Султанахмет', timestamp: '2024-03-10' },
    { id: 7, name: 'Сафари в Кении', lastMessage: 'Национальный парк Масаи-Мара', timestamp: '2024-03-09' },
    { id: 8, name: 'Круиз по Карибам', lastMessage: 'Лучшее время для посещения Багамских островов', timestamp: '2024-03-08' },
    { id: 9, name: 'Поход в Непале', lastMessage: 'Маршрут до базового лагеря Эвереста', timestamp: '2024-03-07' },
    { id: 10, name: 'Винный тур Тоскана', lastMessage: 'Дегустации в регионе Кьянти', timestamp: '2024-03-06' },
    { id: 11, name: 'Северное сияние', lastMessage: 'Лапландия или Исландия?', timestamp: '2024-03-05' },
    { id: 12, name: 'Рим на выходные', lastMessage: 'Билеты в Ватиканские музеи', timestamp: '2024-03-04' }
  ]);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          `fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300
          ${isSidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
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
        <Link to="/" className="flex items-center gap-3 px-4 h-[72px] border-b border-gray-200">
          <img
            src="/images/TRIPGEN_logo_2.png"
            alt="TRIPGEN"
            className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'}`}
          />
          <span className={`font-bold text-xl transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            TRIPGEN
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="p-2 space-y-2">
          <button
            onClick={() => setIsCreateTripModalOpen(true)}
            className={`
              w-full bg-black text-white
              flex items-center gap-3
              transition-all duration-300
              hover:bg-gray-900
              ${isSidebarCollapsed
                ? 'h-10 w-10 p-0 justify-center mx-auto rounded-xl'
                : 'px-4 h-10 rounded-xl'
              }
            `}
          >
            <Plus className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
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
                  flex items-center gap-3 px-3 h-10 rounded-xl
                  transition-colors duration-200
                  ${isActivePath('/chat')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={toggleChatList}
              >
                <MessageSquare className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                  Чаты
                </span>
                {!isSidebarCollapsed && (
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showChatList ? 'rotate-90' : ''}`} />
                )}
              </Link>

              {/* Список чатов */}
              {showChatList && !isSidebarCollapsed && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => navigate(`/chat?new=${Date.now()}`)}
                    className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Новый чат</span>
                  </button>
                  {userChats.map((chat) => (
                    <Link
                      key={chat.id}
                      to={`/chat/${chat.id}`}
                      className={`
                        flex flex-col px-3 py-2 rounded-xl ml-2
                        transition-colors duration-200
                        ${location.pathname === `/chat/${chat.id}`
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="font-medium truncate">{chat.name}</span>
                      </div>
                      {chat.lastMessage && (
                        <div className="ml-7 mt-1">
                          <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                          {chat.timestamp && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(chat.timestamp).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/trips"
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl
                transition-colors duration-200
                ${isActivePath('/trips')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Compass className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Мои путешествия
              </span>
            </Link>

            <Link
              to="/favorites"
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl
                transition-colors duration-200
                ${isActivePath('/favorites')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Heart className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Избранное
              </span>
            </Link>

            <Link
              to="/flights"
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl
                transition-colors duration-200
                ${isActivePath('/flights')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Send className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} rotate-45`} />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Авиабилеты
              </span>
            </Link>

            <Link
              to="/hotels"
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl
                transition-colors duration-200
                ${isActivePath('/hotels')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Bell className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Отели
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
                  group flex items-center gap-3 px-3 h-10 rounded-xl
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
                title="Перейти в профиль"
              >
                <div className="relative shrink-0">
                  <img
                    src="/images/user.png"
                    alt="User"
                    className={`rounded-full ring-2 ring-transparent group-hover:ring-black/10 transition-all ${isSidebarCollapsed ? 'w-8 h-8' : 'w-8 h-8'}`}
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
                  flex items-center gap-3 px-3 h-10 rounded-xl w-full
                  text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  transition-colors duration-200
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <Users className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                {!isSidebarCollapsed && (
                  <span>Войти</span>
                )}
              </button>
            )}

            {/* Settings */}
            <Link
              to="/settings"
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl
                text-gray-600 hover:bg-gray-50 hover:text-gray-900
                transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <Settings className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              {!isSidebarCollapsed && (
                <span>Настройки</span>
              )}
            </Link>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`
                flex items-center gap-3 px-3 h-10 rounded-xl w-full
                text-gray-600 hover:bg-gray-50 hover:text-gray-900
                transition-colors duration-200
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
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