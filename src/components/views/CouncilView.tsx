import { useState } from 'react';
import { useLootHistory } from '../../hooks/useLootHistory';
import { useCouncilNotes } from '../../hooks/useCouncilNotes';
import { useWishlist } from '../../hooks/useWishlist';
import { WishlistPanel } from '../council/WishlistPanel';
import { NotesPanel } from '../council/NotesPanel';
import { LootPlanner } from '../council/LootPlanner';
import { RosterPanel } from '../council/RosterPanel';
import { AttendancePanel } from '../council/AttendancePanel';
import { PriorityPanel } from '../council/PriorityPanel';
import { PageHeader } from '../ui/PageHeader';
import { SubTabs } from '../ui/SubTabs';
import { PageSpinner } from '../ui/Spinner';

type SubTab = 'planner' | 'roster' | 'distribution' | 'notes' | 'attendance' | 'priority';

const tabs = [
  { id: 'planner'      as SubTab, label: 'Loot Planner' },
  { id: 'roster'       as SubTab, label: 'Roster'       },
  { id: 'distribution' as SubTab, label: 'Distribution' },
  { id: 'notes'        as SubTab, label: 'Notes'        },
  { id: 'attendance'   as SubTab, label: 'Attendance'   },
  { id: 'priority'     as SubTab, label: 'Priority'     },
];

export function CouncilView() {
  const { entries } = useLootHistory();
  const { wishes }  = useWishlist(null);
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useCouncilNotes();
  const [subTab, setSubTab] = useState<SubTab>('planner');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Council"
        subtitle="Pre-raid loot planning and priority tracking"
        actions={
          <span className="text-xs font-medium text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10 border border-[var(--color-lw-gold-500)]/30 px-2.5 py-1 rounded-full">
            Council Only
          </span>
        }
      />

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      {subTab === 'planner'      && <LootPlanner historyEntries={entries} wishes={wishes} />}
      {subTab === 'roster'       && <RosterPanel historyEntries={entries} />}
      {subTab === 'distribution' && <WishlistPanel entries={entries} />}
      {subTab === 'notes'        && (
        notesLoading ? <PageSpinner /> : <NotesPanel notes={notes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />
      )}
      {subTab === 'attendance'   && <AttendancePanel />}
      {subTab === 'priority'     && <PriorityPanel />}
    </div>
  );
}
