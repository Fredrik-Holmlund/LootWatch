import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { SoftReserve, RaidLoot, Profile } from '../types';

export function useWishlist(profile: Profile | null) {
  const [wishes, setWishes] = useState<SoftReserve[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishes = useCallback(async () => {
    const { data } = await supabase
      .from('soft_reserves')
      .select('*')
      .order('created_at', { ascending: false });
    setWishes((data as SoftReserve[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWishes(); }, [fetchWishes]);

  // Set of raid_loot_ids the current user has wished for
  const myWishedIds = new Set(
    wishes
      .filter((w) => w.player_name.toLowerCase() === (profile?.username ?? '').toLowerCase())
      .map((w) => w.raid_loot_id)
      .filter((id): id is number => id !== null)
  );

  const toggleWish = useCallback(async (item: RaidLoot, playerClass: string | null) => {
    if (!profile) return;
    const existing = wishes.find(
      (w) =>
        w.player_name.toLowerCase() === profile.username.toLowerCase() &&
        w.raid_loot_id === item.id
    );

    if (existing) {
      // Remove wish — optimistic update
      setWishes((prev) => prev.filter((w) => w.id !== existing.id));
      await supabase.from('soft_reserves').delete().eq('id', existing.id);
    } else {
      // Add wish — optimistic update
      const optimistic: SoftReserve = {
        id: crypto.randomUUID(),
        player_name: profile.username,
        player_class: playerClass,
        raid_loot_id: item.id,
        item_name: item.item_name,
        instance_name: item.instance_name,
        boss_name: item.boss_name,
        note: null,
        created_at: new Date().toISOString(),
      };
      setWishes((prev) => [optimistic, ...prev]);
      const { data } = await supabase
        .from('soft_reserves')
        .insert({
          player_name: profile.username,
          player_class: playerClass,
          raid_loot_id: item.id,
          item_name: item.item_name,
          instance_name: item.instance_name,
          boss_name: item.boss_name,
        })
        .select()
        .single();
      // Replace optimistic with real row
      if (data) {
        setWishes((prev) =>
          prev.map((w) => (w.id === optimistic.id ? (data as SoftReserve) : w))
        );
      }
    }
  }, [profile, wishes]);

  const deleteWish = useCallback(async (id: string) => {
    setWishes((prev) => prev.filter((w) => w.id !== id));
    await supabase.from('soft_reserves').delete().eq('id', id);
  }, []);

  return { wishes, loading, myWishedIds, toggleWish, deleteWish };
}
