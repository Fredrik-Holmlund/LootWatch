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
  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (data) return data as Profile;

  // Profile missing (trigger didn't fire, or first-login race) — insert only,
  // never overwrite an existing row (so a manually-set council role is preserved)
  if (error?.code === 'PGRST116') {
    const username =
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split('@')[0] ??
      'unknown';

    await supabase
      .from('profiles')
      .insert({ id: user.id, username, role: 'raider' })
      .select()
      .maybeSingle(); // ignore conflict if row was created by the DB trigger

    // Re-fetch whatever is now in the DB (may have been inserted by trigger)
    const { data: refetched } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return refetched as Profile | null;
  }

  // Surface other errors in the console for debugging
  if (error) console.error('[useAuth] profile fetch error:', error);
  return null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);
        setState({ user: session.user, profile, role: profile?.role ?? null, loading: false });
      } else {
        setState({ user: null, profile: null, role: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);
        setState({ user: session.user, profile, role: profile?.role ?? null, loading: false });
      } else {
        setState({ user: null, profile: null, role: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    // Pass username in auth metadata so the DB trigger picks it up immediately
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
