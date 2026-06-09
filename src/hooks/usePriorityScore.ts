import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface PlayerPriority {
  name: string;
  score: number;
  attendanceScore: number;
  streakScore: number;
  droughtScore: number;
  lootScore: number;
  rollingPct: number;
  rollingAttended: number;
  rollingTotal: number;
  allTimeAttended: number;
  allTimeTotal: number;
  currentStreak: number;
  bestStreak: number;
  droughtDays: number;
  recentWeightedLoot: number; // weighted sum of recent items (replaces recentBisCount)
}

export interface PriorityWeights {
  attendance: number;
  streak: number;
  drought: number;
  loot: number;
}

// Items with weight below this don't count as "breaking drought"
const DROUGHT_THRESHOLD = 0.3;
const RECENT_WINDOW_DAYS = 42; // 6 weeks
const DROUGHT_CAP_DAYS = 30;
const LOOT_PENALTY_PER_UNIT = 25; // penalty points per 1.0 weighted unit
const DEFAULT_ATT_WINDOW = 6;

function stripRealm(name: string): string {
  return name.split('-')[0];
}

export function usePriorityScore() {
  const [priorities, setPriorities] = useState<PlayerPriority[]>([]);
  const [weights, setWeights] = useState<PriorityWeights>({ attendance: 20, streak: 10, drought: 50, loot: 20 });
  const [attWindow, setAttWindow] = useState(DEFAULT_ATT_WINDOW);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async (w: PriorityWeights, window: number) => {
    setLoading(true);

    const [lootRes, sessionRes, attRes, settingsRes] = await Promise.all([
      supabase.from('loot_entries').select('player_name, response, timestamp'),
      supabase.from('raid_sessions').select('id, session_date'),
      supabase.from('raid_attendance').select('session_id, player_name, status'),
      supabase.from('app_settings').select('key, value').eq('key', 'response_weights').maybeSingle(),
    ]);

    // Load response weights (JSON stored in app_settings)
    const responseWeights: Record<string, number> = {};
    try {
      const raw = settingsRes.data?.value;
      if (raw) Object.assign(responseWeights, JSON.parse(String(raw)));
    } catch { /* ignore */ }

    function getWeight(response: string): number {
      const key = (response ?? '').trim().toLowerCase();
      for (const [k, v] of Object.entries(responseWeights)) {
        if (k.trim().toLowerCase() === key) return v;
      }
      return 0;
    }

    const lootEntries = lootRes.data ?? [];
    const sessions = (sessionRes.data ?? []) as { id: string; session_date: string }[];
    const attRows = attRes.data ?? [];

    const sessionsSortedAsc = [...sessions].sort(
      (a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
    const rollingIds = new Set(sessionsSortedAsc.slice(-window).map(s => s.id));
    const rollingTotal = Math.min(window, sessions.length);
    const allTimeTotal = sessions.length;

    const now = Date.now();
    const recentCutoff = now - RECENT_WINDOW_DAYS * 86400000;

    // Attendance structures
    const attMap: Record<string, Record<string, string>> = {};
    const allTimeCount: Record<string, number> = {};
    const rollingCount: Record<string, number> = {};

    for (const row of attRows) {
      if (!attMap[row.session_id]) attMap[row.session_id] = {};
      const name = stripRealm(row.player_name);
      attMap[row.session_id][name] = row.status;
      if (row.status === 'attended' || row.status === 'bench') {
        allTimeCount[name] = (allTimeCount[name] ?? 0) + 1;
        if (rollingIds.has(row.session_id)) rollingCount[name] = (rollingCount[name] ?? 0) + 1;
      }
    }

    function calcStreaks(name: string): { current: number; best: number } {
      const firstIdx = sessionsSortedAsc.findIndex(s => {
        const st = attMap[s.id]?.[name];
        return st === 'attended' || st === 'bench';
      });
      if (firstIdx === -1) return { current: 0, best: 0 };
      let best = 0, temp = 0, current = 0;
      for (const s of sessionsSortedAsc.slice(firstIdx)) {
        const st = attMap[s.id]?.[name];
        if (st === 'attended' || st === 'bench') { temp++; if (temp > best) best = temp; }
        else temp = 0;
      }
      for (let i = sessionsSortedAsc.length - 1; i >= firstIdx; i--) {
        const st = attMap[sessionsSortedAsc[i].id]?.[name];
        if (st === 'attended' || st === 'bench') current++;
        else break;
      }
      return { current, best };
    }

    // Loot maps — weighted
    const lastSignificantDate: Record<string, number> = {};
    const recentWeightedLoot: Record<string, number> = {};

    for (const entry of lootEntries) {
      const weight = getWeight(entry.response);
      if (weight <= 0) continue;
      const name = stripRealm(entry.player_name);
      const ts = new Date(entry.timestamp).getTime();
      if (isNaN(ts)) continue;

      // Drought: track last item that breaks drought threshold
      if (weight >= DROUGHT_THRESHOLD) {
        if (lastSignificantDate[name] === undefined || ts > lastSignificantDate[name]) {
          lastSignificantDate[name] = ts;
        }
      }

      // Loot score: weighted sum in recent window
      if (ts >= recentCutoff) {
        recentWeightedLoot[name] = (recentWeightedLoot[name] ?? 0) + weight;
      }
    }

    const allNames = new Set([
      ...Object.keys(allTimeCount),
      ...Object.keys(lastSignificantDate),
      ...Object.keys(recentWeightedLoot),
    ]);

    const result: PlayerPriority[] = [];
    for (const name of allNames) {
      const rollingAttended = rollingCount[name] ?? 0;
      const rollingPct = rollingTotal > 0 ? Math.round((rollingAttended / rollingTotal) * 100) : 0;
      const attendanceScore = rollingPct;

      const { current: currentStreak, best: bestStreak } = calcStreaks(name);
      const streakScore = allTimeTotal > 0
        ? Math.round(Math.min(bestStreak, allTimeTotal) / allTimeTotal * 100)
        : 0;

      const lastTs = lastSignificantDate[name];
      const droughtDays = lastTs !== undefined ? Math.round((now - lastTs) / 86400000) : 999;
      const droughtScore = Math.min(droughtDays, DROUGHT_CAP_DAYS) / DROUGHT_CAP_DAYS * 100;

      const weightedLoot = recentWeightedLoot[name] ?? 0;
      const lootScore = Math.max(0, 100 - weightedLoot * LOOT_PENALTY_PER_UNIT);

      const score =
        (attendanceScore * w.attendance / 100) +
        (streakScore     * w.streak     / 100) +
        (droughtScore    * w.drought    / 100) +
        (lootScore       * w.loot       / 100);

      result.push({
        name, score: Math.round(score),
        attendanceScore: Math.round(attendanceScore),
        streakScore: Math.round(streakScore),
        droughtScore: Math.round(droughtScore),
        lootScore: Math.round(lootScore),
        rollingPct, rollingAttended, rollingTotal,
        allTimeAttended: allTimeCount[name] ?? 0, allTimeTotal,
        currentStreak, bestStreak, droughtDays,
        recentWeightedLoot: Math.round(weightedLoot * 10) / 10,
      });
    }

    result.sort((a, b) => b.score - a.score);
    setPriorities(result);
    setLoading(false);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['priority_weight_attendance', 'priority_weight_streak', 'priority_weight_drought', 'priority_weight_loot', 'attendance_window'])
      .then(({ data }) => {
        const w = { attendance: 20, streak: 10, drought: 50, loot: 20 };
        let win = DEFAULT_ATT_WINDOW;
        for (const row of data ?? []) {
          const v = Number(row.value);
          if (row.key === 'priority_weight_attendance') w.attendance = v;
          if (row.key === 'priority_weight_streak')     w.streak     = v;
          if (row.key === 'priority_weight_drought')    w.drought    = v;
          if (row.key === 'priority_weight_loot')       w.loot       = v;
          if (row.key === 'attendance_window')          win          = v;
        }
        setWeights(w);
        setAttWindow(win);
        compute(w, win);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => compute(weights, attWindow), [compute, weights, attWindow]);

  return { priorities, weights, attWindow, loading, refresh };
}
