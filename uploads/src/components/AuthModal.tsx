import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useRateLimitStore } from '../lib/rateLimit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [initialWaitTime, setInitialWaitTime] = useState(0);
  const { signInOrSignUp, loading } = useAuth();
  const { isLimited, limitExpiry, clearRateLimit } = useRateLimitStore();
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Add escape key handler
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Handle escape key
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Handle modal closing
  const handleClose = () => {
    if (!loading) {
      // Reset form state
      setEmail('');
      setPassword('');
      setErrorMessage('');
      setSuccessMessage('');
      onClose();
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLimited && limitExpiry) {
      const updateTimeRemaining = () => {
        const remaining = Math.max(0, Math.ceil((limitExpiry - Date.now()) / 1000));
        setWaitTime(remaining);
        
        if (remaining === 0) {
          clearRateLimit();
        }
      };
      
      updateTimeRemaining();
      timer = setInterval(updateTimeRemaining, 1000);
    } else {
      setWaitTime(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLimited, limitExpiry, clearRateLimit]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (waitTime > 0) {
      timer = setInterval(() => {
        setWaitTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsWaiting(false);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [waitTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWaiting || loading) return;

    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const result = await signInOrSignUp(email, password);
      if ((result as any).needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
        setPendingEmail(email);
        setErrorMessage('');
        return;
      }
      // Показываем сообщение об успехе
      setSuccessMessage('Авторизация успешна!');
      // Закрываем модальное окно через 1.5 секунды
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setErrorMessage('');
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error during authentication:', err);
      setErrorMessage(err.message);
      
      // Check if error message contains waiting time
      const waitTimeMatch = err.message.match(/подождите (\d+) секунд/);
      if (waitTimeMatch) {
        const seconds = parseInt(waitTimeMatch[1]);
        setIsWaiting(true);
        setWaitTime(seconds);
        setInitialWaitTime(seconds);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8 text-white">
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-2">
                Добро пожаловать
              </h2>
              <p className="text-white/80 text-sm">
                Войдите в существующий аккаунт или создайте новый для доступа к путешествиям
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="ваша@почта.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading || isWaiting}
                    className="relative w-full bg-black text-white py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                      {loading ? 'Подождите...' : 
                       isWaiting ? `Попробуйте через ${waitTime} сек` :
                       'Войти / Зарегистрироваться'}
                    </span>
                    {isWaiting && (
                      <div 
                        className="absolute inset-0 bg-gray-900 transition-all duration-1000 ease-linear"
                        style={{ 
                          width: `${(waitTime / initialWaitTime) * 100}%` 
                        }}
                      />
                    )}
                  </button>
                </div>
              </form>

              {/* Messages */}
              <div className="mt-4 space-y-3">
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm"
                  >
                    {successMessage}
                  </motion.div>
                )}

                {errorMessage && !needsEmailConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm"
                  >
                    <div>{errorMessage}</div>
                    {isLimited && (
                      <div className="mt-1 font-medium">
                        Осталось времени: {Math.floor(waitTime / 60)}:{(waitTime % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </motion.div>
                )}

                {needsEmailConfirmation && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-center mt-4">
                    Для входа на сайт подтвердите ваш email.<br />
                    Для этого перейдите в почту: <b>{pendingEmail}</b>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 