import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSignedIn: boolean;
  isLoaded: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and fetch full user data
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      
      if (session?.user) {
        // Fetch full user data from backend
        try {
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const fullUser = await response.json();
            setUser(fullUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setSession(session);
      
      if (session?.user) {
        // Fetch full user data from backend
        try {
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const fullUser = await response.json();
            setUser(fullUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const value = {
    user,
    session,
    loading,
    isSignedIn: !!user,
    isLoaded: !loading,
    signUp,
    signIn,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

