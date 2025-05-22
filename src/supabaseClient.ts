// Mock Supabase client for development
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string | null;
  created_at: string | null;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

type QueryBuilder<T> = {
  select: () => QueryBuilder<T>;
  eq: (column: string, value: string) => QueryBuilder<T>;
  single: () => Promise<SupabaseResponse<T>>;
  upsert: (data: Partial<T>) => Promise<SupabaseResponse<T>>;
};

type Table = {
  users: User;
};

export const supabase = {
  auth: {
    getUser: async (): Promise<SupabaseResponse<{ user: AuthUser }>> => ({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      },
      error: null
    })
  },
  from: <K extends keyof Table>(table: K): QueryBuilder<Table[K]> => {
    const builder: QueryBuilder<Table[K]> = {
      select: () => builder,
      eq: () => builder,
      single: async () => ({
        data: {
          id: '1',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Table[K],
        error: null
      }),
      upsert: async (data) => ({
        data: {
          ...data,
          id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Table[K],
        error: null
      })
    };
    return builder;
  }
}; 