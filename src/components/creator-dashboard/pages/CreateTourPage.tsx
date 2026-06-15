import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, Upload, Star, MapPin, Calendar, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SimpleModal } from '@/components/ui/simple-modal';
import { tourApi } from '@/services/tourApi';

interface DayItinerary {
  day: number;
  title: string;
  description: string;
  meals: string[];
}

interface Accommodation {
  name: string;
  description: string;
  type: string;
}

const categories = [
  { value: 'nature', label: 'Природа', categoryName: 'Природа' },
  { value: 'excursion', label: 'Экскурсии', categoryName: 'Экскурсии' },
  { value: 'active', label: 'Активный отдых', categoryName: 'Активный отдых' },
  { value: 'extreme', label: 'Экстрим', categoryName: 'Экстрим' },
  { value: 'cultural', label: 'Культурный', categoryName: 'Культурный' },
  { value: 'gastronomic', label: 'Гастрономический', categoryName: 'Гастрономический' },
];

const mealOptions = ['завтрак', 'обед', 'ужин', 'перекус'];

export default function CreateTourPage() {
  const navigate = useNavigate();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Основная информация
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    region: '',
    duration: '',
    durationDays: 7,
    groupSize: '',
    minGroupSize: 4,
    maxGroupSize: 12,
    price: '',
    priceValue: 0,
    paymentMethodTitle: 'Оплата напрямую организатору',
    paymentInstructions: '',
    category: 'nature',
    categoryName: 'Природа',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    shortDescription: '',
    description: '',
    image: '/images/Traveling_around_Altai.jpg',
    images: [] as string[],
    highlights: [] as string[],
    activities: [] as string[],
    requirements: [] as string[],
    bestTime: '',
    spotsLeft: 8,
    startDate: '',
    endDate: '',
    guideName: '',
    guideExperience: '',
    guideLanguages: [] as string[],
  });

  // Динамические списки
  const [itinerary, setItinerary] = useState<DayItinerary[]>([
    { day: 1, title: '', description: '', meals: [] }
  ]);
  const [accommodation, setAccommodation] = useState<Accommodation[]>([
    { name: '', description: '', type: '' }
  ]);
  const [includes, setIncludes] = useState<string[]>(['']);
  const [excludes, setExcludes] = useState<string[]>(['']);

  // Временные поля для добавления элементов
  const [newHighlight, setNewHighlight] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const addItineraryDay = () => {
    setItinerary([...itinerary, { 
      day: itinerary.length + 1, 
      title: '', 
      description: '', 
      meals: [] 
    }]);
  };

  const removeItineraryDay = (index: number) => {
    const newItinerary = itinerary.filter((_, i) => i !== index);
    // Перенумеруем дни
    setItinerary(newItinerary.map((day, i) => ({ ...day, day: i + 1 })));
  };

  const updateItineraryDay = (index: number, field: keyof DayItinerary, value: any) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const toggleMeal = (dayIndex: number, meal: string) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    if (day.meals.includes(meal)) {
      day.meals = day.meals.filter(m => m !== meal);
    } else {
      day.meals = [...day.meals, meal];
    }
    setItinerary(newItinerary);
  };

  const addAccommodation = () => {
    setAccommodation([...accommodation, { name: '', description: '', type: '' }]);
  };

  const removeAccommodation = (index: number) => {
    setAccommodation(accommodation.filter((_, i) => i !== index));
  };

  const updateAccommodation = (index: number, field: keyof Accommodation, value: string) => {
    const newAcc = [...accommodation];
    newAcc[index] = { ...newAcc[index], [field]: value };
    setAccommodation(newAcc);
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData({ ...formData, highlights: [...formData.highlights, newHighlight.trim()] });
      setNewHighlight('');
    }
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setFormData({ ...formData, activities: [...formData.activities, newActivity.trim()] });
      setNewActivity('');
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({ ...formData, requirements: [...formData.requirements, newRequirement.trim()] });
      setNewRequirement('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData({ ...formData, highlights: formData.highlights.filter((_, i) => i !== index) });
  };

  const removeActivity = (index: number) => {
    setFormData({ ...formData, activities: formData.activities.filter((_, i) => i !== index) });
  };

  const removeRequirement = (index: number) => {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await tourApi.createTour({
        ...formData,
        guideInfo: {
          name: formData.guideName,
          experience: formData.guideExperience,
          languages: formData.guideLanguages,
        },
        itinerary,
        accommodation,
        includes: includes.filter(i => i.trim()),
        excludes: excludes.filter(i => i.trim()),
      });
      setIsSubmitModalOpen(true);
    } catch (error) {
      console.error('Failed to create tour:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать тур');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.location && formData.region && formData.shortDescription;
      case 2:
        return formData.duration && formData.price && formData.priceValue > 0;
      case 3:
        return itinerary.every(day => day.title && day.description);
      case 4:
        return formData.description && formData.highlights.length > 0;
      default:
        return true;
    }
  };

  const steps = [
    { id: 1, title: 'Основное', description: 'Название, локация, описание' },
    { id: 2, title: 'Детали', description: 'Цена, длительность, группа' },
    { id: 3, title: 'Программа', description: 'По дням' },
    { id: 4, title: 'Описание', description: 'Детали, что включено' },
    { id: 5, title: 'Проверка', description: 'Предпросмотр' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Создание тура</h1>
          <p className="text-gray-500 mt-1">Заполните информацию о новом туре</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/creator-dashboard/crm')}>
            Отмена
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Назад
            </Button>
          )}
          {currentStep < 5 ? (
            <Button 
              className="bg-gray-900 hover:bg-gray-800"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid()}
            >
              Далее
            </Button>
          ) : (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Сохраняем...' : 'Создать тур'}
            </Button>
          )}
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Steps */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-left transition-colors ${
              currentStep === step.id
                ? 'bg-gray-900 text-white'
                : currentStep > step.id
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="font-medium text-sm">{step.id}. {step.title}</div>
            <div className={`text-xs ${currentStep === step.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {step.description}
            </div>
          </button>
        ))}
      </div>

      {/* Step 1: Основная информация */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название тура *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Тайга и водопады Алтая"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Категория *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      const cat = categories.find(c => c.value === value);
                      setFormData({ 
                        ...formData, 
                        category: value,
                        categoryName: cat?.categoryName || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Локация (город/местность) *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Например: Горный Алтай"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Регион *</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Например: Республика Алтай"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Краткое описание (для карточки) *</Label>
                <Textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Краткое описание тура для отображения в карточке..."
                  rows={2}
                />
                <p className="text-xs text-gray-500">{formData.shortDescription.length}/150 символов рекомендуется</p>
              </div>

              <div className="space-y-2">
                <Label>Главное изображение</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Нажмите для загрузки или перетащите файл</p>
                  <p className="text-xs text-gray-400">PNG, JPG до 10MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Детали */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Длительность и цена
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Длительность (текст) *</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Например: 7 дней"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Количество дней *</Label>
                  <Input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Сложность</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Лёгкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="hard">Сложный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цена для пользователя (текст) *</Label>
                  <Input
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Например: 85 000 ₽"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цена для пользователя (число) *</Label>
                  <Input
                    type="number"
                    value={formData.priceValue}
                    onChange={(e) => setFormData({ ...formData, priceValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">MVP-оплата без эквайринга</p>
                <p className="mt-1 text-sm text-blue-700">
                  Пользователь оставляет заявку, а оплату получает организатор напрямую. TripGen пока не принимает платежи внутри сервиса.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Название способа оплаты</Label>
                  <Input
                    value={formData.paymentMethodTitle}
                    onChange={(e) => setFormData({ ...formData, paymentMethodTitle: e.target.value })}
                    placeholder="Например: СБП на ИП Иванов / платежная ссылка / банковские реквизиты"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Инструкции по оплате для клиента</Label>
                  <Textarea
                    value={formData.paymentInstructions}
                    onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                    placeholder="Например: после подтверждения заявки отправим ссылку на оплату или реквизиты для СБП."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Не указывайте чувствительные данные, если тур еще проходит модерацию.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Группа и даты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Размер группы</Label>
                  <Input
                    value={formData.groupSize}
                    onChange={(e) => setFormData({ ...formData, groupSize: e.target.value })}
                    placeholder="Например: до 12 человек"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Мин. группа</Label>
                  <Input
                    type="number"
                    value={formData.minGroupSize}
                    onChange={(e) => setFormData({ ...formData, minGroupSize: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Макс. группа</Label>
                  <Input
                    type="number"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData({ ...formData, maxGroupSize: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Свободных мест</Label>
                  <Input
                    type="number"
                    value={formData.spotsLeft}
                    onChange={(e) => setFormData({ ...formData, spotsLeft: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата начала</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата окончания</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Лучшее время для тура</Label>
                <Input
                  value={formData.bestTime}
                  onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
                  placeholder="Например: Май - Сентябрь"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Программа по дням */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Программа по дням
              </CardTitle>
              <Button onClick={addItineraryDay} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить день
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {itinerary.map((day, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <Badge variant="secondary">День {day.day}</Badge>
                    {itinerary.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-500"
                        onClick={() => removeItineraryDay(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Заголовок дня *</Label>
                    <Input
                      value={day.title}
                      onChange={(e) => updateItineraryDay(index, 'title', e.target.value)}
                      placeholder="Например: Прибытие и знакомство с городом"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Описание *</Label>
                    <Textarea
                      value={day.description}
                      onChange={(e) => updateItineraryDay(index, 'description', e.target.value)}
                      placeholder="Подробное описание программы на этот день..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Питание</Label>
                    <div className="flex gap-2">
                      {mealOptions.map((meal) => (
                        <button
                          key={meal}
                          onClick={() => toggleMeal(index, meal)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            day.meals.includes(meal)
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {meal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Проживание</CardTitle>
              <Button onClick={addAccommodation} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {accommodation.map((acc, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Вариант {index + 1}</Badge>
                    {accommodation.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => removeAccommodation(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input
                        value={acc.name}
                        onChange={(e) => updateAccommodation(index, 'name', e.target.value)}
                        placeholder="Название отеля/гостевого дома"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Тип</Label>
                      <Input
                        value={acc.type}
                        onChange={(e) => updateAccommodation(index, 'type', e.target.value)}
                        placeholder="Например: Гостевой дом"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Input
                      value={acc.description}
                      onChange={(e) => updateAccommodation(index, 'description', e.target.value)}
                      placeholder="Краткое описание проживания"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Описание и включения */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Полное описание</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробное описание тура..."
                rows={8}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Основные моменты (highlights)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Добавить highlight..."
                  onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                />
                <Button onClick={addHighlight} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((highlight, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {highlight}
                    <button
                      onClick={() => removeHighlight(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">✓ Что включено</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {includes.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newIncludes = [...includes];
                        newIncludes[index] = e.target.value;
                        setIncludes(newIncludes);
                      }}
                      placeholder="Например: Проживание в отелях"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setIncludes(includes.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIncludes([...includes, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">✗ Что не включено</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {excludes.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newExcludes = [...excludes];
                        newExcludes[index] = e.target.value;
                        setExcludes(newExcludes);
                      }}
                      placeholder="Например: Перелёт до места начала"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setExcludes(excludes.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setExcludes([...excludes, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Активности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Добавить активность..."
                  onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                />
                <Button onClick={addActivity} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((activity, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {activity}
                    <button
                      onClick={() => removeActivity(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Требования
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Добавить требование..."
                  onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                />
                <Button onClick={addRequirement} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 bg-orange-100 text-orange-800">
                    {req}
                    <button
                      onClick={() => removeRequirement(index)}
                      className="ml-2 text-orange-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Предпросмотр */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр карточки тура</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden max-w-md">
                <div className="h-48 bg-gray-200 relative">
                  <img 
                    src={formData.image} 
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-white/90 text-gray-900">
                    {formData.categoryName}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900">{formData.title || 'Название тура'}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {formData.location || 'Локация'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {formData.shortDescription || 'Описание тура'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formData.duration || '0 дней'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formData.groupSize || '0 чел'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900">{formData.price || '0 ₽'}</span>
                    <Button size="sm">Подробнее</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Проверка данных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {formData.title ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Название тура</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.location ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Локация</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.shortDescription ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Краткое описание</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.priceValue > 0 ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Цена для пользователя</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.paymentMethodTitle ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Способ получения оплаты</span>
                </div>
                <div className="flex items-center gap-2">
                  {itinerary.every(d => d.title && d.description) ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span>Программа по дням ({itinerary.length} дней)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Modal */}
      <SimpleModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          navigate('/creator-dashboard/crm');
        }}
        title="Тур создан!"
      >
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Ваш тур "{formData.title}" успешно создан и отправлен на модерацию. 
            После проверки администратором он появится на сайте.
          </p>
          <Button 
            className="bg-gray-900 hover:bg-gray-800"
            onClick={() => navigate('/creator-dashboard/crm')}
          >
            Перейти к моим турам
          </Button>
        </div>
      </SimpleModal>
    </div>
  );
}
