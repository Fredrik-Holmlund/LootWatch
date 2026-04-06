import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { RaidLoot } from '../types';

export function useRaidLoot() {
  const [loot, setLoot] = useState<RaidLoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
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
    fetch();
  }, []);

  return { loot, loading, error };
}
