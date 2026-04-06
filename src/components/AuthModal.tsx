import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { auth } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'email' | 'otp';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('email');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { refreshUser } = useAuth();

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Handle countdown for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Handle escape key
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Handle modal closing
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setEmail('');
    setOtp('');
    setStep('email');
    setErrorMessage('');
    setSuccessMessage('');
    setCountdown(0);
  };

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await auth.sendOTP(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось отправить код');
      }

      setSuccessMessage('Код отправлен на вашу почту!');
      setStep('otp');
      setCountdown(60); // 60 seconds cooldown
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || otp.length < 6) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    console.log('[AuthModal] Starting OTP verification...');
    const startTime = Date.now();
    
    try {
      const result = await auth.verifyOTP(email, otp);
      
      console.log('[AuthModal] Verify completed in', Date.now() - startTime, 'ms');
      
      if (result.session) {
        setSuccessMessage('Вход выполнен успешно!');
        
        // Refresh user in background
        refreshUser().catch(console.error);
        
        // Close modal immediately
        setTimeout(() => {
          resetForm();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('[AuthModal] Error verifying OTP:', err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await auth.sendOTP(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось отправить код');
      }

      setSuccessMessage('Новый код отправлен!');
      setCountdown(60);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setOtp(value);
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
                disabled={isLoading}
                className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>

              {step === 'otp' && (
                <button
                  onClick={() => setStep('email')}
                  disabled={isLoading}
                  className="absolute left-4 top-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Назад"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              <h2 className="text-2xl font-bold mb-2">
                {step === 'email' ? 'Добро пожаловать' : 'Подтверждение'}
              </h2>
              <p className="text-white/80 text-sm">
                {step === 'email' 
                  ? 'Войдите или зарегистрируйтесь для доступа к путешествиям'
                  : `Введите код из письма, отправленного на ${email}`
                }
              </p>
            </div>

            {/* Form */}
            <div className="p-6">
              {step === 'email' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
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
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full bg-black text-white py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLoading ? 'Отправка...' : 'Получить код'}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Код подтверждения
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={handleOtpChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-center text-lg tracking-widest font-mono"
                        placeholder="0000000000"
                        required
                        maxLength={11}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Введите код из письма
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="relative w-full bg-black text-white py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLoading ? 'Проверка...' : 'Войти'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || isLoading}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {countdown > 0 
                        ? `Отправить код повторно через ${countdown} сек` 
                        : 'Отправить код повторно'
                      }
                    </button>
                  </div>
                </form>
              )}

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

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </div>

              {/* Info text */}
              <div className="mt-6 text-center text-xs text-gray-500">
                {step === 'email' && (
                  <p>
                    Нажимая «Получить код», вы соглашаетесь с условиями использования и политикой конфиденциальности
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
