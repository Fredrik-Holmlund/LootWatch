import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import type { Profile, UserRole } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
}

async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) return data as Profile;

    if (error?.code === 'PGRST116') {
      const username =
        (user.user_metadata?.username as string | undefined) ??
        user.email?.split('@')[0] ??
        'unknown';

      await supabase
        .from('profiles')
        .insert({ id: user.id, username, role: 'raider' })
        .select()
        .maybeSingle();

      const { data: refetched } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return refetched as Profile | null;
    }

    if (error) console.error('[useAuth] profile fetch error:', error);
    return null;
  } catch (err) {
    console.error('[useAuth] unexpected error in fetchOrCreateProfile:', err);
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Unblock the UI immediately — profile loads in background
          setState((prev) => ({
            ...prev,
            user: session.user,
            loading: false,
          }));

          const profile = await fetchOrCreateProfile(session.user);
          setState((prev) => ({
            ...prev,
            profile,
            role: profile?.role ?? null,
          }));
        } else {
          setState({ user: null, profile: null, role: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return error ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signUp, signOut };
}
