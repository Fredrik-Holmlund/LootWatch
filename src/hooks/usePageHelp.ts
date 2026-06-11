import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export type HelpPage = 'dashboard' | 'assignments' | 'absence' | 'wishlist';

const KEYS: HelpPage[] = ['dashboard', 'assignments', 'absence', 'wishlist'];

export function usePageHelp() {
  const [texts, setTexts] = useState<Partial<Record<HelpPage, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', KEYS.map((k) => `help_${k}`))
      .then(({ data }) => {
        if (data) {
          const map: Partial<Record<HelpPage, string>> = {};
          for (const row of data) {
            const page = row.key.replace('help_', '') as HelpPage;
            if (row.value) map[page] = String(row.value);
          }
          setTexts(map);
        }
        setLoading(false);
      });
  }, []);

  const saveHelp = useCallback(async (page: HelpPage, text: string) => {
    setTexts((prev) => ({ ...prev, [page]: text }));
    await supabase.from('app_settings').upsert(
      { key: `help_${page}`, value: text, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  }, []);

  return { texts, loading, saveHelp, KEYS };
}
