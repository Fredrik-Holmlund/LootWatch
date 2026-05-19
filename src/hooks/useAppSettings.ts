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
    function applyRows(data: { key: string; value: unknown }[]) {
      const merged = { ...DEFAULTS };
      for (const row of data) {
        if (row.key in merged) (merged as Record<string, unknown>)[row.key] = row.value;
      }
      setSettings(merged);
    }

    supabase.from('app_settings').select('key, value').then(({ data }) => {
      if (data) applyRows(data);
      setLoading(false);
    });

    // Unique name avoids channel collision on React StrictMode double-invoke
    const channel = supabase
      .channel(`app_settings_${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, payload => {
        const row = payload.new as { key: string; value: unknown };
        setSettings(prev => (row.key in prev ? { ...prev, [row.key]: row.value } : prev));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
