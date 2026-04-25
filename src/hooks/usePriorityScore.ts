import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface PlayerPriority {
  name: string;
  score: number;           // 0–100 combined
  attendanceScore: number; // 0–100
  droughtScore: number;    // 0–100
  lootScore: number;       // 0–100
  attendancePct: number;   // raw %
  droughtDays: number;     // days since last BIS/Upgrade (999 = never)
  recentBisCount: number;  // BIS/Upgrade items in last 42 days
}

export interface PriorityWeights {
  attendance: number; // default 30
  drought: number;    // default 50
  loot: number;       // default 20
}

const MAIN_SPEC_RESPONSES = ['bis', 'upgrade', 'best in slot'];
const RECENT_WINDOW_DAYS = 42;
const DROUGHT_CAP_DAYS = 30;
const LOOT_PENALTY_PER_ITEM = 25;

function stripRealm(name: string): string {
  return name.split('-')[0];
}

function isMainSpec(response: string): boolean {
  return MAIN_SPEC_RESPONSES.includes(response.toLowerCase().trim());
}

export function usePriorityScore() {
  const [priorities, setPriorities] = useState<PlayerPriority[]>([]);
  const [weights, setWeights] = useState<PriorityWeights>({ attendance: 30, drought: 50, loot: 20 });
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async (w: PriorityWeights) => {
    setLoading(true);

    // Fetch all data in parallel
    const [lootRes, sessionRes, attRes] = await Promise.all([
      supabase.from('loot_entries').select('player_name, response, timestamp'),
      supabase.from('raid_sessions').select('id'),
      supabase.from('raid_attendance').select('session_id, player_name, status'),
    ]);

    const lootEntries = lootRes.data ?? [];
    const sessions = sessionRes.data ?? [];
    const attRows = attRes.data ?? [];

    const totalSessions = sessions.length;
    const now = Date.now();
    const recentCutoff = now - RECENT_WINDOW_DAYS * 86400000;

    // Build attendance map: normalizedName → count of sessions present (attended or bench)
    const attCount: Record<string, number> = {};
    for (const row of attRows) {
      if (row.status === 'attended' || row.status === 'bench') {
        const name = stripRealm(row.player_name);
        attCount[name] = (attCount[name] ?? 0) + 1;
      }
    }

    // Build loot maps per player (normalized name)
    const lastBisDate: Record<string, number> = {};   // ms timestamp of most recent BIS/Upgrade
    const recentBis: Record<string, number> = {};     // count in last 42 days

    for (const entry of lootEntries) {
      if (!isMainSpec(entry.response)) continue;
      const name = stripRealm(entry.player_name);
      const ts = new Date(entry.timestamp).getTime();
      if (isNaN(ts)) continue;

      if (lastBisDate[name] === undefined || ts > lastBisDate[name]) {
        lastBisDate[name] = ts;
      }
      if (ts >= recentCutoff) {
        recentBis[name] = (recentBis[name] ?? 0) + 1;
      }
    }

    // All known players (union of attendance + loot history)
    const allNames = new Set([
      ...Object.keys(attCount),
      ...Object.keys(lastBisDate),
      ...Object.keys(recentBis),
    ]);

    const result: PlayerPriority[] = [];

    for (const name of allNames) {
      const attendedCount = attCount[name] ?? 0;
      const attendancePct = totalSessions > 0
        ? Math.round((attendedCount / totalSessions) * 100)
        : 0;
      const attendanceScore = attendancePct;

      const lastTs = lastBisDate[name];
      const droughtDays = lastTs !== undefined
        ? Math.round((now - lastTs) / 86400000)
        : 999;
      const droughtScore = Math.min(droughtDays, DROUGHT_CAP_DAYS) / DROUGHT_CAP_DAYS * 100;

      const recentBisCount = recentBis[name] ?? 0;
      const lootScore = Math.max(0, 100 - recentBisCount * LOOT_PENALTY_PER_ITEM);

      const score =
        (attendanceScore * w.attendance / 100) +
        (droughtScore    * w.drought    / 100) +
        (lootScore       * w.loot       / 100);

      result.push({
        name,
        score: Math.round(score),
        attendanceScore: Math.round(attendanceScore),
        droughtScore: Math.round(droughtScore),
        lootScore: Math.round(lootScore),
        attendancePct,
        droughtDays,
        recentBisCount,
      });
    }

    result.sort((a, b) => b.score - a.score);
    setPriorities(result);
    setLoading(false);
  }, []);

  // Load weights from app_settings then compute
  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['priority_weight_attendance', 'priority_weight_drought', 'priority_weight_loot'])
      .then(({ data }) => {
        const w = { ...weights };
        for (const row of data ?? []) {
          const v = Number(row.value);
          if (row.key === 'priority_weight_attendance') w.attendance = v;
          if (row.key === 'priority_weight_drought')    w.drought    = v;
          if (row.key === 'priority_weight_loot')       w.loot       = v;
        }
        setWeights(w);
        compute(w);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => compute(weights), [compute, weights]);

  return { priorities, weights, loading, refresh };
}
