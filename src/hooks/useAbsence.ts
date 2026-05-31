import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface AbsenceReport {
  id: string;
  user_id: string;
  player_name: string;
  from_date: string;
  to_date: string;
  note: string | null;
  created_at: string;
}

export function useAbsence() {
  const [absences, setAbsences] = useState<AbsenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbsences = useCallback(async () => {
    const { data, error } = await supabase
      .from('absence_reports')
      .select('*')
      .order('from_date', { ascending: true });
    if (error) setError(error.message);
    else setAbsences((data as AbsenceReport[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAbsences(); }, [fetchAbsences]);

  const addAbsence = useCallback(async (
    playerName: string,
    userId: string,
    fromDate: string,
    toDate: string,
    note: string,
  ): Promise<string | null> => {
    const { error } = await supabase.from('absence_reports').insert({
      user_id: userId,
      player_name: playerName,
      from_date: fromDate,
      to_date: toDate,
      note: note.trim() || null,
    });
    if (error) return error.message;
    await fetchAbsences();
    return null;
  }, [fetchAbsences]);

  const deleteAbsence = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('absence_reports').delete().eq('id', id);
    if (error) return error.message;
    setAbsences((prev) => prev.filter((a) => a.id !== id));
    return null;
  }, []);

  return { absences, loading, error, addAbsence, deleteAbsence, refetch: fetchAbsences };
}
