import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface GuildNotice {
  message: string;
  is_active: boolean;
}

export function useGuildNotice() {
  const [notice, setNotice] = useState<GuildNotice>({ message: '', is_active: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['guild_notice_text', 'guild_notice_active'])
      .then(({ data }) => {
        if (data) {
          const text   = data.find(r => r.key === 'guild_notice_text')?.value   ?? '';
          const active = data.find(r => r.key === 'guild_notice_active')?.value ?? false;
          setNotice({ message: String(text), is_active: Boolean(active) });
        }
        setLoading(false);
      });
  }, []);

  const saveNotice = useCallback(async (message: string, is_active: boolean) => {
    setNotice({ message, is_active });
    await Promise.all([
      supabase.from('app_settings').upsert(
        { key: 'guild_notice_text',   value: message,   updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      ),
      supabase.from('app_settings').upsert(
        { key: 'guild_notice_active', value: is_active, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      ),
    ]);
  }, []);

  return { notice, loading, saveNotice };
}
