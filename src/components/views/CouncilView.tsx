import { useState } from 'react';
import { useLootHistory } from '../../hooks/useLootHistory';
import { useCouncilNotes } from '../../hooks/useCouncilNotes';
import { WishlistPanel } from '../council/WishlistPanel';
import { NotesPanel } from '../council/NotesPanel';
import { LootPlanner } from '../council/LootPlanner';
import { RosterPanel } from '../council/RosterPanel';

type SubTab = 'planner' | 'roster' | 'distribution' | 'notes';

export function CouncilView() {
  const { entries } = useLootHistory();
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useCouncilNotes();
  const [subTab, setSubTab] = useState<SubTab>('planner');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Council</h2>
          <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
            Council Only
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Pre-raid loot planning and priority tracking</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([
          ['planner', '🗺️ Loot Planner'],
          ['roster', '👥 Roster'],
          ['distribution', '📊 Distribution'],
          ['notes', '📝 Priority Notes'],
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

      {/* Content */}
      {subTab === 'planner' && <LootPlanner historyEntries={entries} />}
      {subTab === 'roster' && <RosterPanel historyEntries={entries} />}
      {subTab === 'distribution' && <WishlistPanel entries={entries} />}
      {subTab === 'notes' && (
        notesLoading ? (
          <div className="text-center py-10 text-gray-600 text-sm">Loading…</div>
        ) : (
          <NotesPanel
            notes={notes}
            onAdd={addNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        )
      )}
    </div>
  );
}
