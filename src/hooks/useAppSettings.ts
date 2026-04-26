import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface AppSettings {
  show_dashboard: boolean;
  show_history: boolean;
  show_wishes_publicly: boolean;
  show_stars_publicly: boolean;
}

const DEFAULTS: AppSettings = { show_dashboard: false, show_history: false, show_wishes_publicly: true, show_stars_publicly: true };

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          const merged = { ...DEFAULTS };
          for (const row of data) {
            if (row.key in merged) {
              (merged as Record<string, boolean>)[row.key] = row.value as boolean;
            }
          }
          setSettings(merged);
        }
        setLoading(false);
      });
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
