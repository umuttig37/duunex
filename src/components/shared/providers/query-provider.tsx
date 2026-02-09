'use client';

import { createClient } from '@/lib/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Auth context types
interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user and profile on mount
  const fetchUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      const authUser = data?.user || null;
      setUser(authUser);

      // If user exists, fetch their profile including role
      if (authUser) {
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        // If profile missing (e.g. OAuth user, trigger didn't run), create it from user_metadata
        if (profileError || !profileData) {
          const meta = authUser.user_metadata || {};
          const fullName = (meta.full_name ?? meta.name ?? '') as string;
          const firstName = (meta.given_name ?? (fullName ? fullName.split(' ')[0] : '') ?? '') as string;
          const lastName = (meta.family_name ?? (fullName ? fullName.split(' ').slice(1).join(' ') : '') ?? '') as string;
          const { error: upsertErr } = await supabase.from('profiles').upsert(
            {
              id: authUser.id,
              email: authUser.email ?? (meta.email as string | undefined) ?? null,
              first_name: firstName || null,
              last_name: lastName || null,
              avatar_url: (meta.avatar_url ?? meta.picture) as string | undefined ?? null,
              role: 'user',
            },
            { onConflict: 'id' }
          );
          if (!upsertErr) {
            const res = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
            profileData = res.data;
            profileError = res.error;
          }
        }

        if (!profileError && profileData) {
          setProfile(profileData);
        } else {
          console.warn('AuthProvider: Profile does not exist for user:', authUser.id, profileError);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error in fetchUser:', error);
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            retry: 1, // Retry failed queries once
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}