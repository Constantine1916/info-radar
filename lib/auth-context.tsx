import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signedIn: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signedIn: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Set a timeout to avoid infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false');
      setLoading(false);
    }, 5000);

    // Skip if supabase is not initialized
    if (!supabase) {
      console.warn('Supabase not initialized - skipping auth');
      setLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    console.log('Initializing auth...');

    // Get initial session
    supabase.auth.getSession()
      .then(({ data, error }) => {
        console.log('getSession result:', error ? 'error' : 'success');
        if (error) {
          console.error('Supabase auth error:', error);
        }
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          setSignedIn(true);
          console.log('User signed in:', data.session.user.email);
        } else {
          console.log('No active session found');
        }
        setLoading(false);
        clearTimeout(timeoutId);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setLoading(false);
        clearTimeout(timeoutId);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'with session' : 'no session');
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          setSession(session);
          setUser(session.user);
          setSignedIn(true);
          console.log('User signed in:', session.user.email);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setSignedIn(false);
        console.log('User signed out');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSignedIn(false);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
