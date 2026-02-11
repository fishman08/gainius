import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseClient,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getSession,
  onAuthStateChange,
} from '@fitness-tracker/shared';
import { secureTokenStorage } from '../services/supabaseTokenStorage';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  supabase: SupabaseClient | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabase: null,
  isLoading: true,
  signIn: async () => ({ error: 'Not initialized' }),
  signUp: async () => ({ error: 'Not initialized' }),
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setIsLoading(false);
      return;
    }

    const client = createSupabaseClient(
      { supabaseUrl: url, supabaseAnonKey: key },
      secureTokenStorage,
    );
    setSupabase(client);

    getSession(client).then(({ session }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
      setIsLoading(false);
    });

    const { unsubscribe } = onAuthStateChange(client, (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Supabase not configured' };
      const result = await authSignIn(supabase, email, password);
      return { error: result.error };
    },
    [supabase],
  );

  const handleSignUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Supabase not configured' };
      const result = await authSignUp(supabase, email, password);
      return { error: result.error };
    },
    [supabase],
  );

  const handleSignOut = useCallback(async () => {
    if (!supabase) return;
    await authSignOut(supabase);
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        supabase,
        isLoading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
