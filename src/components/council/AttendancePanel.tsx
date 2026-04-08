import { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';

type SubTab = 'import' | 'edit';

function abbrev(instance: string) {
  const words = instance.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4);
  return words.slice(0, 2).map((w) => w.slice(0, 3)).join('');
}

function shortDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AttendancePanel() {
  const {
    sessions, attendance, loading,
    syncing, syncError, wclReports,
    syncFromWCL, importSession, deleteSession,
    deletePlayer, createSession, toggleAttendance,
  } = useAttendance();

  const [subTab, setSubTab] = useState<SubTab>('import');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [minPlayers, setMinPlayers] = useState(15);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAll() { setSelected(new Set(sessions.map((s) => s.id))); }
  function clearSelect() { setSelected(new Set()); }
  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} session(s) and all their attendance?`)) return;
    for (const id of selected) await deleteSession(id);
    setSelected(new Set());
  }

  function toggleSelectPlayer(name: string) {
    setSelectedPlayers((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  function selectAllPlayers() { setSelectedPlayers(new Set(sortedPlayers)); }
  function clearSelectPlayers() { setSelectedPlayers(new Set()); }
  async function deleteSelectedPlayers() {
    if (!confirm(`Remove ${selectedPlayers.size} player(s) from all sessions?`)) return;
    for (const name of selectedPlayers) await deletePlayer(name);
    setSelectedPlayers(new Set());
  }

  // Manual session creation
  const [newInstance, setNewInstance] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  // Add player to grid
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingToSession, setAddingToSession] = useState<string | null>(null);

  const importedCodes = new Set(sessions.map((s) => s.report_code).filter(Boolean));
  const filteredReports = wclReports.filter((r) => r.players.length >= minPlayers);

  const allPlayers = [...new Set(Object.values(attendance).flatMap((m) => Object.keys(m)))];

  const [sortBy, setSortBy] = useState<'name' | 'pct'>('name');

  const total = sessions.length;
  const attPct = (name: string) => {
    if (total === 0) return 0;
    return Math.round(
      (Object.values(attendance).filter((m) => m[name] === 'attended' || m[name] === 'bench').length / total) * 100
    );
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  const sortedPlayers = [...allPlayers].sort((a, b) =>
    sortBy === 'pct'
      ? attPct(b) - attPct(a)
      : a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  async function handleCreateSession() {
    if (!newInstance.trim() || !newDate) return;
    setCreating(true);
    await createSession(newInstance.trim(), newDate);
    setNewInstance('');
    setCreating(false);
  }

  async function handleAddPlayer(sessionId: string) {
    const name = newPlayerName.trim();
    if (!name) return;
    await toggleAttendance(sessionId, name);
    setNewPlayerName('');
    setAddingToSession(null);
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-600 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['import', 'edit'] as SubTab[]).map((id) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === id
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {id === 'import' ? '⟳ Import' : '✎ Edit Grid'}
          </button>
        ))}
      </div>

      {/* ── IMPORT TAB ── */}
      {subTab === 'import' && (
        <div className="space-y-5">

          {/* WCL Sync */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{sessions.length} raid sessions saved</p>
            <button
              onClick={syncFromWCL}
              disabled={syncing}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors disabled:opacity-40"
            >
              {syncing ? '⟳ Syncing…' : '⟳ Sync from WarcraftLogs'}
            </button>
          </div>

          {syncError && (
            <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {syncError}
            </div>
          )}

          {/* Manual session creation */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Raid Manually</h3>
            <div className="flex gap-2">
              <input
                value={newInstance}
                onChange={(e) => setNewInstance(e.target.value)}
                placeholder="Instance name (e.g. Gruul's Lair)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
              <button
                onClick={handleCreateSession}
                disabled={creating || !newInstance.trim()}
                className="px-4 py-1.5 bg-yellow-500 text-gray-950 text-sm font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-40"
              >
                {creating ? '…' : 'Add'}
              </button>
            </div>
          </div>

          {/* WCL report list */}
          {wclReports.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WarcraftLogs Reports</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Min. players</label>
                  <input
                    type="number"
                    min={1}
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-yellow-500/50 text-center"
                  />
                  <span className="text-xs text-gray-600">{filteredReports.length}/{wclReports.length} shown</span>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {filteredReports.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-600">No reports with {minPlayers}+ players.</div>
                ) : filteredReports.map((report) => {
                  const alreadyImported = importedCodes.has(report.code);
                  return (
                    <div key={report.code} className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/60 last:border-0 hover:bg-gray-800/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{report.title || report.instance}</p>
                        <p className="text-xs text-gray-600">{formatDate(report.date)} · {report.instance} · {report.players.length} players</p>
                      </div>
                      {alreadyImported ? (
                        <span className="text-xs text-green-500 flex-shrink-0">✓ Imported</span>
                      ) : (
                        <button
                          onClick={() => importSession(report)}
                          className="text-xs px-3 py-1 bg-yellow-500 text-gray-950 font-semibold rounded-lg flex-shrink-0 hover:bg-yellow-400 transition-colors"
                        >
                          Import
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved sessions */}
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              No sessions yet. Add one manually or sync from WarcraftLogs.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Sessions</h3>
                <div className="flex items-center gap-2">
                  {selected.size > 0 ? (
                    <>
                      <span className="text-xs text-gray-500">{selected.size} selected</span>
                      <button onClick={clearSelect} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
                      <button
                        onClick={deleteSelected}
                        className="text-xs px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        Delete selected
                      </button>
                    </>
                  ) : (
                    <button onClick={selectAll} className="text-xs text-gray-500 hover:text-gray-300">Select all</button>
                  )}
                </div>
              </div>
              {sessions.map((session) => {
                const sessionMap = attendance[session.id] ?? {};
                const players = Object.keys(sessionMap);
                const attendedCount = Object.values(sessionMap).filter((s) => s === 'attended').length;
                const isExpanded = expanded === session.id;
                const isSelected = selected.has(session.id);
                return (
                  <div key={session.id} className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-red-500/40' : 'border-gray-800'}`}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(session.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-red-500 cursor-pointer flex-shrink-0"
                      />
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200">{session.instance_name}</p>
                          <p className="text-xs text-gray-600">{formatDate(session.session_date)} · {players.length} players</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-1.5 py-0.5">
                            {attendedCount} attended
                          </span>
                          <span className="text-gray-700 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-800/60 space-y-3 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(sessionMap).sort(([a], [b]) => a.localeCompare(b)).map(([name, status]) => (
                            <span key={name} className={`text-xs px-2 py-0.5 rounded-full ${status === 'bench' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-gray-800 text-gray-400'}`}>
                              {name}{status === 'bench' ? ' (bench)' : ''}
                            </span>
                          ))}
                        </div>
                        {/* Add attendee inline */}
                        {addingToSession === session.id ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={newPlayerName}
                              onChange={(e) => setNewPlayerName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlayer(session.id); if (e.key === 'Escape') { setAddingToSession(null); setNewPlayerName(''); } }}
                              placeholder="Player name…"
                              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                            />
                            <button onClick={() => handleAddPlayer(session.id)} className="text-xs px-3 py-1 bg-yellow-500 text-gray-950 font-semibold rounded hover:bg-yellow-400">Add</button>
                            <button onClick={() => { setAddingToSession(null); setNewPlayerName(''); }} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-300">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingToSession(session.id); }}
                            className="text-xs text-yellow-500 hover:text-yellow-400"
                          >
                            + Add attendee
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EDIT GRID TAB ── */}
      {subTab === 'edit' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">No sessions yet. Add some in the Import tab.</div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-600">Click once = <span className="text-green-500">attended</span>, twice = <span className="text-orange-400">bench</span>, three times = clear.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Sort:</span>
                  {(['name', 'pct'] as const).map((s) => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${sortBy === s ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
                      {s === 'name' ? 'Name' : 'Att.%'}
                    </button>
                  ))}
                  <span className="text-gray-700">|</span>
                  {selectedPlayers.size > 0 ? (
                    <>
                      <span className="text-xs text-gray-500">{selectedPlayers.size} selected</span>
                      <button onClick={clearSelectPlayers} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
                      <button
                        onClick={deleteSelectedPlayers}
                        className="text-xs px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        Delete selected
                      </button>
                    </>
                  ) : (
                    <button onClick={selectAllPlayers} className="text-xs text-gray-500 hover:text-gray-300">Select all</button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="sticky left-0 z-10 bg-gray-900 px-2 py-2 border-r border-gray-800 w-8">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.size === allPlayers.length && allPlayers.length > 0}
                          onChange={(e) => e.target.checked ? selectAllPlayers() : clearSelectPlayers()}
                          className="accent-red-500 cursor-pointer"
                        />
                      </th>
                      <th className="sticky left-0 z-10 bg-gray-900 text-left px-3 py-2 text-gray-500 font-semibold min-w-[140px] border-r border-gray-800">
                        Name
                      </th>
                      <th className="px-2 py-2 text-gray-500 font-semibold text-center min-w-[48px] border-r border-gray-800">
                        Att.%
                      </th>
                      {sortedSessions.map((s) => (
                        <th
                          key={s.id}
                          className="px-1 py-2 text-gray-500 font-semibold text-center min-w-[44px] border-r border-gray-800 last:border-0"
                          title={`${s.instance_name} — ${formatDate(s.session_date)}`}
                        >
                          <div className="leading-tight">
                            <div>{abbrev(s.instance_name)}</div>
                            <div className="text-gray-600 font-normal">{shortDate(s.session_date)}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((name) => {
                      const pct = attPct(name);
                      const isPlayerSelected = selectedPlayers.has(name);
                      return (
                        <tr key={name} className={`border-t border-gray-800/60 group ${isPlayerSelected ? 'bg-red-950/20' : 'hover:bg-gray-800/10'}`}>
                          <td className={`sticky left-0 z-10 px-2 py-1 border-r border-gray-800 ${isPlayerSelected ? 'bg-red-950/40' : 'bg-gray-950 group-hover:bg-gray-900'}`}>
                            <input
                              type="checkbox"
                              checked={isPlayerSelected}
                              onChange={() => toggleSelectPlayer(name)}
                              className="accent-red-500 cursor-pointer"
                            />
                          </td>
                          <td className={`sticky left-0 z-10 px-3 py-1 border-r border-gray-800 whitespace-nowrap ${isPlayerSelected ? 'bg-red-950/40' : 'bg-gray-950 group-hover:bg-gray-900'}`}>
                            <span className="text-gray-300 font-medium">{name}</span>
                          </td>
                          <td
                            className="px-2 py-1 text-center border-r border-gray-800 font-semibold"
                            style={{ color: pct >= 75 ? '#4ade80' : pct >= 50 ? '#facc15' : pct >= 25 ? '#fb923c' : '#f87171' }}
                          >
                            {pct}%
                          </td>
                          {sortedSessions.map((s) => {
                            const status = attendance[s.id]?.[name];
                            const bg = status === 'attended' ? '#16a34a' : status === 'bench' ? '#c2410c' : '#111';
                            const border = status === 'attended' ? '#15803d' : status === 'bench' ? '#9a3412' : '#222';
                            const titleText = status === 'attended' ? 'Click for bench' : status === 'bench' ? 'Click to clear' : 'Click for attended';
                            return (
                              <td
                                key={s.id}
                                onClick={() => toggleAttendance(s.id, name)}
                                className="border-r border-gray-800/40 last:border-0 cursor-pointer"
                                title={titleText}
                              >
                                <div
                                  className="mx-auto my-1 rounded-sm transition-colors"
                                  style={{ width: 28, height: 18, backgroundColor: bg, border: `1px solid ${border}` }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Add new player row */}
                    <tr className="border-t border-gray-800/60">
                      <td colSpan={3 + sortedSessions.length} className="px-3 py-2 sticky left-0">
                        {addingToSession === '__new__' ? (
                          <div className="flex gap-2 items-center">
                            <input
                              autoFocus
                              value={newPlayerName}
                              onChange={(e) => setNewPlayerName(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && newPlayerName.trim()) {
                                  // Add player to first session so they appear in grid
                                  if (sortedSessions.length > 0) await toggleAttendance(sortedSessions[0].id, newPlayerName.trim());
                                  setNewPlayerName('');
                                  setAddingToSession(null);
                                }
                                if (e.key === 'Escape') { setAddingToSession(null); setNewPlayerName(''); }
                              }}
                              placeholder="Player name…"
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-500/50 w-48"
                            />
                            <span className="text-xs text-gray-600">Will be marked as attended for the most recent session. Adjust in the grid.</span>
                            <button onClick={() => { setAddingToSession(null); setNewPlayerName(''); }} className="text-xs text-gray-500 hover:text-gray-300 ml-auto">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingToSession('__new__')}
                            className="text-xs text-yellow-500 hover:text-yellow-400"
                          >
                            + Add player
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
