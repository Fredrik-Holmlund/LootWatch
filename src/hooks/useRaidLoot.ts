import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { RaidLoot } from '../types';

export function useRaidLoot() {
  const [loot, setLoot] = useState<RaidLoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoot() {
      const { data, error } = await supabase
        .from('raid_loot')
        .select('*')
        .order('instance_name')
        .order('boss_name')
        .order('item_name');

      if (error) {
        setError(error.message);
      } else {
        setLoot(data as RaidLoot[]);
      }
      setLoading(false);
    }
    fetchLoot();
  }, []);

  const updateItemNote = useCallback(async (id: number, note: string): Promise<string | null> => {
    const { error } = await supabase
      .from('raid_loot')
      .update({ note: note.trim() || null })
      .eq('id', id);
    if (error) return error.message;
    setLoot((prev) => prev.map((i) => (i.id === id ? { ...i, note: note.trim() || null } : i)));
    return null;
  }, []);

  return { loot, loading, error, updateItemNote };
}
