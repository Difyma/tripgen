export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
} 