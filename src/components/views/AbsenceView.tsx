import { useState } from 'react';
import { useAbsence } from '../../hooks/useAbsence';
import { canEdit } from '../../types';
import type { Profile, UserRole } from '../../types';

interface AbsenceViewProps {
  profile: Profile | null;
  role: UserRole | null;
  userId: string;
}

function formatDateRange(from: string, to: string) {
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  if (from === to) return f.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  if (f.getFullYear() === t.getFullYear()) {
    return `${f.toLocaleDateString('en-GB', opts)} – ${t.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
  }
  return `${f.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })} – ${t.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function AbsenceView({ profile, role, userId }: AbsenceViewProps) {
  const { absences, loading, error, addAbsence, deleteAbsence } = useAbsence();

  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isCouncil = canEdit(role) || role === 'admin';
  const playerName = profile?.username ?? '';

  const myAbsences = absences.filter((a) => a.user_id === userId);
  const upcomingAll = absences.filter((a) => a.to_date >= today);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName || !fromDate || !toDate) return;
    if (toDate < fromDate) { setSaveError('End date must be on or after start date.'); return; }
    setSaving(true);
    setSaveError(null);
    const err = await addAbsence(playerName, userId, fromDate, toDate, note);
    if (err) setSaveError(err);
    else { setNote(''); setFromDate(today); setToDate(today); }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Absence</h2>
        <p className="text-sm text-gray-500 mt-0.5">Report upcoming absences so the council can plan ahead.</p>
      </div>

      {/* Report form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Report Absence</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">From</label>
              <input
                type="date"
                value={fromDate}
                min={today}
                onChange={(e) => { setFromDate(e.target.value); if (e.target.value > toDate) setToDate(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="text-xs text-gray-500">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Holiday, work trip…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !playerName}
              className="px-4 py-1.5 bg-yellow-500 text-gray-950 text-sm font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors"
            >
              {saving ? '…' : 'Report'}
            </button>
          </div>
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          {!playerName && <p className="text-xs text-gray-600">Set a username in your profile to report absence.</p>}
        </form>
      </div>

      {/* My absences */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">My Reports</h3>
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : myAbsences.length === 0 ? (
          <p className="text-sm text-gray-600">No absence reports yet.</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {myAbsences.map((a) => {
              const days = daysUntil(a.from_date);
              const isPast = a.to_date < today;
              return (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isPast ? 'text-gray-600' : 'text-gray-200'}`}>
                      {formatDateRange(a.from_date, a.to_date)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {!isPast && days <= 7 && (
                        <span className="text-xs text-amber-400">
                          {days === 0 ? 'Starting today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                        </span>
                      )}
                      {isPast && <span className="text-xs text-gray-700">Past</span>}
                      {a.note && <span className="text-xs text-gray-500 truncate">{a.note}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAbsence(a.id)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Council overview */}
      {isCouncil && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">All Upcoming Absences</h3>
            <span className="text-xs text-gray-600 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
              {upcomingAll.length}
            </span>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : upcomingAll.length === 0 ? (
            <p className="text-sm text-gray-600">No upcoming absences reported.</p>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {upcomingAll.map((a) => {
                const days = daysUntil(a.from_date);
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-200 w-28 flex-shrink-0 truncate">{a.player_name}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-400">{formatDateRange(a.from_date, a.to_date)}</p>
                        {a.note && <p className="text-xs text-gray-600 truncate">{a.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {days <= 7 && (
                        <span className="text-xs text-amber-400">
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                        </span>
                      )}
                      <button
                        onClick={() => deleteAbsence(a.id)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
