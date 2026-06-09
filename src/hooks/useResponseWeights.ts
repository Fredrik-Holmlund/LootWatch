import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useResponseWeights() {
  const [responses, setResponses] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('loot_entries').select('response'),
      supabase.from('app_settings').select('value').eq('key', 'response_weights').maybeSingle(),
    ]).then(([lootRes, settingsRes]) => {
      const rs = [...new Set(
        (lootRes.data ?? []).map((r: { response: string }) => r.response).filter(Boolean)
      )].sort() as string[];
      setResponses(rs);
      try {
        const saved = settingsRes.data?.value;
        if (saved) setWeights(JSON.parse(String(saved)));
      } catch { /* ignore parse error */ }
      setLoading(false);
    });
  }, []);

  const saveWeights = useCallback(async (w: Record<string, number>) => {
    setWeights(w);
    await supabase.from('app_settings').upsert(
      { key: 'response_weights', value: JSON.stringify(w), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  }, []);

  return { responses, weights, loading, saveWeights };
}
