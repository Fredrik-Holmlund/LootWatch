import { useState } from 'react';
import { useAbsence } from '../../hooks/useAbsence';
import { canEdit } from '../../types';
import type { Profile, UserRole } from '../../types';

interface AbsenceViewProps {
  profile: Profile | null;
  role: UserRole | null;
  userId: string;
}

const RAID_DAYS = [0, 3]; // Sunday = 0, Wednesday = 3

function getRaidDaysBetween(from: string, to: string): string[] {
  const result: string[] = [];
  const current = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (current <= end) {
    if (RAID_DAYS.includes(current.getDay())) {
      result.push(current.toISOString().slice(0, 10));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function formatRaidDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return { day, date };
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

function missingColor(count: number) {
  if (count >= 5) return 'text-red-400 bg-red-400/10 border-red-400/20';
  if (count >= 3) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
  return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
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

  // Build raid-grouped absence map
  const raidMissing: Record<string, { player_name: string; note: string | null; absence_id: string }[]> = {};
  for (const a of upcomingAll) {
    const effectiveFrom = a.from_date < today ? today : a.from_date;
    for (const raidDate of getRaidDaysBetween(effectiveFrom, a.to_date)) {
      if (!raidMissing[raidDate]) raidMissing[raidDate] = [];
      raidMissing[raidDate].push({ player_name: a.player_name, note: a.note, absence_id: a.id });
    }
  }
  const sortedRaidDays = Object.keys(raidMissing).sort();

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

      {/* Council: grouped by raid */}
      {isCouncil && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">Upcoming Raids</h3>
            <span className="text-xs text-gray-600 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
              Wed &amp; Sun
            </span>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : sortedRaidDays.length === 0 ? (
            <p className="text-sm text-gray-600">No absences reported for upcoming raids.</p>
          ) : (
            <div className="space-y-3">
              {sortedRaidDays.map((raidDate) => {
                const missing = raidMissing[raidDate];
                const { day, date } = formatRaidDate(raidDate);
                const daysAway = daysUntil(raidDate);
                return (
                  <div key={raidDate} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    {/* Raid header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-800/40 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-200">{day}</span>
                          <span className="text-sm text-gray-500 ml-2">{date}</span>
                        </div>
                        {daysAway <= 7 && (
                          <span className="text-xs text-amber-400">
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${missingColor(missing.length)}`}>
                        {missing.length} missing
                      </span>
                    </div>
                    {/* Missing players */}
                    <div className="divide-y divide-gray-800/60">
                      {missing.map((m, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2 gap-3">
                          <span className="text-sm text-gray-300 font-medium w-28 flex-shrink-0">{m.player_name}</span>
                          {m.note && <span className="text-xs text-gray-600 flex-1 truncate">{m.note}</span>}
                          <button
                            onClick={() => deleteAbsence(m.absence_id)}
                            className="text-xs text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
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
