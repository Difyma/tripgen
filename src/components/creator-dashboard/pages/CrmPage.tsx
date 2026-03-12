import { useState } from 'react';
import { Search, Plus, Phone, Mail, MoreHorizontal, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const mockClients: Client[] = [
  { id: '1', name: 'Анна Петрова', email: 'anna@example.com', phone: '+7 (999) 123-45-67', status: 'vip', tours: 5, totalSpent: 250000, lastContact: '2026-02-20', notes: 'Предпочитает VIP-туры' },
  { id: '2', name: 'Сергей Иванов', email: 'sergey@example.com', phone: '+7 (999) 234-56-78', status: 'active', tours: 3, totalSpent: 120000, lastContact: '2026-02-18', notes: 'Интересуется зимними турами' },
  { id: '3', name: 'Мария Сидорова', email: 'maria@example.com', phone: '+7 (999) 345-67-89', status: 'lead', tours: 0, totalSpent: 0, lastContact: '2026-02-22', notes: 'Новый лид, запрос на Байкал' },
  { id: '4', name: 'Дмитрий Козлов', email: 'dmitry@example.com', phone: '+7 (999) 456-78-90', status: 'active', tours: 2, totalSpent: 80000, lastContact: '2026-02-15', notes: '' },
  { id: '5', name: 'Елена Волкова', email: 'elena@example.com', phone: '+7 (999) 567-89-01', status: 'inactive', tours: 1, totalSpent: 35000, lastContact: '2025-12-10', notes: 'Не была в турах давно' },
];

const statusMap = {
  lead: { label: 'Лид', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Активный', color: 'bg-green-100 text-green-700' },
  vip: { label: 'VIP', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Неактивный', color: 'bg-gray-100 text-gray-700' },
};

export default function CrmPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && client.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-500 mt-1">Управляйте клиентами и лидами</p>
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
            <TabsList className="grid w-full grid-cols-5 max-w-lg">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="lead">Лиды</TabsTrigger>
              <TabsTrigger value="active">Активные</TabsTrigger>
              <TabsTrigger value="vip">VIP</TabsTrigger>
              <TabsTrigger value="inactive">Неактивные</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="m-0">
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
    </div>
  );
}
