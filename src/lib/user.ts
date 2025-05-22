import { supabase } from '../supabaseClient';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const response = await supabase.from('users');
    const { data, error } = await response
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const authResponse = await supabase.auth.getUser();
    if (authResponse.error) throw authResponse.error;
    if (!authResponse.data?.user) return null;

    const auth = authResponse.data.user;
    const userData: Partial<User> = {
      id: auth.id,
      email: auth.email || '',
      created_at: auth.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await supabase.from('users');
    const { data, error } = await response.upsert(userData);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const response = await supabase.from('users');
    const { data, error } = await response
      .select()
      .eq('email', email)
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

export const saveUserData = async (email: string): Promise<User | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}; 