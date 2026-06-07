import React, { useState } from 'react';
import type { CouncilNote, Priority } from '../../types';

interface NotesPanelProps {
  notes: CouncilNote[];
  onAdd: (note: { player_name: string; item_name: string; priority: Priority; notes?: string }) => Promise<string | null>;
  onUpdate: (id: string, updates: Partial<CouncilNote>) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  high:   'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-[var(--color-lw-gold-300)] bg-yellow-400/10 border-[var(--color-lw-gold-300)]/20',
  low:    'text-green-400 bg-green-400/10 border-green-400/20',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '🔴 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

export function NotesPanel({ notes, onAdd, onUpdate, onDelete }: NotesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ player_name: '', item_name: '', priority: 'medium' as Priority, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.player_name.trim() || !form.item_name.trim()) return;
    setSubmitting(true);
    const err = await onAdd({
      player_name: form.player_name.trim(),
      item_name: form.item_name.trim(),
      priority: form.priority,
      notes: form.notes.trim() || undefined,
    });
    if (err) setError(err);
    else {
      setForm({ player_name: '', item_name: '', priority: 'medium', notes: '' });
      setShowForm(false);
      setError(null);
    }
    setSubmitting(false);
  }

  const filtered = filterPriority ? notes.filter((n) => n.priority === filterPriority) : notes;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--color-lw-text-sub)]">Loot Priority Notes</h3>
          <span className="text-xs text-[var(--color-lw-text-muted)]">({notes.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
            className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-lw-text-sub)] focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => setShowForm((s) => !s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showForm
                ? 'border-[var(--color-lw-gold-400)]/50 text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10'
                : 'border-[var(--color-lw-border)] text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)]'
            }`}
          >
            {showForm ? 'Cancel' : '+ Add Note'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-lw-text-muted)] mb-1">Player Name</label>
              <input
                value={form.player_name}
                onChange={(e) => setForm((f) => ({ ...f, player_name: e.target.value }))}
                placeholder="CharacterName"
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-gold-400)]/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-lw-text-muted)] mb-1">Item Name</label>
              <input
                value={form.item_name}
                onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
                placeholder="Item name…"
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-gold-400)]/50"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-lw-text-muted)] mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text-sub)] focus:outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-lw-text-muted)] mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-gold-400)]/50"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="text-xs px-4 py-1.5 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Add Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-lw-text-muted)] text-sm">
            No loot priority notes yet.
          </div>
        ) : (
          filtered.map((note) => (
            <div
              key={note.id}
              className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg p-4 flex items-start gap-3 group hover:border-[var(--color-lw-border)] transition-colors"
            >
              <span className={`text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap mt-0.5 ${PRIORITY_STYLES[note.priority]}`}>
                {PRIORITY_LABELS[note.priority]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{note.player_name}</span>
                  <span className="text-[var(--color-lw-text-muted)] text-xs">→</span>
                  <span className="text-[var(--color-lw-text-sub)] text-sm">{note.item_name}</span>
                </div>
                {editingId === note.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onUpdate(note.id, { notes: editNotes }); setEditingId(null); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-[var(--color-lw-elevated)] border border-[var(--color-lw-gold-400)]/50 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
                    />
                    <button onClick={() => { onUpdate(note.id, { notes: editNotes }); setEditingId(null); }} className="text-green-400 text-xs">✓</button>
                    <button onClick={() => setEditingId(null)} className="text-[var(--color-lw-text-muted)] text-xs">✕</button>
                  </div>
                ) : note.notes ? (
                  <p
                    className="text-xs text-[var(--color-lw-text-muted)] mt-1 cursor-pointer hover:text-[var(--color-lw-text-muted)]"
                    onClick={() => { setEditingId(note.id); setEditNotes(note.notes ?? ''); }}
                  >
                    {note.notes}
                  </p>
                ) : (
                  <p
                    className="text-xs text-[var(--color-lw-text-muted)] mt-1 italic cursor-pointer hover:text-[var(--color-lw-text-muted)]"
                    onClick={() => { setEditingId(note.id); setEditNotes(''); }}
                  >
                    add notes…
                  </p>
                )}
              </div>
              <button
                onClick={() => onDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs transition-all mt-0.5"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
