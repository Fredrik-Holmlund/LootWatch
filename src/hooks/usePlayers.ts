import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Player, WoWClass } from '../types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setPlayers(data as Player[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = useCallback(
    async (player: { name: string; player_class: WoWClass | null; rank?: string }) => {
      const { error } = await supabase.from('players').insert(player);
      if (error) return error.message;
      await fetchPlayers();
      return null;
    },
    [fetchPlayers]
  );

  const updatePlayer = useCallback(
    async (id: string, updates: Partial<Player>) => {
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id);
      if (error) return error.message;
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      return null;
    },
    []
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) return error.message;
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      return null;
    },
    []
  );

  return { players, loading, error, addPlayer, updatePlayer, deletePlayer, refetch: fetchPlayers };
}
