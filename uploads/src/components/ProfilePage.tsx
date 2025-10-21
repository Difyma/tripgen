import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Calendar, 
  Camera, 
  Lock, 
  ChevronRight, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Github,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MainNavbar } from './MainNavbar';
import Footer from './Footer';

interface UserProfile {
  displayName: string;
  email: string;
  avatar: string;
  role: 'user' | 'creator' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  socials: {
    github?: string;
    google?: string;
  };
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Временные данные для демонстрации
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    avatar: '/images/user.png',
    role: 'user',
    emailVerified: false,
    createdAt: user?.created_at || new Date().toISOString(),
    socials: {}
  });

  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Здесь будет логика загрузки файла
      console.log('Uploading file:', file);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Здесь будет логика смены пароля
      console.log('Changing password');
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика отправки письма для верификации
      console.log('Sending verification email');
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика удаления аккаунта
      console.log('Deleting account');
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBecomingCreator = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика подачи заявки на роль креатора
      console.log('Applying for creator role');
    } catch (error) {
      console.error('Error applying for creator role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setNewDisplayName(profile.displayName);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleNameSave = async () => {
    if (!newDisplayName.trim()) return;
    
    setIsLoading(true);
    try {
      // Здесь будет логика сохранения имени в базе данных
      console.log('Saving new display name:', newDisplayName);
      setProfile({ ...profile, displayName: newDisplayName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setNewDisplayName(profile.displayName);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Необходима авторизация</h2>
          <p className="text-gray-600">Пожалуйста, войдите в систему для просмотра профиля</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainNavbar onAuthClick={() => {}} />
      <div className="min-h-screen bg-gray-50/50 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 mt-2">Управление личными данными и настройками</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <button
                  onClick={handleAvatarClick}
                  className="group relative w-24 h-24 rounded-full overflow-hidden border-4 border-white/10"
                >
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="text-2xl font-bold bg-white/10 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Введите имя"
                      />
                      <button
                        onClick={handleNameSave}
                        disabled={isLoading}
                        className="p-1 rounded-lg hover:bg-white/10 text-green-400 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNameCancel}
                        className="p-1 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white truncate">
                        {profile.displayName}
                      </h2>
                      <button
                        onClick={handleNameEdit}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                    {profile.role === 'creator' ? 'Креатор' : profile.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{profile.email}</span>
                  {profile.emailVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <button
                      onClick={handleEmailVerification}
                      disabled={isLoading}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Подтвердить email
                    </button>
                  )}
                </div>
                <p className="text-gray-400 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Дата регистрации: {format(new Date(profile.createdAt), 'dd MMMM yyyy', { locale: ru })}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Security Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Безопасность</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">Изменить пароль</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Connected Accounts */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Связанные аккаунты</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <Github className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">GitHub</span>
                    </div>
                    <span className="text-sm text-gray-500">Не подключено</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">Email</span>
                    </div>
                    <span className="text-sm text-gray-500">Подключено</span>
                  </button>
                </div>
              </div>

              {/* Creator Application */}
              {profile.role === 'user' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleBecomingCreator}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    Стать креатором
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Создавайте и делитесь своими путешествиями с другими пользователями
                  </p>
                </div>
              )}

              {/* Account Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить аккаунт</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-900 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Выход...' : 'Выйти из аккаунта'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Изменение пароля</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Текущий пароль
                    </label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Подтвердите новый пароль
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Удаление аккаунта</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо и приведет к потере всех данных.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Удаление...' : 'Удалить аккаунт'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
      <Footer />
    </>
  );
};

export default ProfilePage; 