import { useState } from 'react';
import type { UserRole } from '../../types';
import { useLootHistory } from '../../hooks/useLootHistory';
import { CSVImport } from '../history/CSVImport';
import { AddLootEntry } from '../history/AddLootEntry';
import { LootTable } from '../history/LootTable';
import { PlayerSummary } from '../history/PlayerSummary';
import { WarningsPanel } from '../history/WarningsPanel';

interface HistoryViewProps {
  role: UserRole | null;
}

type SubTab = 'table' | 'players' | 'warnings';
type Panel = 'none' | 'import' | 'add';

export function HistoryView({ role }: HistoryViewProps) {
  const { entries, loading, error, importEntries, deleteEntry, bulkDeleteEntries, updateNote, updateRaid } = useLootHistory();
  const [subTab, setSubTab] = useState<SubTab>('table');
  const [panel, setPanel] = useState<Panel>('none');

  function togglePanel(p: Panel) {
    setPanel((cur) => (cur === p ? 'none' : p));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Loot History</h2>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} entries recorded</p>
        </div>
        {role === 'council' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePanel('add')}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                panel === 'add'
                  ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {panel === 'add' ? 'Cancel' : '+ Add Entry'}
            </button>
            <button
              onClick={() => togglePanel('import')}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                panel === 'import'
                  ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {panel === 'import' ? 'Hide Import' : '+ Import CSV'}
            </button>
          </div>
        )}
      </div>

      {panel === 'add' && role === 'council' && (
        <AddLootEntry
          onAdd={importEntries}
          onClose={() => setPanel('none')}
        />
      )}

      {panel === 'import' && role === 'council' && (
        <CSVImport existingEntries={entries} onImport={importEntries} />
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([
          ['table', 'Loot Table'],
          ['players', 'Player Summary'],
          ['warnings', '⚠️ Warnings'],
        ] as [SubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === id
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-600">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      ) : (
        <>
          {subTab === 'table' && (
            <LootTable
              entries={entries}
              role={role}
              onDelete={deleteEntry}
              onBulkDelete={bulkDeleteEntries}
              onUpdateNote={updateNote}
              onUpdateRaid={updateRaid}
            />
          )}
          {subTab === 'players' && <PlayerSummary entries={entries} />}
          {subTab === 'warnings' && <WarningsPanel entries={entries} />}
        </>
      )}
    </div>
  );
}
