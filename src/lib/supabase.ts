import { createClient, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  session: Session | null;
  error: SupabaseAuthError | null;
  message: string;
}

// Helper function to ensure profile exists
const ensureProfileExists = async (userId: string, email: string): Promise<Error | null> => {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && !fetchError.message.includes('No rows found')) {
      console.error('Error fetching profile:', fetchError);
      return new Error('Ошибка при проверке профиля');
    }

    if (existingProfile) {
      return null; // Profile already exists
    }

    // If no profile exists, create one with minimal fields
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      // Если профиль уже существует (конфликт), это не ошибка
      if (insertError.code === '23505') { // код ошибки уникального ограничения
        return null;
      }
      return new Error(insertError.message);
    }
    return null;
  } catch (error: any) {
    console.error('Exception ensuring profile exists:', error);
    return error instanceof Error ? error : new Error('Unknown error ensuring profile exists');
  }
};

// Auth helper functions
export const auth = {
  signInOrSignUp: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Log sign in attempt result
      if (signInError) {
        console.log('Sign in attempt failed:', signInError);
      }

      if (signInData?.user) {
        // Ensure profile exists even on sign in
        await ensureProfileExists(signInData.user.id, email);
        return { session: signInData.session, error: null, message: 'Авторизация успешна!' };
      }

      // If sign in failed, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      // Log sign up attempt result
      if (signUpError) {
        console.log('Попытка регистрации не удалась:', signUpError);
        if (signUpError.message.includes('User already registered')) {
          throw new Error('Неверный email или пароль');
        }
        // Throw the specific error message from Supabase
        throw new Error(`Ошибка регистрации: ${signUpError.message}`);
      }

      if (!signUpData?.user) {
        throw new Error('Не удалось создать пользователя');
      }

      // Create profile for new user
      const profileError = await ensureProfileExists(signUpData.user.id, email);
      if (profileError) {
        console.log('Ошибка создания профиля:', profileError);
        throw new Error('Ошибка создания профиля пользователя');
      }

      return { session: signUpData.session, error: null, message: 'Регистрация успешна!' };
    } catch (error: any) {
      console.error('Детали ошибки аутентификации:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      
      if (error.message.includes('Email rate limit exceeded')) {
        throw new Error('Слишком много попыток. Пожалуйста, подождите перед следующей попыткой.');
      }
      
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Неверный email или пароль');
      }

      if (error.message.includes('Ошибка регистрации') || error.message.includes('Ошибка создания профиля')) {
        throw error;
      }
      
      throw new Error(`Ошибка аутентификации: ${error.message}`);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 