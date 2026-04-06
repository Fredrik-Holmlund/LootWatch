import React, { useState, useMemo } from 'react';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { useLootCandidates } from '../../hooks/useLootCandidates';
import { TBC_PHASES, getPhaseForInstance } from '../../data/tbcPhases';
import type { RaidLoot } from '../../types';

export function LootPlanner() {
  const { loot, loading, error } = useRaidLoot();
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [selectedBoss, setSelectedBoss] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RaidLoot | null>(null);

  // Group loot by instance → boss
  const phaseInstances = useMemo(() => {
    const phase = TBC_PHASES.find((p) => p.id === selectedPhase);
    if (!phase) return [];

    // Filter loot for this phase's raids
    const phaseLoot = loot.filter((item) => {
      const phaseId = getPhaseForInstance(item.instance_name);
      return phaseId === selectedPhase;
    });

    // Group by instance then boss
    const byInstance: Record<string, { bosses: Record<string, RaidLoot[]> }> = {};
    for (const item of phaseLoot) {
      if (!byInstance[item.instance_name]) {
        byInstance[item.instance_name] = { bosses: {} };
      }
      const inst = byInstance[item.instance_name];
      if (!inst.bosses[item.boss_name]) {
        inst.bosses[item.boss_name] = [];
      }
      inst.bosses[item.boss_name].push(item);
    }
    return Object.entries(byInstance).map(([name, data]) => ({
      name,
      bosses: Object.entries(data.bosses).map(([boss, items]) => ({ boss, items })),
    }));
  }, [loot, selectedPhase]);

  const bossItems = useMemo(() => {
    if (!selectedBoss) return [];
    for (const inst of phaseInstances) {
      const found = inst.bosses.find((b) => b.boss === selectedBoss);
      if (found) return found.items;
    }
    return [];
  }, [phaseInstances, selectedBoss]);

  function handlePhaseChange(phaseId: number) {
    setSelectedPhase(phaseId);
    setSelectedBoss(null);
    setSelectedItem(null);
  }

  function handleBossSelect(boss: string) {
    setSelectedBoss(boss);
    setSelectedItem(null);
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-600 text-sm">Loading raid loot…</div>;
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-4">
        Error loading raid loot: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Phase tabs */}
      <div className="flex gap-1 flex-wrap">
        {TBC_PHASES.map((phase) => {
          const count = loot.filter((i) => getPhaseForInstance(i.instance_name) === phase.id).length;
          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseChange(phase.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedPhase === phase.id
                  ? 'bg-yellow-500 text-gray-950'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {phase.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {phaseInstances.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          No loot data for this phase yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Instance/Boss list */}
          <div className="space-y-3">
            {phaseInstances.map((inst) => (
              <div key={inst.name} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-800">
                  <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">{inst.name}</p>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {inst.bosses.map(({ boss, items }) => (
                    <button
                      key={boss}
                      onClick={() => handleBossSelect(boss)}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors ${
                        selectedBoss === boss
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-sm">{boss}</span>
                      <span className="text-xs text-gray-600">{items.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Middle: Item list */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {!selectedBoss ? (
              <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                Select a boss
              </div>
            ) : (
              <>
                <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{selectedBoss}</p>
                </div>
                <div className="divide-y divide-gray-800/50 overflow-y-auto max-h-[60vh]">
                  {bossItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <p className="text-sm text-yellow-300/90">{item.item_name}</p>
                      {item.item_id && (
                        <p className="text-xs text-gray-600 mt-0.5">#{item.item_id}</p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Candidates */}
          <div>
            {selectedItem ? (
              <CandidatePanel item={selectedItem} />
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center h-40 text-gray-600 text-sm">
                Select an item
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatePanel({ item }: { item: RaidLoot }) {
  const { candidates, loading, addCandidate, removeCandidate, moveCandidate, updateNote } =
    useLootCandidates(item.id);
  const [newPlayer, setNewPlayer] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayer.trim()) return;
    setAdding(true);
    await addCandidate(newPlayer.trim(), newNote.trim() || undefined);
    setNewPlayer('');
    setNewNote('');
    setAdding(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Item header */}
      <div className="px-3 py-3 bg-gray-800/50 border-b border-gray-800">
        <p className="text-sm font-semibold text-yellow-300">{item.item_name}</p>
        <div className="flex items-center gap-2 mt-1">
          {item.wowhead_url && (
            <a
              href={item.wowhead_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Wowhead ↗
            </a>
          )}
        </div>
      </div>

      {/* Candidates */}
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Candidates ({candidates.length})
        </p>

        {loading ? (
          <p className="text-xs text-gray-600">Loading…</p>
        ) : candidates.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No candidates yet.</p>
        ) : (
          <div className="space-y-1">
            {candidates.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-start gap-2 bg-gray-800/50 rounded-lg px-2.5 py-2"
              >
                <span className="text-xs text-gray-600 w-5 flex-shrink-0 mt-0.5 text-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{c.player_name}</p>
                  {editingNoteId === c.id ? (
                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-white focus:outline-none focus:border-yellow-500"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          await updateNote(c.id, editingNoteText);
                          setEditingNoteId(null);
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300 px-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="text-xs text-gray-500 hover:text-gray-300 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingNoteId(c.id);
                        setEditingNoteText(c.note ?? '');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-left block mt-0.5"
                    >
                      {c.note || '+ add note'}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveCandidate(c.id, 'up')}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveCandidate(c.id, 'down')}
                    disabled={idx === candidates.length - 1}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => removeCandidate(c.id)}
                  className="text-gray-700 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="pt-2 space-y-2">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="Player name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
          />
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
          />
          <button
            type="submit"
            disabled={adding || !newPlayer.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding…' : 'Add Candidate'}
          </button>
        </form>
      </div>
    </div>
  );
}
