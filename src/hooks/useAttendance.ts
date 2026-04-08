import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export type AttendanceStatus = 'attended' | 'bench';

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

// attendance[sessionId][playerName] = 'attended' | 'bench'
export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

export function useAttendance() {
  const [sessions, setSessions] = useState<RaidSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
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
        .select('session_id, player_name, status')
        .in('session_id', sessions.map((s) => s.id));

      const map: AttendanceMap = {};
      for (const row of attData ?? []) {
        if (!map[row.session_id]) map[row.session_id] = {};
        map[row.session_id][row.player_name] = (row.status ?? 'attended') as AttendanceStatus;
      }
      setAttendance(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const syncFromWCL = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
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
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Network error — could not reach sync function');
    } finally {
      setSyncing(false);
    }
  }, []);

  const importSession = useCallback(async (report: WCLReport) => {
    const exists = sessions.find((s) => s.report_code === report.code);
    if (exists) return;

    const { data: sessionRow, error } = await supabase
      .from('raid_sessions')
      .insert({ session_date: report.date, instance_name: report.instance, report_code: report.code })
      .select()
      .single();

    if (error || !sessionRow) return;

    if (report.players.length > 0) {
      await supabase.from('raid_attendance').insert(
        report.players.map((name) => ({ session_id: sessionRow.id, player_name: name, status: 'attended' }))
      );
    }

    await fetchSessions();
  }, [sessions, fetchSessions]);

  const deleteSession = useCallback(async (id: string) => {
    await supabase.from('raid_sessions').delete().eq('id', id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setAttendance((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const deletePlayer = useCallback(async (playerName: string) => {
    await supabase.from('raid_attendance').delete().eq('player_name', playerName);
    setAttendance((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const m = { ...next[id] };
        delete m[playerName];
        next[id] = m;
      }
      return next;
    });
  }, []);

  const createSession = useCallback(async (instanceName: string, date: string) => {
    const { error } = await supabase
      .from('raid_sessions')
      .insert({ session_date: date, instance_name: instanceName, report_code: null });
    if (!error) await fetchSessions();
  }, [fetchSessions]);

  // Cycles: none → attended → bench → none
  const toggleAttendance = useCallback(async (sessionId: string, playerName: string) => {
    const current = attendance[sessionId]?.[playerName];
    const next: AttendanceStatus | null =
      current === undefined ? 'attended' :
      current === 'attended' ? 'bench' :
      null;

    // Optimistic update
    setAttendance((prev) => {
      const session = { ...(prev[sessionId] ?? {}) };
      if (next === null) {
        delete session[playerName];
      } else {
        session[playerName] = next;
      }
      return { ...prev, [sessionId]: session };
    });

    if (next === null) {
      await supabase.from('raid_attendance')
        .delete()
        .eq('session_id', sessionId)
        .eq('player_name', playerName);
    } else if (current === undefined) {
      await supabase.from('raid_attendance')
        .insert({ session_id: sessionId, player_name: playerName, status: next });
    } else {
      await supabase.from('raid_attendance')
        .update({ status: next })
        .eq('session_id', sessionId)
        .eq('player_name', playerName);
    }
  }, [attendance]);

  const attendanceStats = useCallback((): Record<string, { attended: number; benched: number; total: number; pct: number }> => {
    const total = sessions.length;
    if (total === 0) return {};
    const allPlayers = [...new Set(Object.values(attendance).flatMap((m) => Object.keys(m)))];
    const result: Record<string, { attended: number; benched: number; total: number; pct: number }> = {};
    for (const name of allPlayers) {
      let attended = 0, benched = 0;
      for (const m of Object.values(attendance)) {
        if (m[name] === 'attended') attended++;
        else if (m[name] === 'bench') benched++;
      }
      result[name] = { attended, benched, total, pct: Math.round((attended / total) * 100) };
    }
    return result;
  }, [sessions, attendance]);

  return { sessions, attendance, loading, syncing, syncError, wclReports, syncFromWCL, importSession, deleteSession, deletePlayer, createSession, attendanceStats, toggleAttendance };
}
