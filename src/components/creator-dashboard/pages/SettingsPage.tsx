import { useState } from 'react';
import { Bell, Lock, User, CreditCard, Globe, Shield, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 mt-1">Управляйте настройками аккаунта и уведомлений</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="payment">Оплата</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Профиль компании
              </CardTitle>
              <CardDescription>Основная информация о вашей компании</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Название компании</Label>
                  <Input defaultValue="Travel Pro" />
                </div>
                <div className="space-y-2">
                  <Label>ИНН</Label>
                  <Input defaultValue="7701234567" />
                </div>
                <div className="space-y-2">
                  <Label>ОГРН</Label>
                  <Input defaultValue="1157746123456" />
                </div>
                <div className="space-y-2">
                  <Label>Сайт</Label>
                  <Input defaultValue="www.travelpro.ru" />
                </div>
              </div>
              <Button className="bg-gray-900 hover:bg-gray-800">Сохранить изменения</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Язык и регион
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Язык интерфейса</Label>
                  <Input defaultValue="Русский" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Временная зона</Label>
                  <Input defaultValue="Москва (UTC+3)" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Валюта</Label>
                  <Input defaultValue="Российский рубль (₽)" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Уведомления
              </CardTitle>
              <CardDescription>Настройте, какие уведомления вы хотите получать</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Email-уведомления</p>
                    <p className="text-sm text-gray-500">Получать уведомления на email</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Push-уведомления</p>
                    <p className="text-sm text-gray-500">Уведомления в браузере</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">SMS-уведомления</p>
                    <p className="text-sm text-gray-500">Важные уведомления по SMS</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Маркетинговые рассылки</p>
                    <p className="text-sm text-gray-500">Новости и специальные предложения</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Изменение пароля
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Текущий пароль</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <Label>Новый пароль</Label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <Label>Подтвердите новый пароль</Label>
                <Input type="password" />
              </div>
              <Button className="bg-gray-900 hover:bg-gray-800">Изменить пароль</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Двухфакторная аутентификация
              </CardTitle>
              <CardDescription>Дополнительная защита вашего аккаунта</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA отключена</p>
                  <p className="text-sm text-gray-500">Включите для повышения безопасности</p>
                </div>
                <Button variant="outline">Включить</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Способы оплаты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-gray-200 rounded" />
                  <div>
                    <p className="font-medium">•••• 4242</p>
                    <p className="text-sm text-gray-500">Истекает 12/27</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Основная</Badge>
                  <Button variant="ghost" size="sm">Удалить</Button>
                </div>
              </div>
              <Button variant="outline" className="mt-4 gap-2">
                <CreditCard className="w-4 h-4" />
                Добавить карту
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
