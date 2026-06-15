import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, CheckCircle, Info, MessageSquare } from 'lucide-react';
import type { ReadyTour } from '../data/readyTours';
import { tourApi } from '../services/tourApi';

interface BookingModalProps {
  tour: ReadyTour;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = 'form' | 'success';

const DEFAULT_PAYMENT_METHOD = 'Оплата напрямую организатору';
const DEFAULT_PAYMENT_INSTRUCTIONS =
  'После отправки заявки организатор подтвердит наличие мест и пришлет удобный способ оплаты: СБП, банковские реквизиты или платежную ссылку.';

function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function createBookingReference(): string {
  return `TRG-${Date.now().toString(36).toUpperCase()}`;
}

export function BookingModal({ tour, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('form');
  const [bookingReference, setBookingReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
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
  const paymentMethodTitle = tour.paymentMethodTitle || DEFAULT_PAYMENT_METHOD;
  const paymentInstructions = tour.paymentInstructions || DEFAULT_PAYMENT_INSTRUCTIONS;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { booking } = await tourApi.createBooking({
        tourId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tour.id) ? tour.id : undefined,
        sourceTourId: tour.id,
        creatorId: tour.creatorId,
        tourName: tour.title,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.phone,
        guests: formData.participants,
        preferredDate: formData.preferredDate || undefined,
        comments: formData.comments,
        amount: totalPrice,
        paymentMethodTitle,
      });
      setBookingReference(booking.id || createBookingReference());
      setStep('success');
    } catch (error) {
      console.error('Failed to create tour booking request:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось отправить заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setBookingReference('');
    setSubmitError('');
    setIsSubmitting(false);
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        >
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 'form' ? 'Заявка на бронирование' : 'Заявка отправлена'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{tour.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="font-semibold">Оплата в MVP проходит напрямую организатору.</p>
                      <p className="mt-1 text-blue-800">
                        TripGen не принимает деньги на этом этапе. Мы передадим заявку организатору, он подтвердит места и отправит способ оплаты.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия *</label>
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Количество участников *</label>
                    <div className="flex flex-wrap items-center gap-4">
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
                      <span className="text-sm text-gray-500">(доступно: {tour.spotsLeft} мест)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Предпочтительная дата</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Комментарии</label>
                    <textarea
                      rows={3}
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                      placeholder="Особые пожелания, аллергии, вопросы по оплате"
                    />
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-600">{tour.price} × {formData.participants} чел.</span>
                      <span className="text-xl font-semibold text-gray-900">{formatRub(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="font-medium text-gray-900">{paymentMethodTitle}</p>
                    <p className="mt-2 text-sm text-gray-600">{paymentInstructions}</p>
                  </div>

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
                      Я понимаю, что заявка не является оплаченной бронью. Организатор подтвердит наличие мест и условия оплаты отдельно.
                    </label>
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    {isSubmitting ? 'Отправляем заявку...' : 'Отправить заявку организатору'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-center text-2xl font-semibold text-gray-900 mb-3">Заявка отправлена</h3>
                <p className="text-center text-gray-600 mb-6">
                  Мы зафиксировали заявку и передадим ее организатору. Оплата пройдет напрямую после подтверждения мест.
                </p>

                <div className="space-y-4 rounded-xl bg-gray-50 p-4 mb-6 text-left">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Номер заявки</p>
                    <p className="text-lg font-mono font-semibold text-gray-900">{bookingReference}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-gray-500">Участники</p>
                      <p className="font-medium text-gray-900">{formData.participants} чел.</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Сумма тура</p>
                      <p className="font-medium text-gray-900">{formatRub(totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Контакт</p>
                      <p className="font-medium text-gray-900">{formData.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Следующий шаг</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Организатор свяжется с вами, подтвердит места и отправит реквизиты или платежную ссылку.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Понятно
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
