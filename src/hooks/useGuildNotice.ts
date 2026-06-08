import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface GuildNotice {
  id: number;
  message: string;
  is_active: boolean;
  updated_at: string;
}

export function useGuildNotice() {
  const [notice, setNotice] = useState<GuildNotice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('guild_notices')
      .select('*')
      .order('id')
      .limit(1)
      .single()
      .then(({ data }) => {
        setNotice(data as GuildNotice ?? null);
        setLoading(false);
      });
  }, []);

  const saveNotice = useCallback(async (message: string, is_active: boolean) => {
    if (notice) {
      const { data } = await supabase
        .from('guild_notices')
        .update({ message, is_active, updated_at: new Date().toISOString() })
        .eq('id', notice.id)
        .select()
        .single();
      if (data) setNotice(data as GuildNotice);
    } else {
      const { data } = await supabase
        .from('guild_notices')
        .insert({ message, is_active })
        .select()
        .single();
      if (data) setNotice(data as GuildNotice);
    }
  }, [notice]);

  return { notice, loading, saveNotice };
}
