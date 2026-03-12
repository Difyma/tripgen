import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockTransactions: Transaction[] = [
  { id: 'TRX-001', date: '2026-02-22', description: 'Оплата тура "Алтай"', type: 'income', amount: 45000, category: 'Туры', status: 'completed' },
  { id: 'TRX-002', date: '2026-02-21', description: 'Оплата отеля', type: 'expense', amount: 15000, category: 'Проживание', status: 'completed' },
  { id: 'TRX-003', date: '2026-02-20', description: 'Предоплата тура "Байкал"', type: 'income', amount: 20000, category: 'Туры', status: 'completed' },
  { id: 'TRX-004', date: '2026-02-19', description: 'Трансфер аэропорт', type: 'expense', amount: 3500, category: 'Транспорт', status: 'completed' },
  { id: 'TRX-005', date: '2026-02-18', description: 'Экскурсия', type: 'expense', amount: 8000, category: 'Активности', status: 'completed' },
];



export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = mockTransactions.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  const totalIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
          <p className="text-gray-500 mt-1">Управляйте доходами и расходами</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Экспорт отчёта
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Баланс</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">₽245,000</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Доходы (мес)</p>
                <div className="text-2xl font-bold text-green-600 mt-1">₽{totalIncome.toLocaleString('ru-RU')}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <ArrowUpRight className="w-3 h-3" />
              +12% к прошлому месяцу
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Расходы (мес)</p>
                <div className="text-2xl font-bold text-red-600 mt-1">₽{totalExpense.toLocaleString('ru-RU')}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <ArrowDownRight className="w-3 h-3" />
              +5% к прошлому месяцу
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Прибыль</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">₽{(totalIncome - totalExpense).toLocaleString('ru-RU')}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Транзакции</CardTitle>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3 max-w-sm">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="income">Доходы</TabsTrigger>
              <TabsTrigger value="expense">Расходы</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="m-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Выполнено
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString('ru-RU')} ₽
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
