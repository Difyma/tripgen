import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import type { ReadyTour } from '../data/readyTours';

interface BookingModalProps {
  tour: ReadyTour;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = 'form' | 'payment' | 'success';

export function BookingModal({ tour, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    participants: 1,
    preferredDate: '',
    comments: '',
    agreeToTerms: false,
  });

  const totalPrice = tour.priceValue * formData.participants;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsLoading(true);
    // Имитация процесса оплаты
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setStep('success');
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      participants: 1,
      preferredDate: '',
      comments: '',
      agreeToTerms: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 'form' && 'Бронирование тура'}
                {step === 'payment' && 'Оплата'}
                {step === 'success' && 'Бронирование подтверждено'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{tour.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handleSubmitForm} className="space-y-5">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Имя *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        placeholder="Введите имя"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        placeholder="Введите фамилию"
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        placeholder="+7 (999) 999-99-99"
                      />
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество участников *
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, participants: Math.max(1, formData.participants - 1) })}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        -
                      </button>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span className="text-lg font-medium w-8 text-center">{formData.participants}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, participants: Math.min(tour.spotsLeft, formData.participants + 1) })}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-500">
                        (доступно: {tour.spotsLeft} мест)
                      </span>
                    </div>
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Предпочтительная дата
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Комментарии
                    </label>
                    <textarea
                      rows={3}
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                      placeholder="Особые пожелания, аллергии, и т.д."
                    />
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Я согласен с{' '}
                      <a href="#" className="text-gray-900 underline">условиями бронирования</a>
                      {' '}и{' '}
                      <a href="#" className="text-gray-900 underline">политикой отмены</a>
                    </label>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {tour.price} × {formData.participants} чел.
                      </span>
                      <span className="text-xl font-semibold text-gray-900">
                        {totalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Перейти к оплате
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Детали бронирования</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тур</span>
                      <span className="text-gray-900">{tour.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Участники</span>
                      <span className="text-gray-900">{formData.participants} чел.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Контакт</span>
                      <span className="text-gray-900">{formData.email}</span>
                    </div>
                    {formData.preferredDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Дата</span>
                        <span className="text-gray-900">{new Date(formData.preferredDate).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-900">Итого к оплате</span>
                      <span className="text-xl font-bold text-gray-900">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Способ оплаты</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-900 rounded-xl cursor-pointer">
                      <input type="radio" name="payment" defaultChecked className="w-4 h-4" />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="flex-1">Банковская карта</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                      <input type="radio" name="payment" className="w-4 h-4" />
                      <span className="text-xl">📱</span>
                      <span className="flex-1">SberPay</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                      <input type="radio" name="payment" className="w-4 h-4" />
                      <span className="text-xl">💳</span>
                      <span className="flex-1">Tinkoff Pay</span>
                    </label>
                  </div>
                </div>

                {/* Card Form (simplified) */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер карты
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Срок действия
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>Оплатить {totalPrice.toLocaleString('ru-RU')} ₽</>
                  )}
                </button>

                <button
                  onClick={() => setStep('form')}
                  className="w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Вернуться к данным
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Бронирование подтверждено!
                </h3>
                <p className="text-gray-600 mb-6">
                  Мы отправили подтверждение на {formData.email}.<br />
                  Наш менеджер свяжется с вами в ближайшее время.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600 mb-1">Номер бронирования:</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">TRG-{Date.now().toString(36).toUpperCase()}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Отлично!
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
