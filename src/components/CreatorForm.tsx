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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-cal">Стать креатором TripGen</DialogTitle>
          <DialogDescription>
            Заполните форму, чтобы присоединиться к сообществу креаторов TripGen. 
            Мы рассмотрим вашу заявку и свяжемся с вами.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя *</Label>
            <Input
              id="fullName"
              placeholder="Иван Иванов"
              {...register('fullName')}
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                placeholder="+7 (999) 999-99-99"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Социальные сети</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="@username"
                  {...register('instagram')}
                />
              </div>
              <div>
                <Label htmlFor="telegram">Telegram</Label>
                <Input
                  id="telegram"
                  placeholder="@username"
                  {...register('telegram')}
                />
              </div>
              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  placeholder="channel_url"
                  {...register('youtube')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">О себе *</Label>
            <Textarea
              id="bio"
              placeholder="Расскажите о себе, своих интересах и увлечениях..."
              {...register('bio')}
              className={`min-h-[100px] ${errors.bio ? 'border-red-500' : ''}`}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Опыт путешествий *</Label>
            <Textarea
              id="experience"
              placeholder="Расскажите о ваших путешествиях, любимых местах и направлениях..."
              {...register('experience')}
              className={`min-h-[100px] ${errors.experience ? 'border-red-500' : ''}`}
            />
            {errors.experience && (
              <p className="text-sm text-red-500">{errors.experience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectations">Почему хотите стать креатором? *</Label>
            <Textarea
              id="expectations"
              placeholder="Расскажите о ваших ожиданиях от сотрудничества с TripGen..."
              {...register('expectations')}
              className={`min-h-[100px] ${errors.expectations ? 'border-red-500' : ''}`}
            />
            {errors.expectations && (
              <p className="text-sm text-red-500">{errors.expectations.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 