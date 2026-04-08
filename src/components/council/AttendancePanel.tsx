import { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';

export function AttendancePanel() {
  const {
    sessions, attendance, loading,
    syncing, syncError, wclReports,
    syncFromWCL, importSession, deleteSession,
  } = useAttendance();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [minPlayers, setMinPlayers] = useState(15);
  const importedCodes = new Set(sessions.map((s) => s.report_code).filter(Boolean));
  const filteredReports = wclReports.filter((r) => r.players.length >= minPlayers);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-600 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Sync bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {sessions.length} raid sessions saved
          </p>
        </div>
        <button
          onClick={syncFromWCL}
          disabled={syncing}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors disabled:opacity-40"
        >
          <span>{syncing ? '⟳ Syncing…' : '⟳ Sync from WarcraftLogs'}</span>
        </button>
      </div>

      {syncError && (
        <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {syncError}
        </div>
      )}

      {/* WCL Reports (fetched, not yet saved) */}
      {wclReports.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              WarcraftLogs Reports — click to import
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
              <span className="text-xs text-gray-600">
                {filteredReports.length}/{wclReports.length} shown
              </span>
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
                <div
                  key={report.code}
                  className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/60 last:border-0 hover:bg-gray-800/20"
                >
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
                    <AttendancePill count={players.length} />
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
  );
}

function AttendancePill({ count }: { count: number }) {
  return (
    <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-1.5 py-0.5">
      {count} attended
    </span>
  );
}

export function AttendanceImportButton({ onImport }: { onImport: () => void }) {
  return (
    <button onClick={onImport} className="text-xs px-3 py-1 bg-yellow-500 text-gray-950 font-semibold rounded-lg">
      Import
    </button>
  );
}
