import React, { useState, useRef } from 'react';
import { usePlayers } from '../../hooks/usePlayers';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import type { LootEntry, WoWClass } from '../../types';

const RESPONSES = ['BIS', 'Upgrade', 'Minor Upgrade', 'Offspec', 'Transmog', 'PvP', 'Greed', 'Other'];

interface AddLootEntryProps {
  onAdd: (entries: Omit<LootEntry, 'id' | 'created_at'>[]) => Promise<string | null>;
  onClose: () => void;
}

const inputCls = 'w-full bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text)] placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors';

export function AddLootEntry({ onAdd, onClose }: AddLootEntryProps) {
  const { players } = usePlayers();
  const { loot: raidLoot } = useRaidLoot();

  const [playerName, setPlayerName] = useState('');
  const [playerSuggestions, setPlayerSuggestions] = useState<typeof players>([]);
  const [selectedClass, setSelectedClass] = useState<WoWClass | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemId, setItemId] = useState<number | null>(null);
  const [itemSuggestions, setItemSuggestions] = useState<typeof raidLoot>([]);

  const [boss, setBoss] = useState('');
  const [raid, setRaid] = useState('');
  const [response, setResponse] = useState('BIS');
  const [votes, setVotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerHiIdx, setPlayerHiIdx] = useState(-1);
  const [itemHiIdx, setItemHiIdx] = useState(-1);

  const playerRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);

  function handlePlayerInput(val: string) {
    setPlayerName(val);
    setPlayerHiIdx(-1);
    setSelectedClass(null);
    if (!val.trim()) { setPlayerSuggestions([]); return; }
    setPlayerSuggestions(
      players.filter((p) => stripRealm(p.name).toLowerCase().includes(val.toLowerCase())).slice(0, 8)
    );
  }

  function selectPlayer(p: typeof players[number]) {
    setPlayerName(stripRealm(p.name));
    setSelectedClass(p.player_class);
    setPlayerSuggestions([]);
  }

  function handlePlayerKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPlayerHiIdx((i) => Math.min(i + 1, playerSuggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPlayerHiIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && playerHiIdx >= 0) { e.preventDefault(); selectPlayer(playerSuggestions[playerHiIdx]); }
    else if (e.key === 'Escape') setPlayerSuggestions([]);
  }

  function handleItemInput(val: string) {
    setItemName(val);
    setItemId(null);
    setBoss('');
    setRaid('');
    setItemHiIdx(-1);
    if (!val.trim()) { setItemSuggestions([]); return; }
    setItemSuggestions(
      raidLoot.filter((i) => i.item_name.toLowerCase().includes(val.toLowerCase())).slice(0, 10)
    );
  }

  function selectItem(item: typeof raidLoot[number]) {
    setItemName(item.item_name);
    setItemId(item.item_id);
    setBoss(item.boss_name);
    setRaid(item.instance_name);
    setItemSuggestions([]);
  }

  function handleItemKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setItemHiIdx((i) => Math.min(i + 1, itemSuggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setItemHiIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && itemHiIdx >= 0) { e.preventDefault(); selectItem(itemSuggestions[itemHiIdx]); }
    else if (e.key === 'Escape') setItemSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim() || !itemName.trim()) return;
    setSaving(true);
    setError(null);

    const entry: Omit<LootEntry, 'id' | 'created_at'> = {
      timestamp: new Date(date).toISOString(),
      player_name: playerName.trim(),
      player_class: selectedClass,
      item_name: itemName.trim(),
      item_id: itemId,
      boss: boss.trim() || 'Unknown',
      raid: raid.trim() || 'Unknown',
      response,
      votes: parseInt(votes) || 0,
      awarded_by: 'Manual',
      notes: notes.trim() || null,
    };

    const err = await onAdd([entry]);
    if (err) setError(err);
    else onClose();
    setSaving(false);
  }

  const dropdownCls = 'absolute left-0 top-full mt-1 w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg shadow-xl z-20 overflow-hidden';

  return (
    <div className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-[var(--color-lw-text)]">Add Loot Entry</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Player */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Player <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                ref={playerRef}
                type="text"
                value={playerName}
                onChange={(e) => handlePlayerInput(e.target.value)}
                onKeyDown={handlePlayerKey}
                placeholder="Type to search roster…"
                required
                style={playerName && selectedClass ? { color: getClassColor(selectedClass) } : undefined}
                className={inputCls}
              />
              {playerSuggestions.length > 0 && (
                <ul className={dropdownCls}>
                  {playerSuggestions.map((p, i) => (
                    <li
                      key={p.id}
                      onMouseDown={() => selectPlayer(p)}
                      className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${i === playerHiIdx ? 'bg-[var(--color-lw-border)]' : 'hover:bg-[var(--color-lw-border)]/60'}`}
                    >
                      <span style={{ color: getClassColor(p.player_class) }} className="font-medium">
                        {stripRealm(p.name)}
                      </span>
                      {p.player_class && <span className="text-xs text-[var(--color-lw-text-muted)]">{p.player_class}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Item */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Item <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                ref={itemRef}
                type="text"
                value={itemName}
                onChange={(e) => handleItemInput(e.target.value)}
                onKeyDown={handleItemKey}
                placeholder="Type to search items…"
                required
                className={inputCls}
              />
              {itemSuggestions.length > 0 && (
                <ul className={`${dropdownCls} min-w-72`}>
                  {itemSuggestions.map((item, i) => (
                    <li
                      key={item.id}
                      onMouseDown={() => selectItem(item)}
                      className={`px-3 py-2 cursor-pointer ${i === itemHiIdx ? 'bg-[var(--color-lw-border)]' : 'hover:bg-[var(--color-lw-border)]/60'}`}
                    >
                      <p className="text-sm" style={{ color: '#a335ee' }}>{item.item_name}</p>
                      <p className="text-xs text-[var(--color-lw-text-muted)]">{item.boss_name} — {item.instance_name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Response */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Response</label>
            <select value={response} onChange={(e) => setResponse(e.target.value)} className={inputCls}>
              {RESPONSES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Boss */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Boss</label>
            <input type="text" value={boss} onChange={(e) => setBoss(e.target.value)} placeholder="Auto-filled from item" className={inputCls} />
          </div>

          {/* Raid */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Raid</label>
            <input type="text" value={raid} onChange={(e) => setRaid(e.target.value)} placeholder="Auto-filled from item" className={inputCls} />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>

          {/* Votes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Votes</label>
            <input type="number" value={votes} onChange={(e) => setVotes(e.target.value)} placeholder="0" min="0" className={inputCls} />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-[var(--color-lw-text-muted)]">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note…" className={inputCls} />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-1.5 text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] border border-[var(--color-lw-border)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !playerName.trim() || !itemName.trim()}
            className="text-sm px-4 py-1.5 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
