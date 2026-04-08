import { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';

type SubTab = 'import' | 'edit';

function abbrev(instance: string) {
  // Short label for column header: first 3 chars of each word, max 2 words
  const words = instance.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4);
  return words.slice(0, 2).map((w) => w.slice(0, 3)).join('');
}

function shortDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

export function AttendancePanel() {
  const {
    sessions, attendance, loading,
    syncing, syncError, wclReports,
    syncFromWCL, importSession, deleteSession, toggleAttendance,
  } = useAttendance();

  const [subTab, setSubTab] = useState<SubTab>('import');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [minPlayers, setMinPlayers] = useState(15);

  const importedCodes = new Set(sessions.map((s) => s.report_code).filter(Boolean));
  const filteredReports = wclReports.filter((r) => r.players.length >= minPlayers);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // All unique players across all sessions, sorted
  const allPlayers = [...new Set(Object.values(attendance).flat())].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  // Sessions sorted newest first (already are from DB)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  // Att% per player
  const total = sessions.length;
  const attPct = (name: string) => {
    if (total === 0) return 0;
    const count = Object.values(attendance).filter((players) => players.includes(name)).length;
    return Math.round((count / total) * 100);
  };

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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
              subTab === id
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {id === 'import' ? '⟳ Import' : '✎ Edit Grid'}
          </button>
        ))}
      </div>

      {/* IMPORT TAB */}
      {subTab === 'import' && (
        <div className="space-y-5">
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

          {wclReports.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  WarcraftLogs Reports
                </h3>
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
                  <div className="px-4 py-6 text-center text-xs text-gray-600">
                    No reports with {minPlayers}+ players found.
                  </div>
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

          {/* Saved sessions list */}
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">
              No sessions yet. Click "Sync from WarcraftLogs" to fetch your guild's recent raids.
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Sessions</h3>
              {sessions.map((session) => {
                const players = attendance[session.id] ?? [];
                const isExpanded = expanded === session.id;
                return (
                  <div key={session.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/30 group"
                      onClick={() => setExpanded(isExpanded ? null : session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200">{session.instance_name}</p>
                        <p className="text-xs text-gray-600">{formatDate(session.session_date)} · {players.length} players</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-1.5 py-0.5">
                          {players.length} attended
                        </span>
                        <span className="text-gray-700 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this session?')) deleteSession(session.id); }}
                          className="text-red-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {isExpanded && players.length > 0 && (
                      <div className="px-4 pb-3 border-t border-gray-800/60">
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {[...players].sort().map((name) => (
                            <span key={name} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT GRID TAB */}
      {subTab === 'edit' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">
              No sessions yet. Import some raids first.
            </div>
          ) : allPlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">
              No attendance data yet.
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-600">Click a cell to toggle attendance.</p>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="sticky left-0 z-10 bg-gray-900 text-left px-3 py-2 text-gray-500 font-semibold min-w-[130px] border-r border-gray-800">
                        Name
                      </th>
                      <th className="px-2 py-2 text-gray-500 font-semibold text-center min-w-[48px] border-r border-gray-800">
                        Att.%
                      </th>
                      {sortedSessions.map((s) => (
                        <th
                          key={s.id}
                          className="px-1 py-2 text-gray-500 font-semibold text-center min-w-[40px] border-r border-gray-800 last:border-0"
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
                    {allPlayers.map((name) => {
                      const pct = attPct(name);
                      return (
                        <tr key={name} className="border-t border-gray-800/60 hover:bg-gray-800/10 group">
                          <td className="sticky left-0 z-10 bg-gray-950 group-hover:bg-gray-900 px-3 py-1.5 text-gray-300 font-medium border-r border-gray-800 whitespace-nowrap">
                            {name}
                          </td>
                          <td className="px-2 py-1.5 text-center border-r border-gray-800 font-semibold"
                            style={{ color: pct >= 75 ? '#4ade80' : pct >= 50 ? '#facc15' : pct >= 25 ? '#fb923c' : '#f87171' }}
                          >
                            {pct}%
                          </td>
                          {sortedSessions.map((s) => {
                            const attended = (attendance[s.id] ?? []).includes(name);
                            return (
                              <td
                                key={s.id}
                                onClick={() => toggleAttendance(s.id, name)}
                                className="border-r border-gray-800/40 last:border-0 cursor-pointer"
                                title={attended ? 'Click to remove' : 'Click to add'}
                              >
                                <div
                                  className="mx-auto my-1 rounded-sm transition-colors"
                                  style={{
                                    width: 28,
                                    height: 18,
                                    backgroundColor: attended ? '#16a34a' : '#111',
                                    border: attended ? '1px solid #15803d' : '1px solid #222',
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
