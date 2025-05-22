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

interface UserData {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthSignUpResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: SupabaseAuthError | null;
}

// Generate a random password
const generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => charset[x % charset.length])
    .join('');
};

// Helper function to check if error is rate limit
const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return message.includes('rate limit') || error.status === 429;
};

// Helper function to check if error is invalid credentials
const isInvalidCredentialsError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return message.includes('invalid login credentials') || 
         message.includes('invalid credentials') ||
         error.status === 401;
};

// Helper function to create user in database
const createUserInDatabase = async (userId: string, email: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error creating user in database:', error);
      // Don't throw the error here, just log it
    }
  } catch (error) {
    console.error('Exception creating user in database:', error);
    // Don't throw the error here, just log it
  }
};

// Helper function to check if user exists in database
const checkUserInDatabase = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user in database:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking user in database:', error);
    return false;
  }
};

// Helper function to check if user exists in auth
const checkUserExistsInAuth = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('Error checking user in auth:', error);
    return false;
  }
};

// Helper function to ensure profile exists
const ensureProfileExists = async (userId: string, email: string): Promise<Error | null> => {
  try {
    // First try to get existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return null; // Profile already exists
    }

    // If no profile exists, create one with minimal fields
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email
      });

    if (error) {
      console.error('Error ensuring profile exists:', error);
      return new Error(error.message);
    }
    return null;
  } catch (error: any) {
    console.error('Exception ensuring profile exists:', error);
    return error instanceof Error ? error : new Error('Unknown error ensuring profile exists');
  }
};

// Helper function to add delay with exponential backoff
const wait = (attempts: number) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Store the last attempt timestamp and count
let lastAttemptTimestamp = 0;
let attemptCount = 0;

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
        return { session: signInData.session, error: null, message: '' };
      }

      // If sign in failed, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      }) as AuthSignUpResponse;

      // Log sign up attempt result
      if (signUpError) {
        console.log('Sign up attempt failed:', signUpError);
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
        console.log('Profile creation failed:', profileError);
        throw new Error('Ошибка создания профиля пользователя');
      }

      return { session: signUpData.session, error: null, message: '' };
    } catch (error: any) {
      console.error('Authentication error details:', {
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