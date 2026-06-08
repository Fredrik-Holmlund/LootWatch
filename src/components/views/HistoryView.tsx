import { useState } from 'react';
import type { UserRole } from '../../types';
import { canEdit } from '../../types';
import { useLootHistory } from '../../hooks/useLootHistory';
import { CSVImport } from '../history/CSVImport';
import { AddLootEntry } from '../history/AddLootEntry';
import { LootTable } from '../history/LootTable';
import { PlayerSummary } from '../history/PlayerSummary';
import { WarningsPanel } from '../history/WarningsPanel';
import { PageHeader } from '../ui/PageHeader';
import { SubTabs } from '../ui/SubTabs';
import { Button } from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';

interface HistoryViewProps {
  role: UserRole | null;
}

type SubTab = 'table' | 'players' | 'warnings';
type Panel  = 'none'  | 'import' | 'add';

export function HistoryView({ role }: HistoryViewProps) {
  const { entries, loading, error, importEntries, deleteEntry, bulkDeleteEntries, updateNote, updateRaid, updateBoss, updateResponse } = useLootHistory();
  const [subTab, setSubTab] = useState<SubTab>('table');
  const [panel,  setPanel]  = useState<Panel>('none');

  function togglePanel(p: Panel) {
    setPanel((cur) => (cur === p ? 'none' : p));
  }

  const tabs = [
    { id: 'table'    as SubTab, label: 'Loot Table' },
    { id: 'players'  as SubTab, label: 'Player Summary' },
    { id: 'warnings' as SubTab, label: '⚠ Warnings' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 pt-5 pb-8 space-y-6">

      <PageHeader
        title="Loot History"
        subtitle={`${entries.length} entries recorded`}
        actions={canEdit(role) ? (
          <>
            <Button
              variant={panel === 'add' ? 'active' : 'default'}
              onClick={() => togglePanel('add')}
            >
              {panel === 'add' ? 'Cancel' : '+ Add Entry'}
            </Button>
            <Button
              variant={panel === 'import' ? 'active' : 'default'}
              onClick={() => togglePanel('import')}
            >
              {panel === 'import' ? 'Hide Import' : '+ Import CSV'}
            </Button>
          </>
        ) : undefined}
      />

      {panel === 'add'    && canEdit(role) && <AddLootEntry onAdd={importEntries} onClose={() => setPanel('none')} />}
      {panel === 'import' && canEdit(role) && <CSVImport existingEntries={entries} onImport={importEntries} />}

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      {error && (
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? <PageSpinner /> : (
        <>
          {subTab === 'table'    && <LootTable entries={entries} role={role} onDelete={deleteEntry} onBulkDelete={bulkDeleteEntries} onUpdateNote={updateNote} onUpdateRaid={updateRaid} onUpdateBoss={updateBoss} onUpdateResponse={updateResponse} />}
          {subTab === 'players'  && <PlayerSummary entries={entries} />}
          {subTab === 'warnings' && <WarningsPanel entries={entries} />}
        </>
      )}
    </div>
  );
}
