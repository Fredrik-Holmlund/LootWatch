import { useMemo } from 'react';
import type { LootEntry } from '../../types';
import { getClassColor } from '../../utils/classColors';

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

// Colour-code common RCLC responses
const RESPONSE_COLORS: Record<string, string> = {
  bis:            '#f59e0b',  // amber
  'best in slot': '#f59e0b',
  upgrade:        '#22c55e',  // green
  'minor upgrade':'#86efac',  // light green
  offspec:        '#a78bfa',  // purple
  'off-spec':     '#a78bfa',
  pvp:            '#f87171',  // red
  transmog:       '#67e8f9',  // cyan
  greed:          '#94a3b8',  // slate
  pass:           '#4b5563',  // dark gray
};

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
  const stats = useMemo<PlayerStats[]>(() => {
    const map = new Map<string, PlayerStats>();
    for (const e of entries) {
      if (!map.has(e.player_name)) {
        map.set(e.player_name, {
          name: e.player_name,
          playerClass: e.player_class,
          total: 0,
          byResponse: {},
          recentItems: [],
        });
      }
      const s = map.get(e.player_name)!;
      s.total++;
      const r = e.response || 'Unknown';
      s.byResponse[r] = (s.byResponse[r] ?? 0) + 1;
      if (s.recentItems.length < 3) s.recentItems.push(e.item_name);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [entries]);

  if (stats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        No player data yet. Import a CSV to get started.
      </div>
    );
  }

  return (
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
  );
}
