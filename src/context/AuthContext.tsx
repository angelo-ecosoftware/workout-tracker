import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    uid: user.id,
    email: user.email,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
