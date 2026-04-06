import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { LootCandidate } from '../types';

export function useLootCandidates(raidLootId: string | null) {
  const [candidates, setCandidates] = useState<LootCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('loot_candidates')
      .select('*')
      .eq('raid_loot_id', id)
      .order('priority');
    setCandidates((data as LootCandidate[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (raidLootId) {
      fetch(raidLootId);
    } else {
      setCandidates([]);
    }
  }, [raidLootId, fetch]);

  const addCandidate = useCallback(
    async (playerName: string, note?: string) => {
      if (!raidLootId) return null;
      const nextPriority = candidates.length
        ? Math.max(...candidates.map((c) => c.priority)) + 1
        : 1;
      const { error } = await supabase.from('loot_candidates').insert({
        raid_loot_id: raidLootId,
        player_name: playerName,
        priority: nextPriority,
        note: note ?? null,
      });
      if (error) return error.message;
      await fetch(raidLootId);
      return null;
    },
    [raidLootId, candidates, fetch]
  );

  const removeCandidate = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('loot_candidates').delete().eq('id', id);
      if (error) return error.message;
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      return null;
    },
    []
  );

  const moveCandidate = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      if (!raidLootId) return;
      const idx = candidates.findIndex((c) => c.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= candidates.length) return;

      const a = candidates[idx];
      const b = candidates[swapIdx];

      // Swap priorities
      await supabase.from('loot_candidates').update({ priority: b.priority }).eq('id', a.id);
      await supabase.from('loot_candidates').update({ priority: a.priority }).eq('id', b.id);
      await fetch(raidLootId);
    },
    [candidates, raidLootId, fetch]
  );

  const updateNote = useCallback(
    async (id: string, note: string) => {
      const { error } = await supabase
        .from('loot_candidates')
        .update({ note })
        .eq('id', id);
      if (error) return error.message;
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));
      return null;
    },
    []
  );

  return { candidates, loading, addCandidate, removeCandidate, moveCandidate, updateNote };
}
