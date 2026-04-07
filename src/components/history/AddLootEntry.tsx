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
    if (err) {
      setError(err);
    } else {
      onClose();
    }
    setSaving(false);
  }

  const nameColor = getClassColor(selectedClass);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Add Loot Entry</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Player */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Player <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                ref={playerRef}
                type="text"
                value={playerName}
                onChange={(e) => handlePlayerInput(e.target.value)}
                onKeyDown={handlePlayerKey}
                placeholder="Type to search roster…"
                required
                style={playerName && selectedClass ? { color: nameColor } : undefined}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
              />
              {playerSuggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  {playerSuggestions.map((p, i) => (
                    <li
                      key={p.id}
                      onMouseDown={() => selectPlayer(p)}
                      className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${i === playerHiIdx ? 'bg-gray-700' : 'hover:bg-gray-700/60'}`}
                    >
                      <span style={{ color: getClassColor(p.player_class) }} className="font-medium">
                        {stripRealm(p.name)}
                      </span>
                      {p.player_class && <span className="text-xs text-gray-500">{p.player_class}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Item */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Item <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                ref={itemRef}
                type="text"
                value={itemName}
                onChange={(e) => handleItemInput(e.target.value)}
                onKeyDown={handleItemKey}
                placeholder="Type to search items…"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
              />
              {itemSuggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 w-full min-w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  {itemSuggestions.map((item, i) => (
                    <li
                      key={item.id}
                      onMouseDown={() => selectItem(item)}
                      className={`px-3 py-2 cursor-pointer ${i === itemHiIdx ? 'bg-gray-700' : 'hover:bg-gray-700/60'}`}
                    >
                      <p className="text-sm text-yellow-300/90">{item.item_name}</p>
                      <p className="text-xs text-gray-500">{item.boss_name} — {item.instance_name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Response */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Response</label>
            <select
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              {RESPONSES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Boss — auto-filled from item */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Boss</label>
            <input
              type="text"
              value={boss}
              onChange={(e) => setBoss(e.target.value)}
              placeholder="Auto-filled from item"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Raid — auto-filled from item */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Raid</label>
            <input
              type="text"
              value={raid}
              onChange={(e) => setRaid(e.target.value)}
              placeholder="Auto-filled from item"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Votes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Votes</label>
            <input
              type="number"
              value={votes}
              onChange={(e) => setVotes(e.target.value)}
              placeholder="0"
              min="0"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-gray-500">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !playerName.trim() || !itemName.trim()}
            className="text-sm px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
