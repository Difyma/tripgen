import { X, MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TripFormData) => void;
}

interface TripFormData {
  location: string;
  dates: string;
  travelers: number;
  budget: string;
  isRoadTrip: boolean;
  preferences: string[];
}

const travelVibes = [
  'Роскошный пляжный отдых',
  'Тропический рай',
  'Романтическое путешествие',
  'Культурное исследование',
  'Уединенная вилла',
  'Спа и велнес',
  'Гастрономический тур',
  'Морские круизы',
  'Приключения и природа',
  'Эксклюзивные курорты',
  'Традиции и обычаи',
  'Уединенные пляжи'
];

export function CreateTripModal({ isOpen, onClose, onSubmit }: CreateTripModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TripFormData>({
    location: '',
    dates: '',
    travelers: 2,
    budget: '',
    isRoadTrip: false,
    preferences: []
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onSubmit(formData);
      onClose();
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const togglePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-lg w-full max-w-[800px] overflow-hidden relative shadow-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="rounded-md p-2 hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {step === 1 ? 'Создать путешествие' : 'Какой стиль путешествия предпочитаете?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {step === 1 ? (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-6">
                {/* Where */}
                <div className="space-y-2">
                  <Label>Куда</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Место назначения"
                      className="pl-10"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="road-trip"
                      checked={formData.isRoadTrip}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isRoadTrip: checked as boolean }))
                      }
                    />
                    <Label htmlFor="road-trip" className="text-sm text-muted-foreground">
                      Автопутешествие?
                    </Label>
                  </div>
                </div>

                {/* When */}
                <div className="space-y-2">
                  <Label>Когда</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, dates: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите даты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Гибкие даты</SelectItem>
                      <SelectItem value="exact">Точные даты</SelectItem>
                      <SelectItem value="monthly">По месяцам</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Who */}
                <div className="space-y-2">
                  <Label>Кто</Label>
                  <Select 
                    value={formData.travelers.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите количество" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 путешественник</SelectItem>
                      <SelectItem value="2">2 путешественника</SelectItem>
                      <SelectItem value="3">3 путешественника</SelectItem>
                      <SelectItem value="4">4+ путешественника</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <Label>Бюджет</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите бюджет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Гибкий бюджет</SelectItem>
                      <SelectItem value="economy">Эконом</SelectItem>
                      <SelectItem value="moderate">Средний</SelectItem>
                      <SelectItem value="luxury">Люкс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image */}
              <div className="relative rounded-lg overflow-hidden bg-[#E6F4FF] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
                  alt="Иллюстрация создания путешествия"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/60">
                  <p className="text-2xl font-medium">Начните путешествие</p>
                  <p className="text-sm text-white/90">Спланируйте идеальную поездку с нами</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-muted-foreground text-center mb-8">Выберите один или несколько вариантов</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {travelVibes.slice(0, Math.ceil(travelVibes.length / 2)).map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => togglePreference(vibe)}
                    className={`w-full text-left px-6 py-3 rounded-full border transition-colors ${
                      formData.preferences.includes(vibe)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {travelVibes.slice(Math.ceil(travelVibes.length / 2)).map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => togglePreference(vibe)}
                    className={`w-full text-left px-6 py-3 rounded-full border transition-colors ${
                      formData.preferences.includes(vibe)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex gap-4">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                Пропустить
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {step === 1 ? 'Далее' : 'Создать маршрут'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 