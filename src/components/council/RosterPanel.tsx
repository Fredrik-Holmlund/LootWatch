import { useState, useMemo } from 'react';
import { usePlayers } from '../../hooks/usePlayers';
import { CLASS_COLORS } from '../../utils/classColors';
import type { LootEntry, WoWClass } from '../../types';

const WOW_CLASSES: WoWClass[] = [
  'Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest',
  'Shaman', 'Mage', 'Warlock', 'Druid',
];

interface RosterPanelProps {
  historyEntries: LootEntry[];
}

export function RosterPanel({ historyEntries }: RosterPanelProps) {
  const { players, loading, addPlayer, deletePlayer } = usePlayers();
  const [name, setName] = useState('');
  const [cls, setCls] = useState<WoWClass | ''>('');
  const [rank, setRank] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Players in history that are not yet in the roster
  const missingFromRoster = useMemo(() => {
    const rosterNames = new Set(players.map((p) => p.name.toLowerCase()));
    const seen = new Set<string>();
    const missing: { name: string; player_class: WoWClass | null }[] = [];
    for (const e of historyEntries) {
      const key = e.player_name.toLowerCase();
      if (!rosterNames.has(key) && !seen.has(key)) {
        seen.add(key);
        missing.push({ name: e.player_name, player_class: e.player_class });
      }
    }
    return missing;
  }, [historyEntries, players]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const err = await addPlayer({ name: name.trim(), player_class: cls || null, rank: rank.trim() || undefined });
    if (err) setError(err);
    else { setName(''); setCls(''); setRank(''); }
    setSaving(false);
  }

  async function handleSync() {
    if (missingFromRoster.length === 0) return;
    setSyncing(true);
    setSyncResult(null);
    let added = 0;
    for (const p of missingFromRoster) {
      const err = await addPlayer({ name: p.name, player_class: p.player_class });
      if (!err) added++;
    }
    setSyncResult(`Added ${added} player${added !== 1 ? 's' : ''} from loot history.`);
    setSyncing(false);
  }

  return (
    <div className="space-y-5">
      {/* Sync banner */}
      {missingFromRoster.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-yellow-300">
            <span className="font-semibold">{missingFromRoster.length} player{missingFromRoster.length !== 1 ? 's' : ''}</span> in loot history are not in the roster.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync from History'}
          </button>
        </div>
      )}
      {syncResult && (
        <p className="text-xs text-green-400">{syncResult}</p>
      )}

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Add Guild Member</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playername-Realm"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Class</label>
            <select
              value={cls}
              onChange={(e) => setCls(e.target.value as WoWClass | '')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="">— any —</option>
              {WOW_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Rank</label>
            <input
              type="text"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="e.g. Raider"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 w-32"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* Player list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-gray-300">
            Roster <span className="text-gray-600 font-normal">({players.length})</span>
          </p>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-600 text-sm">Loading…</div>
        ) : players.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-sm">No members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {players.map((player) => (
                <PlayerRow key={player.id} player={player} onDelete={deletePlayer} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  onDelete,
}: {
  player: ReturnType<typeof usePlayers>['players'][number];
  onDelete: (id: string) => Promise<string | null>;
}) {
  const [deleting, setDeleting] = useState(false);
  const color = player.player_class ? CLASS_COLORS[player.player_class] : '#9ca3af';

  async function handleDelete() {
    if (!confirm(`Remove ${player.name} from roster?`)) return;
    setDeleting(true);
    await onDelete(player.id);
    setDeleting(false);
  }

  return (
    <tr className="hover:bg-gray-800/20 transition-colors">
      <td className="px-4 py-2.5 font-medium text-white">{player.name}</td>
      <td className="px-4 py-2.5">
        {player.player_class ? (
          <span className="text-sm font-medium" style={{ color }}>{player.player_class}</span>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-gray-400 text-sm">{player.rank || '—'}</td>
      <td className="px-4 py-2.5 text-right">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {deleting ? '…' : 'Remove'}
        </button>
      </td>
    </tr>
  );
}
