import { TrendingUp, Users, ShoppingCart, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


const topTours = [
  { name: 'Тур по Алтаю', bookings: 45, revenue: 2025000, rating: 4.9 },
  { name: 'Байкал зимой', bookings: 38, revenue: 1444000, rating: 4.8 },
  { name: 'Камчатка экстрим', bookings: 22, revenue: 1958000, rating: 4.9 },
  { name: 'Карелия летом', bookings: 31, revenue: 992000, rating: 4.7 },
];

const recentReviews = [
  { author: 'Анна П.', tour: 'Тур по Алтаю', rating: 5, text: 'Прекрасный тур! Всё организовано на высшем уровне.', date: '2026-02-20' },
  { author: 'Сергей И.', tour: 'Байкал зимой', rating: 5, text: 'Незабываемые впечатления, обязательно приеду ещё!', date: '2026-02-18' },
  { author: 'Мария С.', tour: 'Камчатка экстрим', rating: 4, text: 'Отличный тур, но погода подвела немного.', date: '2026-02-15' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-gray-500 mt-1">Статистика и ключевые показатели</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Выручка</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">₽4.2M</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              +23% к прошлому месяцу
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Бронирования</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">136</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              +15% к прошлому месяцу
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Новые клиенты</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">48</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              +8% к прошлому месяцу
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Средний рейтинг</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">4.8</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              На основе 156 отзывов
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Tours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Топ туров</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topTours.map((tour, index) => (
              <div key={tour.name} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{tour.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      {tour.bookings} броней
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {tour.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {tour.revenue.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-xs text-gray-500">выручка</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Последние отзывы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReviews.map((review, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{review.author}</h4>
                    <p className="text-sm text-gray-500">{review.tour}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.text}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString('ru-RU')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Popular Destinations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Популярные направления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { name: 'Алтай', bookings: 45, percent: 33 },
              { name: 'Байкал', bookings: 38, percent: 28 },
              { name: 'Камчатка', bookings: 22, percent: 16 },
              { name: 'Карелия', bookings: 31, percent: 23 },
            ].map((dest) => (
              <div key={dest.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{dest.name}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dest.bookings}</div>
                <p className="text-sm text-gray-500">бронирований</p>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full"
                    style={{ width: `${dest.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{dest.percent}% от всех</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
