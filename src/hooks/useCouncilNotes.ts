import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { CouncilNote, Priority } from '../types';

export function useCouncilNotes() {
  const [notes, setNotes] = useState<CouncilNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('council_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setNotes(data as CouncilNote[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (note: { player_name: string; item_name: string; priority: Priority; notes?: string }) => {
      const { error } = await supabase.from('council_notes').insert(note);
      if (error) return error.message;
      await fetchNotes();
      return null;
    },
    [fetchNotes]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<CouncilNote>) => {
      const { error } = await supabase
        .from('council_notes')
        .update(updates)
        .eq('id', id);
      if (error) return error.message;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
      return null;
    },
    []
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('council_notes').delete().eq('id', id);
      if (error) return error.message;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return null;
    },
    []
  );

  return { notes, loading, error, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
