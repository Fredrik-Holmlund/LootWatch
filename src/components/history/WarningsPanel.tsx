import { useMemo } from 'react';
import type { LootEntry } from '../../types';
import { getClassColor } from '../../utils/classColors';
import { usePlayers } from '../../hooks/usePlayers';

interface WarningsPanelProps {
  entries: LootEntry[];
}

export function WarningsPanel({ entries }: WarningsPanelProps) {
  const { players } = usePlayers();

  const { noLootPlayers, lowLootPlayers, avg } = useMemo(() => {
    const countMap = new Map<string, { count: number; playerClass: string | null; displayName: string }>();
    for (const e of entries) {
      const key = e.player_name.toLowerCase();
      if (!countMap.has(key)) countMap.set(key, { count: 0, playerClass: e.player_class, displayName: e.player_name });
      countMap.get(key)!.count++;
    }

    const counts = Array.from(countMap.values()).map((v) => v.count);
    const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const lowThreshold = Math.max(1, avg * 0.5);

    const noLootPlayers = players
      .filter((p) => !countMap.has(p.name.toLowerCase()))
      .map((p) => ({ name: p.name, playerClass: p.player_class }));

    const lowLootPlayers = Array.from(countMap.values())
      .filter((p) => p.count > 0 && p.count < lowThreshold)
      .sort((a, b) => a.count - b.count);

    return { noLootPlayers, lowLootPlayers, avg };
  }, [entries, players]);

  const hasWarnings = noLootPlayers.length > 0 || lowLootPlayers.length > 0;

  if (!hasWarnings) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-3xl">✅</p>
        <p className="text-gray-400 text-sm font-medium">No loot warnings</p>
        <p className="text-gray-600 text-xs">All rostered players have received loot recently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-600">
        Guild average: <span className="text-gray-400">{avg.toFixed(1)} items/player</span>.{' '}
        Low threshold: below {Math.max(1, Math.floor(avg * 0.5))} items.
      </p>

      {noLootPlayers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            No loot received ({noLootPlayers.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {noLootPlayers.map((p) => (
              <div key={p.name} className="bg-gray-900 border border-red-900/40 rounded-lg px-3 py-2">
                <p className="text-sm font-medium" style={{ color: getClassColor(p.playerClass) }}>
                  {p.name}
                </p>
                <p className="text-xs text-gray-600">{p.playerClass ?? 'Unknown'}</p>
                <p className="text-xs text-red-500 mt-1 font-semibold">0 items</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {lowLootPlayers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Low loot — below 50% of average ({lowLootPlayers.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {lowLootPlayers.map((p) => (
              <div key={p.displayName} className="bg-gray-900 border border-yellow-900/40 rounded-lg px-3 py-2">
                <p className="text-sm font-medium" style={{ color: getClassColor(p.playerClass) }}>
                  {p.displayName}
                </p>
                <p className="text-xs text-gray-600">{p.playerClass ?? 'Unknown'}</p>
                <p className="text-xs text-yellow-500 mt-1 font-semibold">
                  {p.count} item{p.count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
