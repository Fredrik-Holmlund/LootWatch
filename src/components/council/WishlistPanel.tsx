import { useMemo } from 'react';
import type { LootEntry } from '../../types';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';

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

export function WishlistPanel({ entries }: WishlistPanelProps) {
  const summaries = useMemo<PlayerLootSummary[]>(() => {
    const map = new Map<string, PlayerLootSummary>();
    const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (const e of sorted) {
      const name = stripRealm(e.player_name);
      if (!map.has(name)) map.set(name, { name, playerClass: e.player_class, total: 0, lastLoot: null, responses: {} });
      const s = map.get(name)!;
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
      <div className="text-center py-12 text-[var(--color-lw-text-muted)] text-sm">
        No loot history available. Import CSV data in the History tab first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-lw-text-muted)] mb-4">
        Players sorted by fewest items received — useful for prioritizing distributions.
      </p>
      {summaries.map((s) => {
        const topResponse = Object.entries(s.responses).sort((a, b) => b[1] - a[1])[0];
        const pct = (s.total / maxTotal) * 100;
        return (
          <div key={s.name} className="lw-card p-4 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <div className="flex items-center gap-4">
              {/* Name + class */}
              <div className="w-36 flex-shrink-0">
                <p className="font-medium text-sm truncate" style={{ color: getClassColor(s.playerClass) }}>
                  {s.name}
                </p>
                <p className="text-xs text-[var(--color-lw-text-muted)] truncate">{s.playerClass ?? 'Unknown'}</p>
              </div>

              {/* Bar with text inside */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="relative h-6 bg-[var(--color-lw-border)] rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-500 bg-gradient-to-r from-[var(--color-lw-gold-500)] to-[var(--color-lw-gold-400)]"
                    style={{ width: `${pct}%`, opacity: 0.85 }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 pointer-events-none" style={{ clipPath: `inset(0 ${100 - pct}% 0 0 round 4px)` }}>
                    <span className="text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.75)' }}>{s.total} items</span>
                  </div>
                  <div className="absolute inset-0 flex items-center px-2 pointer-events-none" style={{ clipPath: `inset(0 0 0 ${pct}% round 4px)` }}>
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.total} items</span>
                  </div>
                </div>
                {s.lastLoot && (
                  <p className="text-xs text-[var(--color-lw-text-muted)] truncate">Last: {s.lastLoot}</p>
                )}
              </div>

              {/* Top response */}
              {topResponse && (
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-[var(--color-lw-text-sub)]">{topResponse[0]}</p>
                  <p className="text-xs text-[var(--color-lw-text-muted)]">×{topResponse[1]}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
