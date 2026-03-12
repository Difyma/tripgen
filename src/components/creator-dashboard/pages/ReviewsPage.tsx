import { useState } from 'react';
import { Star, Search, Filter, ThumbsUp, MessageSquare, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Review {
  id: string;
  author: string;
  email: string;
  tour: string;
  rating: number;
  text: string;
  date: string;
  status: 'published' | 'pending' | 'flagged';
  helpful: number;
  reply?: string;
}

const mockReviews: Review[] = [
  { id: '1', author: 'Анна Петрова', email: 'anna@example.com', tour: 'Тур по Алтаю', rating: 5, text: 'Прекрасный тур! Всё организовано на высшем уровне. Гид был очень внимательным, природа просто восхитительная. Обязательно поеду ещё!', date: '2026-02-20', status: 'published', helpful: 12 },
  { id: '2', author: 'Сергей Иванов', email: 'sergey@example.com', tour: 'Байкал зимой', rating: 5, text: 'Незабываемые впечатления! Лёд Байкала - это что-то невероятное. Организация на 5+, все переезды и экскурсии были чётко спланированы.', date: '2026-02-18', status: 'published', helpful: 8 },
  { id: '3', author: 'Мария Сидорова', email: 'maria@example.com', tour: 'Камчатка экстрим', rating: 4, text: 'Отличный тур, но погода подвела немного. Пришлось изменить программу, но гид оперативно всё перестроил. Вулканы - это потрясающе!', date: '2026-02-15', status: 'published', helpful: 5 },
  { id: '4', author: 'Дмитрий Козлов', email: 'dmitry@example.com', tour: 'Карелия летом', rating: 3, text: 'Тур был хорошим, но жильё не совсем соответствовало ожиданиям. Природа Карелии красивая, водопады шикарные.', date: '2026-02-10', status: 'pending', helpful: 2 },
  { id: '5', author: 'Елена Волкова', email: 'elena@example.com', tour: 'Тур по Алтаю', rating: 5, text: 'Спасибо за чудесный отдых! Всё продумано до мелочей, еда вкусная, экскурсии интересные.', date: '2026-02-08', status: 'flagged', helpful: 0 },
];

const statusMap = {
  published: { label: 'Опубликован', color: 'bg-green-100 text-green-700' },
  pending: { label: 'На модерации', color: 'bg-yellow-100 text-yellow-700' },
  flagged: { label: 'Отмечен', color: 'bg-red-100 text-red-700' },
};

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = 
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.tour.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && review.status === activeTab;
  });

  const averageRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Отзывы</h1>
          <p className="text-gray-500 mt-1">Управляйте отзывами клиентов</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">/ 5</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Всего отзывов', value: '156' },
          { label: '5 звёзд', value: '124', color: 'text-yellow-600' },
          { label: '4 звезды', value: '21', color: 'text-gray-600' },
          { label: 'На модерации', value: '3', color: 'text-yellow-600' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className={cn('text-2xl font-bold', stat.color || 'text-gray-900')}>{stat.value}</div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск отзывов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Фильтры
            </Button>
          </div>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="published">Опубликованы</TabsTrigger>
              <TabsTrigger value="pending">На модерации</TabsTrigger>
              <TabsTrigger value="flagged">Отмеченные</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="m-0">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {review.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.author}</h4>
                            <p className="text-sm text-gray-500">{review.email}</p>
                          </div>
                          <Badge variant="secondary" className={statusMap[review.status].color}>
                            {statusMap[review.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{review.tour}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <p className="mt-3 text-gray-600">{review.text}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                            <ThumbsUp className="w-4 h-4" />
                            Полезно ({review.helpful})
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                            <MessageSquare className="w-4 h-4" />
                            Ответить
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 ml-auto">
                            <Flag className="w-4 h-4" />
                            Отметить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
