import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Calendar,
  ClipboardList,
  Wallet,
  BarChart3,
  Star,
  Settings,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import creatorChatApi from '@/services/creatorChatApi';

interface CreatorDashboardSidebarProps {
  className?: string;
}

const menuItems = [
  { id: 'profile', label: 'Профиль', icon: User, path: '/creator-dashboard/profile' },
  { id: 'orders', label: 'Заказы', icon: ShoppingBag, path: '/creator-dashboard/orders' },
  { id: 'calendar', label: 'Календарь', icon: Calendar, path: '/creator-dashboard/calendar' },
  { id: 'crm', label: 'CRM', icon: ClipboardList, path: '/creator-dashboard/crm' },
  { id: 'finances', label: 'Финансы', icon: Wallet, path: '/creator-dashboard/finances' },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3, path: '/creator-dashboard/analytics' },
  { id: 'reviews', label: 'Отзывы', icon: Star, path: '/creator-dashboard/reviews' },
];

const bottomMenuItems = [
  { id: 'settings', label: 'Настройки', icon: Settings, path: '/creator-dashboard/settings' },
  { id: 'chat', label: 'Чат', icon: MessageSquare, path: '/creator-dashboard/chat' },
];

export function CreatorDashboardSidebar({ className }: CreatorDashboardSidebarProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Загрузка количества непрочитанных сообщений
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await creatorChatApi.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Обновление каждые 30 сек
    return () => clearInterval(interval);
  }, []);

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Мобильная кнопка-гамбургер */}
      <button
        className="fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-md lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Затемнение фона при открытом сайдбаре на мобильных */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-4 h-[72px] border-b border-gray-200">
          <img
            src="/images/TRIPGEN_logo_2.png"
            alt="TRIPGEN"
            className={cn(
              'transition-all duration-300',
              isCollapsed ? 'w-10 h-10' : 'w-9 h-9'
            )}
          />
          {!isCollapsed && (
            <span className="font-bold text-xl text-gray-900">TRIPGEN</span>
          )}
        </Link>

        {/* Main Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 h-10 rounded-xl transition-colors duration-200',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-gray-900' : 'text-gray-600'
                    )} />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Menu */}
        <div className="py-4 px-2 border-t border-gray-200 space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 h-10 rounded-xl transition-colors duration-200',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-gray-900' : 'text-gray-600'
                )} />
                {!isCollapsed && (
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.id === 'chat' && unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 h-10 rounded-xl transition-colors duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 text-gray-600" />
            {!isCollapsed && (
              <span className="font-medium text-sm">Выйти</span>
            )}
          </button>
        </div>

        {/* Collapse Button (Desktop only) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center h-10 border-t border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </aside>
    </>
  );
}
