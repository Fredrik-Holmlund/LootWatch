import { useMemo } from 'react';
import type { LootEntry } from '../../types';
import { getClassColor } from '../../utils/classColors';

interface WishlistPanelProps {
  entries: LootEntry[];
}

interface PlayerLootSummary {
  name: string;
  playerClass: string | null;
  total: number;
  lastLoot: string | null;
  responses: Record<string, number>;
}

/**
 * Shows a per-player summary of awarded loot to help council
 * plan upcoming raid distribution.
 */
export function WishlistPanel({ entries }: WishlistPanelProps) {
  const summaries = useMemo<PlayerLootSummary[]>(() => {
    const map = new Map<string, PlayerLootSummary>();

    const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    for (const e of sorted) {
      if (!map.has(e.player_name)) {
        map.set(e.player_name, {
          name: e.player_name,
          playerClass: e.player_class,
          total: 0,
          lastLoot: null,
          responses: {},
        });
      }
      const s = map.get(e.player_name)!;
      s.total++;
      s.lastLoot = e.item_name;
      const resp = e.response || 'Other';
      s.responses[resp] = (s.responses[resp] ?? 0) + 1;
    }

    return Array.from(map.values()).sort((a, b) => a.total - b.total);
  }, [entries]);

  const maxTotal = summaries.length > 0 ? Math.max(...summaries.map((s) => s.total)) : 1;

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        No loot history available. Import CSV data in the History tab first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 mb-4">
        Players sorted by fewest items received — useful for prioritizing distributions.
      </p>
      {summaries.map((s) => {
        const topResponse = Object.entries(s.responses).sort((a, b) => b[1] - a[1])[0];
        return (
          <div
            key={s.name}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Name + class */}
              <div className="w-36 flex-shrink-0">
                <p className="font-medium text-sm truncate" style={{ color: getClassColor(s.playerClass) }}>
                  {s.name}
                </p>
                <p className="text-xs text-gray-600 truncate">{s.playerClass ?? 'Unknown'}</p>
              </div>

              {/* Progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                      style={{ width: `${(s.total / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-300 w-8 text-right">{s.total}</span>
                </div>
                {s.lastLoot && (
                  <p className="text-xs text-gray-600 truncate">Last: {s.lastLoot}</p>
                )}
              </div>

              {/* Top response */}
              {topResponse && (
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-500">{topResponse[0]}</p>
                  <p className="text-xs text-gray-700">×{topResponse[1]}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
