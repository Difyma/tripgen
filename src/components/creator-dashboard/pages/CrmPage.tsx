import { useState } from 'react';
import { Search, Plus, Phone, Mail, MoreHorizontal, Filter, Download, MapPin, Calendar, Users, Clock, Eye, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'lead' | 'active' | 'vip' | 'inactive';
  tours: number;
  totalSpent: number;
  lastContact: string;
  notes: string;
}

interface CreatorTour {
  id: string;
  title: string;
  location: string;
  region: string;
  duration: string;
  durationDays: number;
  groupSize: string;
  price: string;
  priceValue: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  shortDescription: string;
  image: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  moderationNotes?: string;
}

const mockClients: Client[] = [
  { id: '1', name: 'Анна Петрова', email: 'anna@example.com', phone: '+7 (999) 123-45-67', status: 'vip', tours: 5, totalSpent: 250000, lastContact: '2026-02-20', notes: 'Предпочитает VIP-туры' },
  { id: '2', name: 'Сергей Иванов', email: 'sergey@example.com', phone: '+7 (999) 234-56-78', status: 'active', tours: 3, totalSpent: 120000, lastContact: '2026-02-18', notes: 'Интересуется зимними турами' },
  { id: '3', name: 'Мария Сидорова', email: 'maria@example.com', phone: '+7 (999) 345-67-89', status: 'lead', tours: 0, totalSpent: 0, lastContact: '2026-02-22', notes: 'Новый лид, запрос на Байкал' },
  { id: '4', name: 'Дмитрий Козлов', email: 'dmitry@example.com', phone: '+7 (999) 456-78-90', status: 'active', tours: 2, totalSpent: 80000, lastContact: '2026-02-15', notes: '' },
  { id: '5', name: 'Елена Волкова', email: 'elena@example.com', phone: '+7 (999) 567-89-01', status: 'inactive', tours: 1, totalSpent: 35000, lastContact: '2025-12-10', notes: 'Не была в турах давно' },
];

const mockTours: CreatorTour[] = [
  {
    id: '1',
    title: 'Тайга и водопады Алтая',
    location: 'Горный Алтай',
    region: 'Республика Алтай',
    duration: '7 дней',
    durationDays: 7,
    groupSize: 'до 12 человек',
    price: '85 000 ₽',
    priceValue: 85000,
    category: 'nature',
    difficulty: 'medium',
    shortDescription: 'Путешествие по самым живописным местам Алтайского края',
    image: '/images/Traveling_around_Altai.jpg',
    status: 'approved',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    title: 'Зимний Байкал',
    location: 'Остров Ольхон',
    region: 'Иркутская область',
    duration: '5 дней',
    durationDays: 5,
    groupSize: 'до 8 человек',
    price: '65 000 ₽',
    priceValue: 65000,
    category: 'nature',
    difficulty: 'easy',
    shortDescription: 'Лёд Байкала, ледяные пещеры и коньки',
    image: '/images/Traveling_around_Altai.jpg',
    status: 'pending',
    createdAt: '2026-03-01',
  },
  {
    id: '3',
    title: 'Камчатка: Земля медведей',
    location: 'Петропавловск-Камчатский',
    region: 'Камчатский край',
    duration: '10 дней',
    durationDays: 10,
    groupSize: 'до 6 человек',
    price: '180 000 ₽',
    priceValue: 180000,
    category: 'extreme',
    difficulty: 'hard',
    shortDescription: 'Вулканы, гейзеры и дикая природа Камчатки',
    image: '/images/Traveling_around_Altai.jpg',
    status: 'draft',
    createdAt: '2026-03-28',
  },
];

const statusMap = {
  lead: { label: 'Лид', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Активный', color: 'bg-green-100 text-green-700' },
  vip: { label: 'VIP', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Неактивный', color: 'bg-gray-100 text-gray-700' },
};

const tourStatusMap = {
  draft: { label: 'Черновик', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  pending: { label: 'На модерации', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Одобрен', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const categories = [
  { value: 'nature', label: 'Природа' },
  { value: 'excursion', label: 'Экскурсии' },
  { value: 'active', label: 'Активный отдых' },
  { value: 'extreme', label: 'Экстрим' },
  { value: 'cultural', label: 'Культурный' },
  { value: 'gastronomic', label: 'Гастрономический' },
];

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [tours, setTours] = useState<CreatorTour[]>(mockTours);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<CreatorTour | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    region: '',
    duration: '',
    durationDays: 7,
    groupSize: '',
    price: '',
    priceValue: 0,
    category: 'nature',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    shortDescription: '',
    description: '',
    includes: '',
    excludes: '',
  });

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.phone.includes(clientSearchTerm);
    
    if (clientFilter === 'all') return matchesSearch;
    return matchesSearch && client.status === clientFilter;
  });

  const handleCreateTour = () => {
    const newTour: CreatorTour = {
      id: Date.now().toString(),
      ...formData,
      image: '/images/Traveling_around_Altai.jpg',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTours([newTour, ...tours]);
    setIsCreateDialogOpen(false);
    setFormData({
      title: '',
      location: '',
      region: '',
      duration: '',
      durationDays: 7,
      groupSize: '',
      price: '',
      priceValue: 0,
      category: 'nature',
      difficulty: 'medium',
      shortDescription: '',
      description: '',
      includes: '',
      excludes: '',
    });
  };

  const handleSubmitForModeration = (tour: CreatorTour) => {
    setTours(tours.map(t => 
      t.id === tour.id ? { ...t, status: 'pending' as const } : t
    ));
    setIsSubmitDialogOpen(false);
    setSelectedTour(null);
  };

  const getDifficultyLabel = (difficulty: string) => {
    const map: Record<string, string> = {
      easy: 'Лёгкий',
      medium: 'Средний',
      hard: 'Сложный',
    };
    return map[difficulty] || difficulty;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-500 mt-1">Управляйте клиентами и турами</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Экспорт
          </Button>
          <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            Новый клиент
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="clients">Клиенты</TabsTrigger>
          <TabsTrigger value="tours">Мои туры</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Всего клиентов', value: '423', change: '+15 новых' },
              { label: 'Активных', value: '312', change: '74% от общего' },
              { label: 'Лидов', value: '28', change: 'Требуют обработки' },
              { label: 'VIP клиентов', value: '47', change: 'Топ сегмент' },
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Clients List */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Поиск клиентов..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Фильтры
                </Button>
              </div>
            </CardHeader>
            <Tabs value={clientFilter} onValueChange={setClientFilter}>
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-5 max-w-lg">
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="lead">Лиды</TabsTrigger>
                  <TabsTrigger value="active">Активные</TabsTrigger>
                  <TabsTrigger value="vip">VIP</TabsTrigger>
                  <TabsTrigger value="inactive">Неактивные</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={clientFilter} className="m-0">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredClients.map((client) => (
                      <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                <p className="text-sm text-gray-500">{client.email}</p>
                              </div>
                              <Badge variant="secondary" className={statusMap[client.status].color}>
                                {statusMap[client.status].label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </span>
                              <span>•</span>
                              <span>{client.tours} туров</span>
                              <span>•</span>
                              <span>{client.totalSpent.toLocaleString('ru-RU')} ₽</span>
                            </div>
                            {client.notes && (
                              <p className="text-sm text-gray-500 mt-2 bg-gray-100 p-2 rounded">
                                {client.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="outline" size="sm" className="h-8 gap-1">
                                <Phone className="w-3 h-3" />
                                Позвонить
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 gap-1">
                                <Mail className="w-3 h-3" />
                                Написать
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Подробнее</DropdownMenuItem>
                                  <DropdownMenuItem>Редактировать</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        </TabsContent>

        {/* Tours Tab */}
        <TabsContent value="tours" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Всего туров', value: tours.length.toString(), change: `${tours.filter(t => t.status === 'approved').length} опубликовано` },
              { label: 'На модерации', value: tours.filter(t => t.status === 'pending').length.toString(), change: 'Ожидают проверки' },
              { label: 'Черновики', value: tours.filter(t => t.status === 'draft').length.toString(), change: 'В работе' },
              { label: 'Отклонены', value: tours.filter(t => t.status === 'rejected').length.toString(), change: 'Требуют правок' },
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tours List */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Поиск туров..."
                    className="pl-10"
                  />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
                      <Plus className="w-4 h-4" />
                      Создать тур
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Создание нового тура</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                          <Label>Локация *</Label>
                          <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Например: Горный Алтай"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Регион *</Label>
                          <Input
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            placeholder="Например: Республика Алтай"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Категория *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Длительность *</Label>
                          <Input
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            placeholder="Например: 7 дней"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Дней (число) *</Label>
                          <Input
                            type="number"
                            value={formData.durationDays}
                            onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Размер группы *</Label>
                          <Input
                            value={formData.groupSize}
                            onChange={(e) => setFormData({ ...formData, groupSize: e.target.value })}
                            placeholder="Например: до 12 человек"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Цена (текст) *</Label>
                          <Input
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Например: 85 000 ₽"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Цена (число) *</Label>
                          <Input
                            type="number"
                            value={formData.priceValue}
                            onChange={(e) => setFormData({ ...formData, priceValue: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Сложность *</Label>
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
                      <div className="space-y-2">
                        <Label>Краткое описание *</Label>
                        <Textarea
                          value={formData.shortDescription}
                          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                          placeholder="Краткое описание тура для карточки..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Полное описание</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Подробное описание тура..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Что включено</Label>
                        <Textarea
                          value={formData.includes}
                          onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                          placeholder="Перечислите через запятую, например: Проживание, Питание, Трансфер..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Что не включено</Label>
                        <Textarea
                          value={formData.excludes}
                          onChange={(e) => setFormData({ ...formData, excludes: e.target.value })}
                          placeholder="Перечислите через запятую, например: Перелёт, Страховка..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button 
                        className="bg-gray-900 hover:bg-gray-800"
                        onClick={handleCreateTour}
                        disabled={!formData.title || !formData.location || !formData.region}
                      >
                        Сохранить черновик
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {tours.map((tour) => {
                  const StatusIcon = tourStatusMap[tour.status].icon;
                  return (
                    <div key={tour.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{tour.title}</h4>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {tour.location}, {tour.region}
                              </p>
                            </div>
                            <Badge variant="secondary" className={tourStatusMap[tour.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {tourStatusMap[tour.status].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {tour.duration}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {tour.groupSize}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-gray-900">{tour.price}</span>
                            <span>•</span>
                            <span>Сложность: {getDifficultyLabel(tour.difficulty)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{tour.shortDescription}</p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                              <Eye className="w-3 h-3" />
                              Предпросмотр
                            </Button>
                            
                            {tour.status === 'draft' && (
                              <Dialog open={isSubmitDialogOpen && selectedTour?.id === tour.id} onOpenChange={(open) => {
                                setIsSubmitDialogOpen(open);
                                if (open) setSelectedTour(tour);
                                else setSelectedTour(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700">
                                    <Send className="w-3 h-3" />
                                    На модерацию
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Отправить тур на модерацию?</DialogTitle>
                                    <DialogDescription>
                                      После отправки тур будет проверен администратором сервиса. 
                                      Обычно проверка занимает 1-2 рабочих дня.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                                      Отмена
                                    </Button>
                                    <Button 
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleSubmitForModeration(tour)}
                                    >
                                      Отправить
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            {tour.status === 'pending' && (
                              <Button size="sm" className="h-8 gap-1" disabled>
                                <Clock className="w-3 h-3" />
                                На проверке
                              </Button>
                            )}
                            
                            {tour.status === 'approved' && (
                              <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700" disabled>
                                <CheckCircle className="w-3 h-3" />
                                Опубликован
                              </Button>
                            )}
                            
                            {tour.status === 'rejected' && (
                              <Button size="sm" variant="destructive" className="h-8 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Исправить
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Редактировать</DropdownMenuItem>
                                <DropdownMenuItem>Дублировать</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {tour.moderationNotes && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Замечания модератора:</strong> {tour.moderationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
