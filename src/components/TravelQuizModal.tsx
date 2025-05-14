import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TravelQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: QuizResults) => void;
}

interface QuizResults {
  travelStyle: string;
  preferences: string[];
  budget: string;
}

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    value: string;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "Какой стиль путешествия вам ближе?",
    options: [
      { text: "Активный отдых и приключения", value: "active" },
      { text: "Культурное погружение и экскурсии", value: "cultural" },
      { text: "Расслабленный отдых", value: "relaxed" },
      { text: "Гастрономические открытия", value: "food" }
    ]
  },
  {
    id: 2,
    text: "Где бы вы предпочли остановиться?",
    options: [
      { text: "Роскошный отель в центре", value: "luxury" },
      { text: "Уютный гестхаус", value: "guesthouse" },
      { text: "Аутентичный хостел", value: "hostel" },
      { text: "Апартаменты со своей кухней", value: "apartment" }
    ]
  },
  {
    id: 3,
    text: "Какой бюджет на день вы планируете?",
    options: [
      { text: "До 3000₽", value: "budget" },
      { text: "3000₽ - 7000₽", value: "medium" },
      { text: "7000₽ - 15000₽", value: "high" },
      { text: "Более 15000₽", value: "luxury" }
    ]
  },
  {
    id: 4,
    text: "Что для вас важнее всего в путешествии?",
    options: [
      { text: "Новые впечатления и эмоции", value: "experiences" },
      { text: "Комфорт и удобство", value: "comfort" },
      { text: "Знакомство с местной культурой", value: "culture" },
      { text: "Фотографии и социальные сети", value: "social" }
    ]
  },
  {
    id: 5,
    text: "Как вы предпочитаете планировать день?",
    options: [
      { text: "Детальный план по часам", value: "planned" },
      { text: "Основные точки, остальное спонтанно", value: "flexible" },
      { text: "Полная спонтанность", value: "spontaneous" },
      { text: "Следую рекомендациям местных", value: "local" }
    ]
  }
];

const TravelQuizModal = ({ isOpen, onClose, onComplete }: TravelQuizModalProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnswer = (value: string) => {
    setIsAnimating(true);
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      // Calculate results
      const results: QuizResults = {
        travelStyle: newAnswers[0],
        preferences: newAnswers.slice(1, -1),
        budget: newAnswers[2]
      };
      onComplete(results);
    }
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl mx-4">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question number */}
              <div className="text-sm font-medium text-gray-500">
                Вопрос {currentQuestion + 1} из {questions.length}
              </div>

              {/* Question */}
              <h2 className="text-2xl font-semibold text-gray-900">
                {questions[currentQuestion].text}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {questions[currentQuestion].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !isAnimating && handleAnswer(option.value)}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <span className="block text-base font-medium text-gray-900">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TravelQuizModal; 