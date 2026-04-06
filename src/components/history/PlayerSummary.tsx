import { useMemo, useState } from 'react';
import type { LootEntry } from '../../types';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';

interface PlayerSummaryProps {
  entries: LootEntry[];
}

interface PlayerStats {
  name: string;
  playerClass: string | null;
  total: number;
  byResponse: Record<string, number>;
  recentItems: string[];
}

type SortKey = 'total' | 'bis' | 'upgrade' | 'offspec';

const SORT_OPTIONS: { key: SortKey; label: string; color: string }[] = [
  { key: 'total',   label: 'Total',   color: '#e5e7eb' },
  { key: 'bis',     label: 'BIS',     color: '#f59e0b' },
  { key: 'upgrade', label: 'Upgrade', color: '#22c55e' },
  { key: 'offspec', label: 'Offspec', color: '#a78bfa' },
];

// Colour-code common RCLC responses
const RESPONSE_COLORS: Record<string, string> = {
  bis:            '#f59e0b',
  'best in slot': '#f59e0b',
  upgrade:        '#22c55e',
  'minor upgrade':'#86efac',
  offspec:        '#a78bfa',
  'off-spec':     '#a78bfa',
  pvp:            '#f87171',
  transmog:       '#67e8f9',
  greed:          '#94a3b8',
  pass:           '#4b5563',
};

// Which response strings map to each sort key
function responseMatchesKey(response: string, key: SortKey): boolean {
  const r = response.toLowerCase();
  if (key === 'bis')     return r === 'bis' || r === 'best in slot';
  if (key === 'upgrade') return r === 'upgrade' || r === 'minor upgrade';
  if (key === 'offspec') return r === 'offspec' || r === 'off-spec';
  return false;
}

function responseColor(response: string): string {
  return RESPONSE_COLORS[response.toLowerCase()] ?? '#6b7280';
}

function shortResponse(response: string): string {
  if (!response) return '?';
  // Abbreviate long responses
  if (response.length <= 10) return response;
  return response.slice(0, 9) + '…';
}

export function PlayerSummary({ entries }: PlayerSummaryProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total');

  const stats = useMemo<PlayerStats[]>(() => {
    const map = new Map<string, PlayerStats>();
    for (const e of entries) {
      const playerKey = stripRealm(e.player_name);
      if (!map.has(playerKey)) {
        map.set(playerKey, {
          name: playerKey,
          playerClass: e.player_class,
          total: 0,
          byResponse: {},
          recentItems: [],
        });
      }
      const s = map.get(playerKey)!;
      s.total++;
      const r = e.response || 'Unknown';
      s.byResponse[r] = (s.byResponse[r] ?? 0) + 1;
      if (s.recentItems.length < 3) s.recentItems.push(e.item_name);
    }

    const all = Array.from(map.values());

    if (sortKey === 'total') {
      return all.sort((a, b) => b.total - a.total);
    }

    return all.sort((a, b) => {
      const countFor = (s: PlayerStats) =>
        Object.entries(s.byResponse)
          .filter(([r]) => responseMatchesKey(r, sortKey))
          .reduce((sum, [, n]) => sum + n, 0);
      return countFor(b) - countFor(a);
    });
  }, [entries, sortKey]);

  if (stats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        No player data yet. Import a CSV to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Sort by</span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setSortKey(opt.key)}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            sortKey === opt.key
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
          }`}
          style={sortKey === opt.key ? { color: opt.color } : {}}
        >
          {opt.label}
        </button>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.name}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold" style={{ color: getClassColor(s.playerClass) }}>
                {s.name}
              </p>
              <p className="text-xs text-gray-600">{s.playerClass ?? 'Unknown class'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{s.total}</p>
              <p className="text-xs text-gray-600">items</p>
            </div>
          </div>

          {/* Per-response breakdown */}
          <div className="space-y-1 mb-3">
            {Object.entries(s.byResponse)
              .sort((a, b) => b[1] - a[1])
              .map(([response, count]) => (
                <div key={response} className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (count / s.total) * 100)}%`,
                        backgroundColor: responseColor(response),
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs w-20 truncate text-right"
                    style={{ color: responseColor(response) }}
                    title={response}
                  >
                    {shortResponse(response)}
                  </span>
                  <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                </div>
              ))}
          </div>

          {/* Recent items */}
          {s.recentItems.length > 0 && (
            <div className="border-t border-gray-800 pt-2">
              <p className="text-xs text-gray-600 mb-1">Recent loot</p>
              {s.recentItems.map((item, i) => (
                <p key={i} className="text-xs text-gray-500 truncate" title={item}>• {item}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    </div>
  );
}
