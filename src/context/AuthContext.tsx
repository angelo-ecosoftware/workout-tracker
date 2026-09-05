import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User, Session } from '@supabase/supabase-js';
import { AppRole, CoachSpecialty, UserRoleInfo } from '../models.ts';
import { fetchUserRole, requestCoachRole as submitCoachRequest } from '../lib/db/roles.ts';

export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  roleInfo: UserRoleInfo | null;
  userRole: AppRole;
  specialty: CoachSpecialty | null;
  isApprovedCoach: boolean;
  isCoach: boolean;
  isAdmin: boolean;
  isAthlete: boolean;
  refreshUserRole: () => Promise<void>;
  requestCoachRole: (specialty: CoachSpecialty) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<void>;
  switchAccount: () => Promise<void>;
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
    provider: user.app_metadata?.provider || user.identities?.[0]?.provider,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo | null>(null);

  const loadRoleForUser = useCallback(async (userId: string) => {
    try {
      const info = await fetchUserRole(userId);
      setRoleInfo(info);
    } catch (e) {
      console.warn('Failed to load user role:', e);
      setRoleInfo({
        userId,
        role: 'athlete',
        specialty: null,
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mapped = mapSupabaseUser(session?.user ?? null);
      setUser(mapped);
      setToken(session?.access_token ?? null);
      if (mapped?.uid) {
        loadRoleForUser(mapped.uid);
      } else {
        setRoleInfo(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      const mapped = mapSupabaseUser(session?.user ?? null);
      setUser(mapped);
      setToken(session?.access_token ?? null);
      if (mapped?.uid) {
        loadRoleForUser(mapped.uid);
      } else {
        setRoleInfo(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadRoleForUser]);

  const refreshUserRole = async () => {
    if (user?.uid) {
      await loadRoleForUser(user.uid);
    }
  };

  const requestCoachRole = async (specialty: CoachSpecialty = 'strength') => {
    if (!user?.uid) return;
    const updated = await submitCoachRequest(user.uid, specialty);
    setRoleInfo(updated);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error("Google login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      const mapped = mapSupabaseUser(data?.user ?? null);
      setUser(mapped);
      setToken(data?.session?.access_token ?? null);
      if (mapped?.uid) {
        await loadRoleForUser(mapped.uid);
      }
    } catch (err: unknown) {
      console.error("Email login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchAccount = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
      setRoleInfo(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error("Account switch failed:", err);
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
      setRoleInfo(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const userRole: AppRole = roleInfo?.role || 'athlete';
  const specialty: CoachSpecialty | null = roleInfo?.specialty || null;
  const isApprovedCoach = Boolean(roleInfo?.role === 'coach' && roleInfo?.isApproved);
  const isCoach = roleInfo?.role === 'coach';
  const isAdmin = roleInfo?.role === 'admin';
  const isAthlete = !roleInfo || roleInfo.role === 'athlete';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        roleInfo,
        userRole,
        specialty,
        isApprovedCoach,
        isCoach,
        isAdmin,
        isAthlete,
        refreshUserRole,
        requestCoachRole,
        loginWithGoogle,
        loginWithEmailPassword,
        switchAccount,
        logout,
      }}
    >
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

