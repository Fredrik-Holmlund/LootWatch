import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface AppSettings {
  show_dashboard: boolean;
  show_history: boolean;
  show_wishes_publicly: boolean;
  show_stars_publicly: boolean;
  show_assignments: boolean;
}

const DEFAULTS: AppSettings = { show_dashboard: false, show_history: false, show_wishes_publicly: true, show_stars_publicly: true, show_assignments: false };

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchSettings() {
      supabase
        .from('app_settings')
        .select('key, value')
        .then(({ data }) => {
          if (data) {
            const merged = { ...DEFAULTS };
            for (const row of data) {
              if (row.key in merged) (merged as Record<string, boolean>)[row.key] = row.value as boolean;
            }
            setSettings(merged);
          }
          setLoading(false);
        });
    }

    fetchSettings();

    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchSettings(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Isolated effect — failures here cannot crash the app
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`app_settings_rt_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, payload => {
          const row = payload.new as { key: string; value: boolean };
          setSettings(prev => (row.key in prev ? { ...prev, [row.key]: row.value } : prev));
        })
        .subscribe();
    } catch (err) {
      console.error('[AppSettings] realtime setup failed:', err);
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const toggleSetting = useCallback(async (key: keyof AppSettings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    await supabase
      .from('app_settings')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('key', key);
  }, [settings]);

  return { settings, loading, toggleSetting };
}
