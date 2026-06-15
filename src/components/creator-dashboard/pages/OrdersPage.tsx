import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, MoreHorizontal, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tourApi } from '@/services/tourApi';

interface Order {
  id: string;
  tourName: string;
  customer: string;
  email: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  guests: number;
  phone?: string;
  comments?: string;
  createdAt?: string;
  paymentMethodTitle?: string;
}

const statusMap = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Подтверждён', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  completed: { label: 'Завершён', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [bookingRequests, setBookingRequests] = useState<Order[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoadingBookings(true);
    setBookingsError('');
    tourApi.getMyBookings()
      .then(({ bookings }) => {
        if (!cancelled) setBookingRequests(bookings as Order[]);
      })
      .catch((error) => {
        console.error('Failed to load tour booking requests:', error);
        if (!cancelled) setBookingsError(error instanceof Error ? error.message : 'Не удалось загрузить заявки');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBookings(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allOrders = useMemo(() => bookingRequests, [bookingRequests]);

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = 
      order.tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.status === activeTab;
  });

  const pendingCount = allOrders.filter(order => order.status === 'pending').length;
  const completedCount = allOrders.filter(order => order.status === 'completed').length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-500 mt-1">Управляйте бронированиями ваших туров</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Фильтры
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Всего заказов', value: String(allOrders.length), change: bookingRequests.length ? `+${bookingRequests.length} новых заявок` : 'Нет новых заявок' },
          { label: 'Ожидают подтверждения', value: String(pendingCount), change: 'Требуют внимания' },
          { label: 'Сумма заявок', value: `${totalRevenue.toLocaleString('ru-RU')} ₽`, change: 'Оплата напрямую организатору' },
          { label: 'Завершённые', value: String(completedCount), change: 'Успешные туры' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по заказам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isLoadingBookings && (
              <span className="text-sm text-gray-500">Загружаем заявки...</span>
            )}
          </div>
          {bookingsError && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
              {bookingsError}
            </div>
          )}
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5 max-w-md">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="pending">Ожидают</TabsTrigger>
              <TabsTrigger value="confirmed">Подтверждённые</TabsTrigger>
              <TabsTrigger value="completed">Завершённые</TabsTrigger>
              <TabsTrigger value="cancelled">Отменённые</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="m-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№ заказа</TableHead>
                    <TableHead>Тур</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Гости</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusMap[order.status].icon;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.tourName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer}</div>
                            <div className="text-sm text-gray-500">{order.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell>{order.guests} чел.</TableCell>
                        <TableCell className="font-medium">
                          {order.amount.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusMap[order.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusMap[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Eye className="w-4 h-4" />
                                Просмотреть
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Подтвердить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoadingBookings && filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                        Заявок пока нет
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
