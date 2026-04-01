import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { auth, supabase } from '../lib/supabase';
import { useRateLimitStore } from '../lib/rateLimit';

interface Creator {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string | null;
  email: string;
  social_media: string | null;
  portfolio: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  message: string;
}

interface AuthContextType {
  user: User | null;
  creator: Creator | null;
  isCreator: boolean;
  loading: boolean;
  error: Error | null;
  signInOrSignUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLimited, incrementAttempts } = useRateLimitStore();

  // Загрузка данных креатора
  const loadCreatorData = async (userId: string) => {
    try {
      console.log('[Auth] Loading creator data for user:', userId);
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[Auth] No creator record found for user');
        } else {
          console.error('[Auth] Error loading creator data:', error);
        }
        setCreator(null);
        return;
      }
      
      console.log('[Auth] Creator data loaded:', data);
      setCreator(data);
    } catch (err) {
      console.error('[Auth] Exception loading creator data:', err);
      setCreator(null);
    }
  };

  useEffect(() => {
    // Check for initial session
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        loadCreatorData(currentUser.id);
      } else {
        setCreator(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const session = await auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await loadCreatorData(currentUser.id);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }

  const signInOrSignUp = async (email: string, password: string): Promise<AuthResponse> => {
    if (isLimited) {
      throw new Error('Пожалуйста, подождите несколько минут перед следующей попыткой.');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await auth.signInOrSignUp(email, password);
      return response;
    } catch (error: any) {
      console.error('Error during authentication:', error);
      setError(error as Error);
      
      if (error.message.includes('rate limit')) {
        incrementAttempts();
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

    // isCreator = true только если статус 'approved'
  const isCreator = !!creator && creator.status === 'approved';
  
  console.log('[Auth] Auth state:', { 
    hasUser: !!user, 
    hasCreator: !!creator, 
    creatorStatus: creator?.status,
    isCreator 
  });

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await loadCreatorData(currentUser.id);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value = {
    user,
    creator,
    isCreator,
    loading,
    error,
    signInOrSignUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 