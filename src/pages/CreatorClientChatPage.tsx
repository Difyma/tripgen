import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreatorChat } from '../components/creator-chat/CreatorChat';
import { MainNavbar } from '../components/MainNavbar';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export const CreatorClientChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar onAuthClick={() => setIsAuthModalOpen(true)} />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Чат с креатором
            </h1>
            <p className="text-gray-500 mt-1">
              Общайтесь с креатором напрямую для планирования вашего путешествия
            </p>
          </div>

          {/* Chat */}
          {user ? (
            <CreatorChat 
              chatId={chatId} 
              onBack={() => navigate('/creators')}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Войдите в систему
              </h3>
              <p className="text-gray-500 mb-6">
                Для начала чата с креатором необходимо авторизоваться
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Войти или зарегистрироваться
              </button>
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

export default CreatorClientChatPage;
