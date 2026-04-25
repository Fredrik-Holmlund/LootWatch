import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { useLootCandidates } from '../../hooks/useLootCandidates';
import { usePlayers } from '../../hooks/usePlayers';
import { useWowheadTooltips } from '../../hooks/useWowheadTooltips';
import { usePriorityScore } from '../../hooks/usePriorityScore';
import { TBC_PHASES, getPhaseForInstance, sortBosses } from '../../data/tbcPhases';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import type { RaidLoot, LootCandidate, Player, LootEntry, SoftReserve } from '../../types';

interface LootPlannerProps {
  historyEntries: LootEntry[];
  wishes: SoftReserve[];
}

export function LootPlanner({ historyEntries, wishes }: LootPlannerProps) {
  const { loot, loading, error, updateItemNote } = useRaidLoot();
  const { players } = usePlayers();
  const { priorities } = usePriorityScore();
  const priorityMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of priorities) m[p.name.toLowerCase()] = p.score;
    return m;
  }, [priorities]);

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
                  <BossSection
                    key={boss}
                    boss={boss}
                    items={bosses[boss]}
                    players={players}
                    priorityMap={priorityMap}
                    getAwardedCount={getAwardedCount}
                    getAwardedEntries={getAwardedEntries}
                    getWishers={getWishers}
                    updateItemNote={updateItemNote}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BossSection({ boss, items, players, priorityMap, getAwardedCount, getAwardedEntries, getWishers, updateItemNote }: {
  boss: string; items: RaidLoot[]; players: Player[];
  priorityMap: Record<string, number>;
  getAwardedCount: (item: RaidLoot) => number;
  getAwardedEntries: (item: RaidLoot) => LootEntry[];
  getWishers: (item: RaidLoot) => SoftReserve[];
  updateItemNote: (id: number, note: string) => Promise<string | null>;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg">
      <div className="px-4 py-2 bg-gray-800/60 border-b border-gray-800 rounded-t-lg">
        <p className="text-sm font-semibold text-gray-300">{boss}</p>
      </div>
      <div className="divide-y divide-gray-800/60">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            players={players}
            priorityMap={priorityMap}
            awardedCount={getAwardedCount(item)}
            awardedEntries={getAwardedEntries(item)}
            wishers={getWishers(item)}
            updateItemNote={updateItemNote}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  players,
  priorityMap,
  awardedCount,
  awardedEntries,
  wishers,
  updateItemNote,
}: {
  item: RaidLoot;
  players: Player[];
  priorityMap: Record<string, number>;
  awardedCount: number;
  awardedEntries: LootEntry[];
  wishers: SoftReserve[];
  updateItemNote: (id: number, note: string) => Promise<string | null>;
}) {
  const { candidates, loading, addCandidate, removeCandidate, moveCandidate, reorderCandidates, updateNote } =
    useLootCandidates(item.id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = candidates.findIndex((c) => c.id === active.id);
    const newIdx = candidates.findIndex((c) => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderCandidates(arrayMove(candidates, oldIdx, newIdx));
  }

  const [adding, setAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Item-level note state
  const [noteEdit, setNoteEdit] = useState(false);
  const [noteText, setNoteText] = useState(item.note ?? '');
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    if (!noteEdit) setNoteText(item.note ?? '');
  }, [item.note, noteEdit]);

  async function saveNote() {
    setNoteSaving(true);
    await updateItemNote(item.id, noteText);
    setNoteSaving(false);
    setNoteEdit(false);
  }

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
    <div className="group/row">
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
          {/* Note pencil — shown on row hover when no note exists */}
          {!item.note && !noteEdit && (
            <button
              onClick={() => setNoteEdit(true)}
              className="text-gray-700 hover:text-gray-400 opacity-0 group-hover/row:opacity-100 transition-opacity text-xs"
              title="Add item note"
            >
              ✎
            </button>
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
            <div className="absolute left-0 bottom-full mb-1.5 z-30 hidden group-hover/wishers:block min-w-[160px]">
              <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-xl p-2 space-y-1">
                {[...wishers].sort((a, b) => (b.star ?? 0) - (a.star ?? 0)).map((w, i) => (
                  <div key={i} className="text-xs flex items-center justify-between gap-3">
                    <span style={{ color: getClassColor(w.player_class) }} className="font-medium">
                      {stripRealm(w.player_name)}
                    </span>
                    {w.star && (
                      <span className={`font-bold ${w.star === 3 ? 'text-yellow-400' : w.star === 2 ? 'text-yellow-300' : 'text-gray-400'}`}>
                        {'★'.repeat(w.star)}
                      </span>
                    )}
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={candidates.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                {candidates.map((c, idx) => (
                  <CandidatePill
                    key={c.id}
                    candidate={c}
                    idx={idx}
                    total={candidates.length}
                    players={players}
                    priorityScore={priorityMap[c.player_name.toLowerCase()]}
                    hasReceived={awardedEntries.some(
                      (e) => stripRealm(e.player_name).toLowerCase() === c.player_name.toLowerCase()
                    )}
                    onRemove={removeCandidate}
                    onMove={moveCandidate}
                    onUpdateNote={updateNote}
                  />
                ))}
              </SortableContext>
            </DndContext>
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

      {/* Item-level note */}
      {(noteEdit || item.note) && (
        <div className="px-4 pb-3 -mt-1">
          {noteEdit ? (
            <div className="flex items-start gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setNoteEdit(false); setNoteText(item.note ?? ''); }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); }
                }}
                placeholder="Add a council note for this item…"
                rows={2}
                autoFocus
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none w-full max-w-lg"
              />
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  onClick={saveNote}
                  disabled={noteSaving}
                  className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40 whitespace-nowrap"
                >
                  {noteSaving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setNoteEdit(false); setNoteText(item.note ?? ''); }}
                  className="text-xs text-gray-600 hover:text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 italic">{item.note}</span>
              <button
                onClick={() => setNoteEdit(true)}
                className="text-gray-700 hover:text-gray-400 opacity-0 group-hover/row:opacity-100 transition-opacity text-xs"
                title="Edit note"
              >
                ✎
              </button>
              <button
                onClick={() => { setNoteText(''); updateItemNote(item.id, ''); }}
                className="text-gray-700 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity text-xs"
                title="Remove note"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#facc15';
  if (score >= 25) return '#fb923c';
  return '#f87171';
}

function CandidatePill({
  candidate,
  idx,
  total,
  players,
  priorityScore,
  hasReceived,
  onRemove,
  onMove,
  onUpdateNote,
}: {
  candidate: LootCandidate;
  idx: number;
  total: number;
  players: Player[];
  priorityScore?: number;
  hasReceived: boolean;
  onRemove: (id: number) => Promise<string | null>;
  onMove: (id: number, dir: 'up' | 'down') => Promise<void>;
  onUpdateNote: (id: number, note: string) => Promise<string | null>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: candidate.id });
  const player = players.find((p) => stripRealm(p.name).toLowerCase() === candidate.player_name.toLowerCase());
  const classColor = getClassColor(player?.player_class ?? null);

  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(candidate.note ?? '');

  useEffect(() => {
    if (!editingNote) setNoteText(candidate.note ?? '');
  }, [candidate.note, editingNote]);

  async function saveNote() {
    await onUpdateNote(candidate.id, noteText);
    setEditingNote(false);
  }

  return (
    <span className="relative group/pill inline-block">
      <span
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-xs font-medium cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundColor: classColor,
          border: `1px solid ${classColor}`,
          color: '#101828',
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 50 : undefined,
        }}
      >
        <span className="opacity-60 text-[10px] mr-0.5">{idx + 1}.</span>
        {candidate.player_name}
        {candidate.note && (
          <span className="text-[10px] opacity-60 ml-0.5" title={candidate.note}>📝</span>
        )}
        {hasReceived && (
          <span className="text-[10px] font-bold opacity-70 ml-0.5" title="Already received this item">✓</span>
        )}
        {priorityScore !== undefined && (
          <span
            className="text-[10px] font-bold rounded px-1 ml-0.5"
            style={{ backgroundColor: '#1f2937', color: scoreColor(priorityScore) }}
            title={`Priority score: ${priorityScore}`}
          >
            {priorityScore}
          </span>
        )}
        <span className="hidden group-hover/pill:inline-flex items-center gap-0.5 ml-0.5">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMove(candidate.id, 'up'); }}
            disabled={idx === 0}
            className="opacity-60 hover:opacity-100 disabled:opacity-20 leading-none"
          >
            ◂
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMove(candidate.id, 'down'); }}
            disabled={idx === total - 1}
            className="opacity-60 hover:opacity-100 disabled:opacity-20 leading-none"
          >
            ▸
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setEditingNote(true); }}
            className="opacity-50 hover:opacity-100 leading-none ml-0.5"
            title="Edit note"
          >
            ✎
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(candidate.id); }}
            className="opacity-40 hover:opacity-100 hover:text-red-400 leading-none ml-0.5"
          >
            ✕
          </button>
        </span>
      </span>

      {/* Candidate note tooltip (read) */}
      {candidate.note && !editingNote && (
        <div className="absolute left-0 bottom-full mb-1.5 z-40 hidden group-hover/pill:block pointer-events-none">
          <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-xl px-2.5 py-1.5 text-xs text-gray-300 whitespace-pre-wrap max-w-[220px]">
            {candidate.note}
          </div>
        </div>
      )}

      {/* Candidate note editor */}
      {editingNote && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 w-56">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setEditingNote(false); setNoteText(candidate.note ?? ''); }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); }
            }}
            placeholder="Note for this candidate…"
            rows={3}
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none"
          />
          <div className="flex justify-end gap-2 mt-1.5">
            <button onClick={() => { setEditingNote(false); setNoteText(candidate.note ?? ''); }} className="text-xs text-gray-600 hover:text-gray-400">Cancel</button>
            <button onClick={saveNote} className="text-xs text-yellow-400 hover:text-yellow-300">Save</button>
          </div>
        </div>
      )}
    </span>
  );
}
