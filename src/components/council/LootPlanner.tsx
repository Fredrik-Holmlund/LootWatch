import React, { useState, useMemo, useRef } from 'react';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { useLootCandidates } from '../../hooks/useLootCandidates';
import { usePlayers } from '../../hooks/usePlayers';
import { useWowheadTooltips } from '../../hooks/useWowheadTooltips';
import { TBC_PHASES, getPhaseForInstance, sortBosses } from '../../data/tbcPhases';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import type { RaidLoot, LootCandidate, Player, LootEntry, SoftReserve } from '../../types';

interface LootPlannerProps {
  historyEntries: LootEntry[];
  wishes: SoftReserve[];
}

export function LootPlanner({ historyEntries, wishes }: LootPlannerProps) {
  const { loot, loading, error } = useRaidLoot();
  const { players } = usePlayers();

  // Count how many times each item has been awarded (by item_id, fallback item_name)
  const awardedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of historyEntries) {
      const key = e.item_id ? `id:${e.item_id}` : `name:${e.item_name.toLowerCase()}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [historyEntries]);

  function getAwardedCount(item: RaidLoot): number {
    if (item.item_id) {
      const byId = awardedCounts.get(`id:${item.item_id}`);
      if (byId !== undefined) return byId;
    }
    return awardedCounts.get(`name:${item.item_name.toLowerCase()}`) ?? 0;
  }

  function getWishers(item: RaidLoot): SoftReserve[] {
    return wishes.filter((w) => w.raid_loot_id === item.id);
  }

  function getAwardedEntries(item: RaidLoot): LootEntry[] {
    return historyEntries.filter((e) =>
      item.item_id ? e.item_id === item.item_id : e.item_name.toLowerCase() === item.item_name.toLowerCase()
    );
  }
  const [selectedPhase, setSelectedPhase] = useState(1);

  const grouped = useMemo(() => {
    const phaseLoot = loot.filter(
      (item) => getPhaseForInstance(item.instance_name) === selectedPhase
    );

    const byInstance: Record<string, Record<string, RaidLoot[]>> = {};
    for (const item of phaseLoot) {
      if (!byInstance[item.instance_name]) byInstance[item.instance_name] = {};
      if (!byInstance[item.instance_name][item.boss_name])
        byInstance[item.instance_name][item.boss_name] = [];
      byInstance[item.instance_name][item.boss_name].push(item);
    }
    return byInstance;
  }, [loot, selectedPhase]);

  useWowheadTooltips([grouped, selectedPhase]);

  if (loading) return <div className="text-center py-10 text-gray-600 text-sm">Loading…</div>;
  if (error) return <div className="text-red-400 text-sm p-4">{error}</div>;

  const hasLoot = Object.keys(grouped).length > 0;

  return (
    <div className="space-y-4">
      {/* Phase tabs */}
      <div className="flex gap-1 flex-wrap">
        {TBC_PHASES.map((phase) => {
          const count = loot.filter((i) => getPhaseForInstance(i.instance_name) === phase.id).length;
          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedPhase === phase.id
                  ? 'bg-yellow-500 text-gray-950'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {phase.label}
              {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {!hasLoot ? (
        <div className="text-center py-10 text-gray-600 text-sm">No loot data for this phase.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([instance, bosses]) => (
            <div key={instance}>
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3">
                {instance}
              </h3>
              <div className="space-y-4">
                {sortBosses(instance, Object.keys(bosses)).map((boss) => (
                  <BossSection key={boss} boss={boss} items={bosses[boss]} players={players} getAwardedCount={getAwardedCount} getAwardedEntries={getAwardedEntries} getWishers={getWishers} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BossSection({ boss, items, players, getAwardedCount, getAwardedEntries, getWishers }: {
  boss: string; items: RaidLoot[]; players: Player[];
  getAwardedCount: (item: RaidLoot) => number;
  getAwardedEntries: (item: RaidLoot) => LootEntry[];
  getWishers: (item: RaidLoot) => SoftReserve[];
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg">
      <div className="px-4 py-2 bg-gray-800/60 border-b border-gray-800 rounded-t-lg">
        <p className="text-sm font-semibold text-gray-300">{boss}</p>
      </div>
      <div className="divide-y divide-gray-800/60">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} players={players} awardedCount={getAwardedCount(item)} awardedEntries={getAwardedEntries(item)} wishers={getWishers(item)} />
        ))}
      </div>
    </div>
  );
}

function ItemRow({ item, players, awardedCount, awardedEntries, wishers }: { item: RaidLoot; players: Player[]; awardedCount: number; awardedEntries: LootEntry[]; wishers: SoftReserve[] }) {
  const { candidates, loading, addCandidate, removeCandidate, moveCandidate } =
    useLootCandidates(item.id);
  const [adding, setAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(val: string) {
    setNewPlayer(val);
    setHighlightIdx(-1);
    if (!val.trim()) { setSuggestions([]); return; }
    const existing = new Set(candidates.map((c) => c.player_name.toLowerCase()));
    setSuggestions(
      players.filter(
        (p) =>
          stripRealm(p.name).toLowerCase().includes(val.toLowerCase()) &&
          !existing.has(stripRealm(p.name).toLowerCase())
      ).slice(0, 8)
    );
  }

  async function commitAdd(name: string) {
    if (!name.trim()) return;
    setAdding(true);
    await addCandidate(name.trim());
    setNewPlayer('');
    setSuggestions([]);
    setHighlightIdx(-1);
    setShowInput(false);
    setAdding(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const chosen = highlightIdx >= 0 ? stripRealm(suggestions[highlightIdx].name) : newPlayer;
    await commitAdd(chosen);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setShowInput(false); setNewPlayer(''); setSuggestions([]); }
  }

  return (
    <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Item name + icon */}
      <div className="min-w-[220px] flex items-center gap-2">
        {item.icon_url && (
          <img
            src={item.icon_url}
            alt=""
            className="w-7 h-7 rounded flex-shrink-0 border border-gray-700"
          />
        )}
        {item.wowhead_url ? (
          <a
            href={item.wowhead_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-yellow-300/90 hover:text-yellow-200 hover:underline leading-tight"
          >
            {item.item_name}
          </a>
        ) : (
          <span className="text-sm text-yellow-300/90 leading-tight">{item.item_name}</span>
        )}
      </div>

      {/* Awarded count badge with hover tooltip */}
      {awardedCount > 0 && (
        <span className="relative group/awarded">
          <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 whitespace-nowrap cursor-default">
            ×{awardedCount} awarded
          </span>
          <div className="absolute left-0 bottom-full mb-1.5 z-30 hidden group-hover/awarded:block min-w-[160px]">
            <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-xl p-2 space-y-1">
              {awardedEntries.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span style={{ color: getClassColor(e.player_class) }} className="font-medium">
                    {stripRealm(e.player_name)}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </span>
      )}

      {/* Wish count badge */}
      {wishers.length > 0 && (
        <span className="relative group/wishers">
          <span className="text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 whitespace-nowrap cursor-default">
            ♥ {wishers.length}
          </span>
          <div className="absolute left-0 bottom-full mb-1.5 z-30 hidden group-hover/wishers:block min-w-[140px]">
            <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-xl p-2 space-y-1">
              {wishers.map((w, i) => (
                <div key={i} className="text-xs">
                  <span style={{ color: getClassColor(w.player_class) }} className="font-medium">
                    {stripRealm(w.player_name)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </span>
      )}

      {/* Candidates */}
      <div className="flex flex-wrap items-center gap-1.5 flex-1">
        {loading ? (
          <span className="text-xs text-gray-700">…</span>
        ) : (
          <>
            {candidates.map((c, idx) => (
              <CandidatePill
                key={c.id}
                candidate={c}
                idx={idx}
                total={candidates.length}
                players={players}
                hasReceived={awardedEntries.some(
                  (e) => stripRealm(e.player_name).toLowerCase() === c.player_name.toLowerCase()
                )}
                onRemove={removeCandidate}
                onMove={moveCandidate}
              />
            ))}
          </>
        )}

        {/* Inline add with autocomplete */}
        {showInput ? (
          <form onSubmit={handleAdd} className="relative flex items-center gap-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newPlayer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search roster…"
                autoFocus
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 w-44"
              />
              {suggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                  {suggestions.map((p, i) => (
                    <li
                      key={p.id}
                      onMouseDown={() => commitAdd(stripRealm(p.name))}
                      className={`px-3 py-1.5 text-xs cursor-pointer flex items-center gap-2 ${i === highlightIdx ? 'bg-gray-700' : 'hover:bg-gray-700/60'}`}
                    >
                      <span className="font-medium" style={{ color: getClassColor(p.player_class) }}>
                        {stripRealm(p.name)}
                      </span>
                      {p.player_class && (
                        <span className="text-gray-600">{p.player_class}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" disabled={adding || !newPlayer.trim()} className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40 px-1">
              {adding ? '…' : 'Add'}
            </button>
            <button type="button" onClick={() => { setShowInput(false); setNewPlayer(''); setSuggestions([]); }} className="text-xs text-gray-600 hover:text-gray-400 px-1">
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="text-xs text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-700 rounded px-2 py-0.5 transition-colors"
          >
            + add
          </button>
        )}
      </div>
    </div>
  );
}

function CandidatePill({
  candidate,
  idx,
  total,
  players,
  hasReceived,
  onRemove,
  onMove,
}: {
  candidate: LootCandidate;
  idx: number;
  total: number;
  players: Player[];
  hasReceived: boolean;
  onRemove: (id: number) => Promise<string | null>;
  onMove: (id: number, dir: 'up' | 'down') => Promise<void>;
}) {
  const player = players.find((p) => stripRealm(p.name).toLowerCase() === candidate.player_name.toLowerCase());
  const classColor = getClassColor(player?.player_class ?? null);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-xs font-medium group"
      style={{ backgroundColor: classColor, border: `1px solid ${classColor}`, color: '#101828' }}
    >
      <span className="opacity-60 text-[10px] mr-0.5">{idx + 1}.</span>
      {candidate.player_name}
      {hasReceived && (
        <span className="text-[10px] font-bold opacity-70 ml-0.5" title="Already received this item">✓</span>
      )}
      <span className="hidden group-hover:inline-flex items-center gap-0.5 ml-0.5">
        <button
          onClick={() => onMove(candidate.id, 'up')}
          disabled={idx === 0}
          className="opacity-60 hover:opacity-100 disabled:opacity-20 leading-none"
        >
          ◂
        </button>
        <button
          onClick={() => onMove(candidate.id, 'down')}
          disabled={idx === total - 1}
          className="opacity-60 hover:opacity-100 disabled:opacity-20 leading-none"
        >
          ▸
        </button>
        <button
          onClick={() => onRemove(candidate.id)}
          className="opacity-40 hover:opacity-100 hover:text-red-400 leading-none ml-0.5"
        >
          ✕
        </button>
      </span>
    </span>
  );
}
