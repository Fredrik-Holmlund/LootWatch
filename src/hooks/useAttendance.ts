import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface RaidSession {
  id: string;
  session_date: string;
  instance_name: string;
  report_code: string | null;
  notes: string | null;
  created_at: string;
}

export interface WCLReport {
  code: string;
  title: string;
  date: string;
  instance: string;
  players: string[];
}

export function useAttendance() {
  const [sessions, setSessions] = useState<RaidSession[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string[]>>({}); // session_id → player names
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [wclReports, setWclReports] = useState<WCLReport[]>([]);

  const fetchSessions = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from('raid_sessions')
      .select('*')
      .order('session_date', { ascending: false });

    const sessions = (sessionData as RaidSession[]) ?? [];
    setSessions(sessions);

    if (sessions.length > 0) {
      const { data: attData } = await supabase
        .from('raid_attendance')
        .select('session_id, player_name')
        .in('session_id', sessions.map((s) => s.id));

      const map: Record<string, string[]> = {};
      for (const row of attData ?? []) {
        if (!map[row.session_id]) map[row.session_id] = [];
        map[row.session_id].push(row.player_name);
      }
      setAttendance(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const syncFromWCL = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-attendance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      }
    );
    const json = await res.json();
    if (json.error) {
      setSyncError(json.error);
    } else {
      setWclReports(json.sessions ?? []);
    }
    setSyncing(false);
  }, []);

  const importSession = useCallback(async (report: WCLReport) => {
    // Check if already imported
    const exists = sessions.find((s) => s.report_code === report.code);
    if (exists) return;

    const { data: sessionRow, error } = await supabase
      .from('raid_sessions')
      .insert({
        session_date: report.date,
        instance_name: report.instance,
        report_code: report.code,
      })
      .select()
      .single();

    if (error || !sessionRow) return;

    if (report.players.length > 0) {
      await supabase.from('raid_attendance').insert(
        report.players.map((name) => ({ session_id: sessionRow.id, player_name: name }))
      );
    }

    await fetchSessions();
  }, [sessions, fetchSessions]);

  const deleteSession = useCallback(async (id: string) => {
    await supabase.from('raid_sessions').delete().eq('id', id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setAttendance((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Attendance % per player across all sessions
  const attendanceStats = useCallback((): Record<string, { attended: number; total: number; pct: number }> => {
    const total = sessions.length;
    if (total === 0) return {};
    const counts: Record<string, number> = {};
    for (const players of Object.values(attendance)) {
      for (const p of players) {
        counts[p] = (counts[p] ?? 0) + 1;
      }
    }
    const result: Record<string, { attended: number; total: number; pct: number }> = {};
    for (const [name, attended] of Object.entries(counts)) {
      result[name] = { attended, total, pct: Math.round((attended / total) * 100) };
    }
    return result;
  }, [sessions, attendance]);

  return { sessions, attendance, loading, syncing, syncError, wclReports, syncFromWCL, importSession, deleteSession, attendanceStats };
}
