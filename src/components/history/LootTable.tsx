import { useState } from 'react';
import type { LootEntry, UserRole } from '../../types';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';

interface LootTableProps {
  entries: LootEntry[];
  role: UserRole | null;
  onDelete?: (id: string) => void;
  onUpdateNote?: (id: string, notes: string) => void;
  onUpdateRaid?: (id: string, raid: string) => void;
}

type SortKey = 'timestamp' | 'player_name' | 'item_name' | 'raid' | 'boss' | 'response';

export function LootTable({ entries, role, onDelete, onUpdateNote, onUpdateRaid }: LootTableProps) {
  const [search, setSearch] = useState('');
  const [filterRaid, setFilterRaid] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [editingRaid, setEditingRaid] = useState<string | null>(null);
  const [raidValue, setRaidValue] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const raids = Array.from(new Set(entries.map((e) => e.raid).filter(Boolean))).sort();
  const classes = Array.from(new Set(entries.map((e) => e.player_class).filter(Boolean))).sort() as string[];

  const filtered = entries
    .filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.player_name.toLowerCase().includes(q) && !e.item_name.toLowerCase().includes(q) && !e.boss.toLowerCase().includes(q)) return false;
      if (filterRaid && e.raid !== filterRaid) return false;
      if (filterClass && e.player_class !== filterClass) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      else if (sortKey === 'player_name') cmp = a.player_name.localeCompare(b.player_name);
      else if (sortKey === 'item_name') cmp = a.item_name.localeCompare(b.item_name);
      else if (sortKey === 'raid') cmp = a.raid.localeCompare(b.raid);
      else if (sortKey === 'boss') cmp = a.boss.localeCompare(b.boss);
      else if (sortKey === 'response') cmp = a.response.localeCompare(b.response);
      return sortAsc ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-700 ml-1">↕</span>;
    return <span className="text-yellow-400 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  function formatDate(ts: string) {
    try {
      return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ts; }
  }

  function startEditNote(e: LootEntry) {
    setEditingNote(e.id);
    setNoteValue(e.notes ?? '');
  }

  async function saveNote(id: string) {
    onUpdateNote?.(id, noteValue);
    setEditingNote(null);
  }

  function startEditRaid(e: LootEntry) {
    setEditingRaid(e.id);
    setRaidValue(e.raid);
  }

  async function saveRaid(id: string) {
    onUpdateRaid?.(id, raidValue.trim());
    setEditingRaid(null);
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search player, item, boss…"
          className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
        />
        <select
          value={filterRaid}
          onChange={(e) => { setFilterRaid(e.target.value); setPage(0); }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500/50"
        >
          <option value="">All Raids</option>
          {raids.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterClass}
          onChange={(e) => { setFilterClass(e.target.value); setPage(0); }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500/50"
        >
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-gray-600 self-center ml-1">
          {filtered.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                {([
                  ['timestamp', 'Date'],
                  ['player_name', 'Player'],
                  ['item_name', 'Item'],
                  ['raid', 'Raid'],
                  ['boss', 'Boss'],
                  ['response', 'Response'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 whitespace-nowrap select-none"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                {role === 'council' && (
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-600 text-sm">
                    No loot entries found
                  </td>
                </tr>
              ) : (
                paged.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-medium" style={{ color: getClassColor(entry.player_class) }}>
                        {stripRealm(entry.player_name)}
                      </span>
                      {entry.player_class && (
                        <span className="text-xs text-gray-600 ml-1.5">({entry.player_class})</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry.item_id ? (
                        <a
                          href={`https://www.wowhead.com/tbc/item=${entry.item_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {entry.item_name}
                        </a>
                      ) : (
                        <span className="text-gray-200">{entry.item_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap text-xs">
                      {editingRaid === entry.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={raidValue}
                            onChange={(e) => setRaidValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRaid(entry.id); if (e.key === 'Escape') setEditingRaid(null); }}
                            className="w-40 bg-gray-800 border border-yellow-500/50 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
                          />
                          <button onClick={() => saveRaid(entry.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingRaid(null)} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className={role === 'council' ? 'cursor-pointer hover:text-gray-200' : ''}
                          onClick={() => role === 'council' && startEditRaid(entry)}
                          title={role === 'council' ? 'Click to edit raid' : undefined}
                        >
                          {entry.raid || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap text-xs">{entry.boss}</td>
                    <td className="px-4 py-2.5">
                      <ResponseBadge response={entry.response} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-center text-xs">{entry.votes || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs">
                      {editingNote === entry.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveNote(entry.id); if (e.key === 'Escape') setEditingNote(null); }}
                            className="flex-1 bg-gray-800 border border-yellow-500/50 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
                          />
                          <button onClick={() => saveNote(entry.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingNote(null)} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className={role === 'council' ? 'cursor-pointer hover:text-gray-300' : ''}
                          onClick={() => role === 'council' && startEditNote(entry)}
                          title={role === 'council' ? 'Click to edit note' : undefined}
                        >
                          {entry.notes || (role === 'council' ? <span className="text-gray-700 italic">add note…</span> : '—')}
                        </span>
                      )}
                    </td>
                    {role === 'council' && (
                      <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onDelete?.(entry.id)}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors"
                          title="Delete entry"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 border border-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ResponseBadge({ response }: { response: string }) {
  const r = response.toLowerCase();
  let cls = 'text-gray-500 bg-gray-800';
  if (r.includes('bis') || r.includes('major') || r === 'ms') cls = 'text-green-400 bg-green-400/10';
  else if (r.includes('minor') || r === 'os' || r.includes('offspec')) cls = 'text-blue-400 bg-blue-400/10';
  else if (r.includes('pass') || r.includes('greed')) cls = 'text-gray-500 bg-gray-800';
  else if (r.includes('rot') || r.includes('open')) cls = 'text-orange-400 bg-orange-400/10';

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {response || '—'}
    </span>
  );
}
