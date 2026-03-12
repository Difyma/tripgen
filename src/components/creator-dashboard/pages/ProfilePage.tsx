import { useState } from 'react';
import { Camera, Mail, Phone, MapPin, Building, Globe, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Иван Иванов',
    email: user?.email || 'ivan@example.com',
    phone: '+7 (999) 123-45-67',
    company: 'Travel Pro',
    location: 'Москва, Россия',
    website: 'www.travelpro.ru',
    bio: 'Опытный организатор туров с 10-летним стажем. Специализация: индивидуальные и групповые туры по России и СНГ.',
    avatar: '/images/user.png',
  });

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save to backend
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-500 mt-1">Управляйте информацией о себе и вашей компании</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Редактировать
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" className="gap-2">
              <X className="w-4 h-4" />
              Отмена
            </Button>
            <Button onClick={handleSave} className="gap-2 bg-gray-900 hover:bg-gray-800">
              <Check className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl bg-gray-200">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="text-xl font-semibold h-10 max-w-xs"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                )}
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                  Проверено
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {isEditing ? (
                    <Input
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="h-7 w-32"
                    />
                  ) : (
                    profile.company
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {isEditing ? (
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="h-7 w-32"
                    />
                  ) : (
                    profile.location
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Контактная информация</CardTitle>
          <CardDescription>Как с вами могут связаться клиенты</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Телефон
              </Label>
              {isEditing ? (
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                Сайт
              </Label>
              {isEditing ? (
                <Input
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.website}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>О себе</CardTitle>
          <CardDescription>Расскажите о вашем опыте и специализации</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
            />
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Активных туров', value: '12' },
          { label: 'Завершённых', value: '156' },
          { label: 'Клиентов', value: '423' },
          { label: 'Рейтинг', value: '4.9' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
