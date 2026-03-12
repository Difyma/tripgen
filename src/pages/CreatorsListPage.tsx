import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import creatorChatApi, { Creator } from '../services/creatorChatApi';
import { 
  Users, 
  MessageCircle, 
  Search, 
  Star,
  MapPin,
  Calendar
} from 'lucide-react';
import { MainNavbar } from '../components/MainNavbar';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';

export const CreatorsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const data = await creatorChatApi.getCreators();
      setCreators(data);
    } catch (err) {
      console.error('Error loading creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (creatorId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setStartingChat(creatorId);
    try {
      const { chat_id } = await creatorChatApi.createChat(creatorId);
      navigate(`/chat/${chat_id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setStartingChat(null);
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar onAuthClick={() => setIsAuthModalOpen(true)} />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Наши креаторы
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Выберите креатора для планирования вашего идеального путешествия. 
              Общайтесь напрямую и получайте персональные рекомендации.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск креаторов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Creators Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Креаторы не найдены
              </h3>
              <p className="text-gray-500">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  
                  {/* Avatar */}
                  <div className="px-6 -mt-12 mb-4">
                    <div className="w-24 h-24 rounded-full bg-white p-1">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {creator.full_name 
                          ? creator.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : creator.email.slice(0, 2).toUpperCase()
                        }
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 pb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {creator.full_name || 'Креатор'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {creator.email}
                    </p>

                    {creator.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {creator.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>4.9</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>С {new Date(creator.created_at).getFullYear()} года</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleStartChat(creator.id)}
                      disabled={startingChat === creator.id}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {startingChat === creator.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Открываем чат...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          Написать
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default CreatorsListPage;
