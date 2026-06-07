import { useState, useMemo } from 'react';
import type { LootEntry, UserRole } from '../../types';
import { canEdit } from '../../types';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import { useWowheadTooltips } from '../../hooks/useWowheadTooltips';

const RESPONSES = ['BIS', 'Upgrade', 'Minor Upgrade', 'Offspec', 'Transmog', 'PvP', 'Greed', 'Other'];

interface LootTableProps {
  entries: LootEntry[];
  role: UserRole | null;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<string | null>;
  onUpdateNote?: (id: string, notes: string) => void;
  onUpdateRaid?: (id: string, raid: string) => void;
  onUpdateBoss?: (id: string, boss: string) => void;
  onUpdateResponse?: (id: string, response: string) => void;
}

type SortKey = 'timestamp' | 'player_name' | 'item_name' | 'raid' | 'boss' | 'response';

const inputEdit = 'bg-[var(--color-lw-base)] border border-[var(--color-lw-purple-500)]/50 rounded px-2 py-0.5 text-[var(--color-lw-text)] text-xs focus:outline-none';

export function LootTable({ entries, role, onDelete, onBulkDelete, onUpdateNote, onUpdateRaid, onUpdateBoss, onUpdateResponse }: LootTableProps) {
  const [search, setSearch] = useState('');
  const [filterRaid, setFilterRaid] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [editingRaid, setEditingRaid] = useState<string | null>(null);
  const [raidValue, setRaidValue] = useState('');
  const [editingBoss, setEditingBoss] = useState<string | null>(null);
  const [bossValue, setBossValue] = useState('');
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  useWowheadTooltips([paged]);

  const allPageIds = useMemo(() => paged.map((e) => e.id), [paged]);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) allPageIds.forEach((id) => next.delete(id));
      else allPageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} selected entries?`)) return;
    setBulkDeleting(true);
    await onBulkDelete?.([...selected]);
    setSelected(new Set());
    setBulkDeleting(false);
  }

  function exportCSV() {
    const cols = ['Date', 'Player', 'Class', 'Item', 'Raid', 'Boss', 'Response', 'Votes', 'Notes'];
    const rows = filtered.map((e) => [
      new Date(e.timestamp).toISOString().slice(0, 10),
      stripRealm(e.player_name),
      e.player_class ?? '',
      e.item_name,
      e.raid ?? '',
      e.boss ?? '',
      e.response ?? '',
      String(e.votes ?? ''),
      (e.notes ?? '').replace(/"/g, '""'),
    ].map((v) => `"${v}"`).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loot-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-[var(--color-lw-border)] ml-1">↕</span>;
    return <span className="text-[var(--color-lw-purple-400)] ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  function formatDate(ts: string) {
    try {
      return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ts; }
  }

  function startEditNote(e: LootEntry) { setEditingNote(e.id); setNoteValue(e.notes ?? ''); }
  async function saveNote(id: string) { onUpdateNote?.(id, noteValue); setEditingNote(null); }
  function startEditRaid(e: LootEntry) { setEditingRaid(e.id); setRaidValue(e.raid); }
  async function saveRaid(id: string) { onUpdateRaid?.(id, raidValue.trim()); setEditingRaid(null); }
  function startEditBoss(e: LootEntry) { setEditingBoss(e.id); setBossValue(e.boss ?? ''); }
  async function saveBoss(id: string) { onUpdateBoss?.(id, bossValue.trim()); setEditingBoss(null); }
  async function saveResponse(id: string, response: string) { onUpdateResponse?.(id, response); setEditingResponse(null); }

  const filterCls = 'lw-card rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text)] placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors';

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search player, item, boss…"
          className={`flex-1 min-w-48 ${filterCls}`}
        />
        <select
          value={filterRaid}
          onChange={(e) => { setFilterRaid(e.target.value); setPage(0); }}
          className={filterCls}
        >
          <option value="">All Raids</option>
          {raids.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterClass}
          onChange={(e) => { setFilterClass(e.target.value); setPage(0); }}
          className={filterCls}
        >
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-[var(--color-lw-text-muted)] self-center ml-1">
          {filtered.length} entries
        </span>
        <button
          onClick={exportCSV}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-[var(--color-lw-border)] text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:border-[var(--color-lw-border-sub)] transition-colors"
        >
          Export CSV
        </button>
        {canEdit(role) && selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
          >
            {bulkDeleting ? 'Deleting…' : `Delete ${selected.size} selected`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="lw-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/60">
                {canEdit(role) && (
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="accent-[var(--color-lw-purple-500)] cursor-pointer"
                    />
                  </th>
                )}
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
                    className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-lw-text-sub)] whitespace-nowrap select-none transition-colors"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Votes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Notes</th>
                {canEdit(role) && (
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-lw-border-sub)]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[var(--color-lw-text-muted)] text-sm">
                    No loot entries found
                  </td>
                </tr>
              ) : (
                paged.map((entry) => (
                  <tr key={entry.id} className={`transition-colors group odd:bg-[var(--color-lw-surface)]/25 even:bg-transparent hover:bg-[var(--color-lw-surface)]/60 ${selected.has(entry.id) ? '!bg-[var(--color-lw-purple-500)]/8' : ''}`}>
                    {canEdit(role) && (
                      <td className="px-4 py-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                          className="accent-[var(--color-lw-purple-500)] cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-[var(--color-lw-text-muted)] whitespace-nowrap text-xs">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-medium" style={{ color: getClassColor(entry.player_class) }}>
                        {stripRealm(entry.player_name)}
                      </span>
                      {entry.player_class && (
                        <span className="text-xs text-[var(--color-lw-text-muted)] ml-1.5">({entry.player_class})</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry.item_id ? (
                        <a
                          href={`https://www.wowhead.com/tbc/item=${entry.item_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: '#a335ee' }}
                        >
                          {entry.item_name}
                        </a>
                      ) : (
                        <span className="text-[var(--color-lw-text)]">{entry.item_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-lw-text-sub)] whitespace-nowrap text-xs">
                      {editingRaid === entry.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus value={raidValue}
                            onChange={(e) => setRaidValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRaid(entry.id); if (e.key === 'Escape') setEditingRaid(null); }}
                            className={`w-40 ${inputEdit}`}
                          />
                          <button onClick={() => saveRaid(entry.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingRaid(null)} className="text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className={canEdit(role) ? 'cursor-pointer hover:text-[var(--color-lw-text)]' : ''}
                          onClick={() => canEdit(role) && startEditRaid(entry)}
                          title={canEdit(role) ? 'Click to edit raid' : undefined}
                        >
                          {entry.raid || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-lw-text-sub)] whitespace-nowrap text-xs">
                      {editingBoss === entry.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus value={bossValue}
                            onChange={(e) => setBossValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveBoss(entry.id); if (e.key === 'Escape') setEditingBoss(null); }}
                            className={`w-36 ${inputEdit}`}
                          />
                          <button onClick={() => saveBoss(entry.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingBoss(null)} className="text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className={role === 'admin' ? 'cursor-pointer hover:text-[var(--color-lw-text)]' : ''}
                          onClick={() => role === 'admin' && startEditBoss(entry)}
                          title={role === 'admin' ? 'Click to edit boss' : undefined}
                        >
                          {entry.boss || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {editingResponse === entry.id ? (
                        <select
                          autoFocus
                          defaultValue={entry.response}
                          onChange={(e) => saveResponse(entry.id, e.target.value)}
                          onBlur={() => setEditingResponse(null)}
                          className={`${inputEdit} w-auto`}
                        >
                          {RESPONSES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span
                          className={role === 'admin' ? 'cursor-pointer' : ''}
                          onClick={() => role === 'admin' && setEditingResponse(entry.id)}
                          title={role === 'admin' ? 'Click to edit response' : undefined}
                        >
                          <ResponseBadge response={entry.response} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-lw-text-sub)] text-center text-xs">{entry.votes || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-lw-text-muted)] max-w-xs">
                      {editingNote === entry.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveNote(entry.id); if (e.key === 'Escape') setEditingNote(null); }}
                            className={`flex-1 ${inputEdit}`}
                          />
                          <button onClick={() => saveNote(entry.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingNote(null)} className="text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className={canEdit(role) ? 'cursor-pointer hover:text-[var(--color-lw-text-sub)]' : ''}
                          onClick={() => canEdit(role) && startEditNote(entry)}
                          title={canEdit(role) ? 'Click to edit note' : undefined}
                        >
                          {entry.notes || (canEdit(role) ? <span className="text-[var(--color-lw-border)] italic">add note…</span> : '—')}
                        </span>
                      )}
                    </td>
                    {canEdit(role) && (
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
            className="text-xs px-3 py-1.5 border border-[var(--color-lw-border)] rounded-lg text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:border-[var(--color-lw-border-sub)] disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--color-lw-text-muted)]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 border border-[var(--color-lw-border)] rounded-lg text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:border-[var(--color-lw-border-sub)] disabled:opacity-30 transition-colors"
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
  let cls = 'text-[var(--color-lw-text-muted)] bg-[var(--color-lw-base)]';
  if (r === 'bis')                              cls = 'text-green-400 bg-green-400/10';
  else if (r === 'upgrade')                     cls = 'text-[var(--color-lw-purple-400)] bg-[var(--color-lw-purple-500)]/10';
  else if (r.includes('minor') || r === 'offspec') cls = 'text-blue-400 bg-blue-400/10';
  else if (r.includes('transmog') || r === 'pvp') cls = 'text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10';
  else if (r.includes('greed') || r === 'other') cls = 'text-[var(--color-lw-text-muted)] bg-[var(--color-lw-elevated)]';

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {response || '—'}
    </span>
  );
}
