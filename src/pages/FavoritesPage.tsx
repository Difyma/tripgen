import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Избранное</h1>
      <p className="text-gray-500 max-w-md">
        Здесь будут отображаться сохранённые места, маршруты и предложения.
      </p>
    </div>
  );
}
