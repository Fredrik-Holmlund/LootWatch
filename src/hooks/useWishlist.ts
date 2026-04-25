import { useEffect, useState, useCallback, useMemo } from 'react';
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

  // Map of raid_loot_id → wish record for the current user
  const myWishes = useMemo(() => {
    const map = new Map<number, SoftReserve>();
    if (!profile) return map;
    for (const w of wishes) {
      if (w.player_name.toLowerCase() === profile.username.toLowerCase() && w.raid_loot_id !== null) {
        map.set(w.raid_loot_id, w);
      }
    }
    return map;
  }, [wishes, profile]);

  const myWishedIds = useMemo(() => new Set(myWishes.keys()), [myWishes]);

  // Which star tiers (1|2|3) the current user has already assigned
  const usedStarTiers = useMemo(() => {
    const tiers = new Set<number>();
    for (const w of myWishes.values()) {
      if (w.star !== null) tiers.add(w.star);
    }
    return tiers;
  }, [myWishes]);

  const toggleWish = useCallback(async (item: RaidLoot, playerClass: string | null) => {
    if (!profile) return;
    const existing = myWishes.get(item.id);

    if (existing) {
      setWishes((prev) => prev.filter((w) => w.id !== existing.id));
      await supabase.from('soft_reserves').delete().eq('id', existing.id);
    } else {
      const optimistic: SoftReserve = {
        id: crypto.randomUUID(),
        player_name: profile.username,
        player_class: playerClass,
        raid_loot_id: item.id,
        item_name: item.item_name,
        instance_name: item.instance_name,
        boss_name: item.boss_name,
        note: null,
        star: null,
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
      if (data) {
        setWishes((prev) =>
          prev.map((w) => (w.id === optimistic.id ? (data as SoftReserve) : w))
        );
      }
    }
  }, [profile, myWishes]);

  const setItemStar = useCallback(async (wishId: string, star: 1 | 2 | 3 | null) => {
    setWishes((prev) => prev.map((w) => (w.id === wishId ? { ...w, star } : w)));
    await supabase.from('soft_reserves').update({ star }).eq('id', wishId);
  }, []);

  const deleteWish = useCallback(async (id: string) => {
    setWishes((prev) => prev.filter((w) => w.id !== id));
    await supabase.from('soft_reserves').delete().eq('id', id);
  }, []);

  return { wishes, loading, myWishedIds, myWishes, usedStarTiers, toggleWish, setItemStar, deleteWish };
}
