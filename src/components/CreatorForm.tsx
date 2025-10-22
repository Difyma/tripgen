import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const creatorFormSchema = z.object({
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  instagram: z.string().optional(),
  telegram: z.string().optional(),
  youtube: z.string().optional(),
  bio: z.string().min(50, 'Расскажите о себе подробнее (минимум 50 символов)'),
  experience: z.string().min(30, 'Опишите ваш опыт путешествий (минимум 30 символов)'),
  expectations: z.string().min(30, 'Расскажите, почему хотите стать креатором (минимум 30 символов)')
});

type CreatorFormData = z.infer<typeof creatorFormSchema>;

interface CreatorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorForm = ({ isOpen, onClose }: CreatorFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreatorFormData>({
    resolver: zodResolver(creatorFormSchema)
  });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onSubmit = async (data: CreatorFormData) => {
    try {
      setIsSubmitting(true);
      const apiUrl = '/api/creators';
      console.log('Submitting form data to:', apiUrl, data);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      const contentType = response.headers.get('content-type');
      let errorData;
      
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (!response.ok) {
          errorData = result;
          console.log('Error response data:', errorData);
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }
        console.log('Success response data:', result);
        toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
        reset();
        onClose();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        url: '/api/creators'
      });
      toast.error(
        error.message || 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-[1000]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Закрыть форму"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-cal text-center">Стать креатором TripGen</h2>
              <p className="text-lg text-gray-600 text-center mt-4">
                Заполните форму, чтобы присоединиться к сообществу креаторов TripGen. 
                Мы рассмотрим вашу заявку и свяжемся с вами.
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="fullName" className="text-lg font-medium">Полное имя *</Label>
                <Input
                  id="fullName"
                  placeholder="Иван Иванов"
                  {...register('fullName')}
                  className={`h-12 text-lg rounded-xl border-2 ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="email" className="text-lg font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email')}
                    className={`h-12 text-lg rounded-xl border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label htmlFor="phone" className="text-lg font-medium">Телефон *</Label>
                  <Input
                    id="phone"
                    placeholder="+7 (999) 999-99-99"
                    {...register('phone')}
                    className={`h-12 text-lg rounded-xl border-2 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-medium">Социальные сети</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="instagram" className="text-base">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      {...register('instagram')}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="telegram" className="text-base">Telegram</Label>
                    <Input
                      id="telegram"
                      placeholder="@username"
                      {...register('telegram')}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="youtube" className="text-base">YouTube</Label>
                    <Input
                      id="youtube"
                      placeholder="channel_url"
                      {...register('youtube')}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="bio" className="text-lg font-medium">О себе *</Label>
                <Textarea
                  id="bio"
                  placeholder="Расскажите о себе, своих интересах и увлечениях..."
                  {...register('bio')}
                  className={`min-h-[120px] text-lg rounded-xl border-2 p-4 ${errors.bio ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="experience" className="text-lg font-medium">Опыт путешествий *</Label>
                <Textarea
                  id="experience"
                  placeholder="Расскажите о ваших путешествиях, любимых местах и направлениях..."
                  {...register('experience')}
                  className={`min-h-[120px] text-lg rounded-xl border-2 p-4 ${errors.experience ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.experience && (
                  <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="expectations" className="text-lg font-medium">Почему хотите стать креатором? *</Label>
                <Textarea
                  id="expectations"
                  placeholder="Расскажите о ваших ожиданиях от сотрудничества с TripGen..."
                  {...register('expectations')}
                  className={`min-h-[120px] text-lg rounded-xl border-2 p-4 ${errors.expectations ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.expectations && (
                  <p className="text-red-500 text-sm mt-1">{errors.expectations.message}</p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-6">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  type="button"
                  className="h-12 px-6 text-lg rounded-xl border-2 border-gray-200 hover:bg-gray-50"
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 px-8 text-lg bg-black text-white rounded-xl hover:bg-gray-900 disabled:opacity-50"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 