import { useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import type { Profile, UserRole } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
}

const CACHE_KEY = 'lootwatch_profile';

function getCachedProfile(userId: string): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    return parsed.id === userId ? parsed : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: Profile | null) {
  if (profile) localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  else localStorage.removeItem(CACHE_KEY);
}

async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setCachedProfile(data as Profile);
      return data as Profile;
    }

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

      setCachedProfile(refetched as Profile | null);
      return refetched as Profile | null;
    }

    if (error) console.error('[useAuth] profile fetch error:', error);
    return null;
  } catch (err) {
    console.error('[useAuth] unexpected error in fetchOrCreateProfile:', err);
    return null;
  }
}

async function applySession(
  session: Session | null,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
  cancelled: { current: boolean }
) {
  if (cancelled.current) return;

  if (session?.user) {
    // Show cached profile immediately so nav renders right away
    const cached = getCachedProfile(session.user.id);
    setState({ user: session.user, profile: cached, role: cached?.role ?? null, loading: false });

    // Refresh from DB in background
    const fresh = await fetchOrCreateProfile(session.user);
    if (!cancelled.current && fresh) {
      setState((prev) => ({ ...prev, profile: fresh, role: fresh.role }));
    }
  } else {
    setCachedProfile(null);
    setState({ user: null, profile: null, role: null, loading: false });
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  });
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    // getSession() waits for any in-progress token refresh to complete,
    // so child component queries won't fire until the client is fully ready.
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session, setState, cancelled);
    });

    // Watch for subsequent sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip INITIAL_SESSION — already handled by getSession() above
      if (_event === 'INITIAL_SESSION') return;
      applySession(session, setState, cancelled);
    });

    return () => {
      cancelled.current = true;
      subscription.unsubscribe();
    };
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
    setCachedProfile(null);
    await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signUp, signOut };
}
