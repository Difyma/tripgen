import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '../lib/supabase';
import { useRateLimitStore } from '../lib/rateLimit';

interface AuthResponse {
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signInOrSignUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLimited, incrementAttempts } = useRateLimitStore();

  useEffect(() => {
    // Check for initial session
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const session = await auth.getSession();
      setUser(session?.user ?? null);
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

  const value = {
    user,
    loading,
    error,
    signInOrSignUp,
    signOut,
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