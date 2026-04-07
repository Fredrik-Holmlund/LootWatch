import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { LootEntry } from '../types';

export function useLootHistory() {
  const [entries, setEntries] = useState<LootEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loot_entries')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setEntries(data as LootEntry[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const importEntries = useCallback(
    async (newEntries: Omit<LootEntry, 'id' | 'created_at'>[]) => {
      const { error } = await supabase.from('loot_entries').insert(newEntries);
      if (error) return error.message;
      await fetchEntries();
      return null;
    },
    [fetchEntries]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('loot_entries').delete().eq('id', id);
      if (error) return error.message;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return null;
    },
    []
  );

  const updateNote = useCallback(
    async (id: string, notes: string) => {
      const { error } = await supabase
        .from('loot_entries')
        .update({ notes })
        .eq('id', id);
      if (error) return error.message;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, notes } : e))
      );
      return null;
    },
    []
  );

  const updateRaid = useCallback(
    async (id: string, raid: string) => {
      const { error } = await supabase
        .from('loot_entries')
        .update({ raid })
        .eq('id', id);
      if (error) return error.message;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, raid } : e)));
      return null;
    },
    []
  );

  const bulkDeleteEntries = useCallback(
    async (ids: string[]) => {
      const { error } = await supabase.from('loot_entries').delete().in('id', ids);
      if (error) return error.message;
      setEntries((prev) => prev.filter((e) => !ids.includes(e.id)));
      return null;
    },
    []
  );

  const updateBoss = useCallback(
    async (id: string, boss: string) => {
      const { error } = await supabase.from('loot_entries').update({ boss }).eq('id', id);
      if (error) return error.message;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, boss } : e)));
      return null;
    }, []
  );

  const updateResponse = useCallback(
    async (id: string, response: string) => {
      const { error } = await supabase.from('loot_entries').update({ response }).eq('id', id);
      if (error) return error.message;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, response } : e)));
      return null;
    }, []
  );

  return { entries, loading, error, importEntries, deleteEntry, bulkDeleteEntries, updateNote, updateRaid, updateBoss, updateResponse, refetch: fetchEntries };
}
