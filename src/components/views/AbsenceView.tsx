import { useState, useRef } from 'react';
import { useAbsence } from '../../hooks/useAbsence';
import { canEdit } from '../../types';
import type { Profile, UserRole } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { PageSpinner } from '../ui/Spinner';

interface AbsenceViewProps {
  profile: Profile | null;
  role: UserRole | null;
  userId: string;
}

const RAID_DAYS = [0, 3]; // Sunday = 0, Wednesday = 3

function toLocalDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function getRaidDaysBetween(from: string, to: string): string[] {
  const result: string[] = [];
  const current = new Date(from + 'T00:00:00');
  const end     = new Date(to   + 'T00:00:00');
  while (current <= end) {
    if (RAID_DAYS.includes(current.getDay())) result.push(toLocalDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDateRange(from: string, to: string) {
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to   + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  if (from === to) return f.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  if (f.getFullYear() === t.getFullYear())
    return `${f.toLocaleDateString('en-GB', opts)} – ${t.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
  return `${f.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })} – ${t.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
}

function formatSubmitted(createdAt: string) {
  const d       = new Date(createdAt);
  const diffMins  = Math.floor((Date.now() - d.getTime()) / 60000);
  const diffHours = Math.floor(diffMins  / 60);
  const diffDays  = Math.floor(diffHours / 24);
  if (diffMins  < 1)  return 'just now';
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function absenceCountColor(count: number): { bg: string; text: string; border: string } {
  if (count >= 5) return { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/40'    };
  if (count >= 3) return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' };
  if (count >= 1) return { bg: 'bg-[var(--color-lw-gold-400)]/15', text: 'text-[var(--color-lw-gold-300)]', border: 'border-[var(--color-lw-gold-400)]/40' };
  return           { bg: '',                        text: '',                border: ''                     };
}

function cardAccentClass(count: number): string {
  if (count >= 5) return 'border-l-red-500/80';
  if (count >= 3) return 'border-l-orange-500/70';
  return 'border-l-[var(--color-lw-gold-400)]/60';
}

function missingBadgeClass(count: number): string {
  if (count >= 5) return 'text-red-400 bg-red-950/60 border-red-900/40';
  if (count >= 3) return 'text-orange-400 bg-orange-950/60 border-orange-900/40';
  return 'text-[var(--color-lw-gold-300)] bg-[var(--color-lw-base)] border-[var(--color-lw-border)]';
}

// ─── Calendar helpers ──────────────────────────────────────────────────────

/** Monday of the week containing `d` */
function getMondayOf(d: Date): Date {
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

/** Build a 6-week grid starting from this Monday, returning Date objects */
function buildCalendarGrid(startMonday: Date): Date[][] {
  const weeks: Date[][] = [];
  const cur = new Date(startMonday);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Main component ────────────────────────────────────────────────────────

export function AbsenceView({ profile, role, userId }: AbsenceViewProps) {
  const { absences, loading, error, addAbsence, deleteAbsence } = useAbsence();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const today    = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(today);
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isCouncil  = canEdit(role) || role === 'admin';
  const playerName = profile?.username ?? '';

  const myAbsences = absences.filter((a) => a.user_id === userId);
  const upcomingAll = absences.filter((a) => a.to_date >= today);

  // Build raid-grouped absence map
  const raidMissing: Record<string, { player_name: string; note: string | null; absence_id: string; created_at: string }[]> = {};
  for (const a of upcomingAll) {
    const effectiveFrom = a.from_date < today ? today : a.from_date;
    for (const raidDate of getRaidDaysBetween(effectiveFrom, a.to_date)) {
      if (!raidMissing[raidDate]) raidMissing[raidDate] = [];
      raidMissing[raidDate].push({ player_name: a.player_name, note: a.note, absence_id: a.id, created_at: a.created_at });
    }
  }
  const sortedRaidDays = Object.keys(raidMissing).sort();

  // Calendar grid — 6 weeks from current Monday
  const startMonday  = getMondayOf(new Date());
  const calendarGrid = buildCalendarGrid(startMonday);

  // Month label(s) shown in calendar header
  const firstDay = calendarGrid[0][0];
  const lastDay  = calendarGrid[5][6];
  const monthLabel = firstDay.getMonth() === lastDay.getMonth()
    ? firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : `${firstDay.toLocaleDateString('en-GB', { month: 'short' })} – ${lastDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName || !fromDate || !toDate) return;
    if (toDate < fromDate) { setSaveError('End date must be on or after start date.'); return; }
    setSaving(true); setSaveError(null);
    const err = await addAbsence(playerName, userId, fromDate, toDate, note);
    if (err) setSaveError(err);
    else { setNote(''); setFromDate(today); setToDate(today); }
    setSaving(false);
  }

  function scrollToRaid(dateStr: string) {
    cardRefs.current[dateStr]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      <PageHeader
        title="Absence"
        subtitle="Report upcoming absences so the council can plan ahead."
      />

      {/* Report form */}
      <Card>
        <CardHeader><CardTitle>Report Absence</CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              {[
                { label: 'From', value: fromDate, min: today,    onChange: (v: string) => { setFromDate(v); if (v > toDate) setToDate(v); } },
                { label: 'To',   value: toDate,   min: fromDate, onChange: (v: string) => setToDate(v) },
              ].map(({ label, value, min, onChange }) => (
                <div key={label} className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--color-lw-text-sub)]">{label}</label>
                  <input
                    type="date"
                    value={value}
                    min={min}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-lw-text)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors"
                  />
                </div>
              ))}
              <div className="space-y-1.5 flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-[var(--color-lw-text-sub)]">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Holiday, work trip…"
                  className="w-full bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-lw-text)] placeholder:text-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !playerName}
                className="px-4 py-2 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors"
              >
                {saving ? '…' : 'Report'}
              </button>
            </div>
            {saveError  && <p className="text-xs text-red-400">{saveError}</p>}
            {!playerName && <p className="text-xs text-[var(--color-lw-text-muted)]">Set a username in your profile to report absence.</p>}
          </form>
        </CardBody>
      </Card>

      {/* My absences */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-lw-text)]">My Reports</h3>
        {loading ? <PageSpinner /> : myAbsences.length === 0 ? (
          <p className="text-sm text-[var(--color-lw-text-muted)]">No absence reports yet.</p>
        ) : (
          <Card>
            <div className="divide-y divide-[var(--color-lw-border-sub)]">
              {myAbsences.map((a) => {
                const days  = daysUntil(a.from_date);
                const isPast = a.to_date < today;
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isPast ? 'text-[var(--color-lw-text-muted)]' : 'text-[var(--color-lw-text)]'}`}>
                        {formatDateRange(a.from_date, a.to_date)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {!isPast && days <= 7 && (
                          <span className="text-xs text-amber-400">
                            {days === 0 ? 'Starting today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                          </span>
                        )}
                        {isPast && <span className="text-xs text-[var(--color-lw-text-muted)]">Past</span>}
                        {a.note && <span className="text-xs text-[var(--color-lw-text-muted)] truncate">{a.note}</span>}
                      </div>
                    </div>
                    {confirmDelete === a.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[var(--color-lw-text-muted)]">Sure?</span>
                        <button onClick={() => { deleteAbsence(a.id); setConfirmDelete(null); }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Yes</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] transition-colors">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(a.id)} className="text-xs text-[var(--color-lw-text-muted)] hover:text-red-400 transition-colors shrink-0">
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Council: calendar + raid cards */}
      {isCouncil && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-lw-text)]">Raid Calendar</h3>
            <span className="text-xs text-[var(--color-lw-text-muted)] bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-full px-2 py-0.5">
              Wed &amp; Sun
            </span>
          </div>

          {/* ── Calendar grid ── */}
          {!loading && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{monthLabel}</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-lw-text-muted)]">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--color-lw-gold-400)]/70 inline-block" />1–2</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500/70 inline-block" />3–4</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" />5+</span>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-3">
                {/* Day headers — week-nr col + 7 day cols */}
                <div className="grid grid-cols-[2rem_repeat(7,1fr)] mb-1">
                  <div className="text-center text-[10px] font-semibold text-[var(--color-lw-text-muted)] py-1 opacity-50">W</div>
                  {DAY_HEADERS.map((h) => (
                    <div key={h} className="text-center text-xs font-semibold text-[var(--color-lw-text-muted)] py-1">
                      {h}
                    </div>
                  ))}
                </div>

                {/* Week rows */}
                <div className="space-y-1">
                  {calendarGrid.map((week, wi) => {
                    // ISO week number for the Monday of this week
                    const monday = week[0];
                    const jan4   = new Date(monday.getFullYear(), 0, 4);
                    const weekNum = Math.ceil(((monday.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 6) / 7);

                    return (
                    <div key={wi} className="grid grid-cols-[2rem_repeat(7,1fr)] gap-1 items-center">
                      {/* Week number */}
                      <div className="text-center text-[10px] text-[var(--color-lw-text-muted)] opacity-50 select-none font-medium">
                        {weekNum}
                      </div>

                      {week.map((day) => {
                        const dateStr   = toLocalDateStr(day);
                        const isToday   = dateStr === today;
                        const isPast    = dateStr < today;
                        const isRaidDay = RAID_DAYS.includes(day.getDay());
                        const count     = raidMissing[dateStr]?.length ?? 0;
                        const colors    = absenceCountColor(count);
                        const dayNum    = day.getDate();
                        const showMonth = dayNum === 1;

                        if (!isRaidDay) {
                          return (
                            <div
                              key={dateStr}
                              className={`rounded-md p-1 text-center min-h-[44px] flex flex-col items-center justify-center ${isPast ? 'opacity-25' : 'opacity-50'}`}
                            >
                              {showMonth && <span className="text-[9px] text-[var(--color-lw-text-muted)] uppercase leading-none">{day.toLocaleDateString('en-GB', { month: 'short' })}</span>}
                              <span className="text-xs text-[var(--color-lw-text-muted)]">{dayNum}</span>
                            </div>
                          );
                        }

                        // Raid day
                        return (
                          <button
                            key={dateStr}
                            onClick={() => count > 0 && scrollToRaid(dateStr)}
                            className={[
                              'rounded-md p-1 text-center min-h-[44px] flex flex-col items-center justify-center gap-0.5 border transition-all',
                              isPast ? 'opacity-40' : '',
                              count > 0 ? `${colors.bg} ${colors.border} cursor-pointer hover:opacity-90` : 'border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/60',
                              isToday ? 'ring-2 ring-[var(--color-lw-purple-400)]/60 ring-offset-1 ring-offset-[var(--color-lw-elevated)]' : '',
                            ].join(' ')}
                          >
                            {showMonth && <span className="text-[9px] text-[var(--color-lw-text-muted)] uppercase leading-none">{day.toLocaleDateString('en-GB', { month: 'short' })}</span>}
                            <span className={`text-xs font-semibold leading-none ${isToday ? 'text-[var(--color-lw-purple-400)]' : count > 0 ? colors.text : 'text-[var(--color-lw-text-sub)]'}`}>
                              {dayNum}
                            </span>
                            <span className={`text-[10px] font-bold leading-none ${count > 0 ? colors.text : 'text-[var(--color-lw-text-muted)]'}`}>
                              {count > 0 ? `${count} missing` : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Raid absence cards */}
          {loading ? <PageSpinner /> : sortedRaidDays.length === 0 ? (
            <p className="text-sm text-[var(--color-lw-text-muted)]">No absences reported for upcoming raids.</p>
          ) : (
            <div className="space-y-3">
              {sortedRaidDays.map((raidDate) => {
                const missing   = raidMissing[raidDate];
                const daysAway  = daysUntil(raidDate);
                const d         = new Date(raidDate + 'T00:00:00');
                const dayName   = d.toLocaleDateString('en-GB', { weekday: 'long' });
                const dateFmt   = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const isCritical = missing.length >= 5;

                return (
                  <div
                    key={raidDate}
                    ref={(el) => { cardRefs.current[raidDate] = el; }}
                    className={`bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] border-l-4 ${cardAccentClass(missing.length)} rounded-lg overflow-hidden`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-lw-surface)]/50 border-b border-[var(--color-lw-border-sub)]">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--color-lw-text)]">{dayName}</span>
                        <span className="text-sm text-[var(--color-lw-text-muted)]">{dateFmt}</span>
                        {daysAway >= 0 && daysAway <= 7 && (
                          <span className="text-xs text-amber-400">
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${missingBadgeClass(missing.length)}`}>
                        {missing.length} missing
                      </span>
                    </div>

                    {isCritical && (
                      <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                        <span className="text-red-400 text-xs">⚠</span>
                        <span className="text-xs text-red-400 font-medium">Critical — {missing.length} players missing</span>
                      </div>
                    )}

                    <div className="divide-y divide-[var(--color-lw-border-sub)]">
                      {missing.map((m, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm text-[var(--color-lw-text)] font-medium">{m.player_name}</span>
                            <p className="text-xs text-[var(--color-lw-text-muted)]">Submitted {formatSubmitted(m.created_at)}</p>
                          </div>
                          {m.note && <span className="text-xs text-[var(--color-lw-text-muted)] flex-1 truncate">{m.note}</span>}
                          {confirmDelete === m.absence_id ? (
                            <div className="flex items-center gap-2 shrink-0 ml-auto">
                              <span className="text-xs text-[var(--color-lw-text-muted)]">Sure?</span>
                              <button onClick={() => { deleteAbsence(m.absence_id); setConfirmDelete(null); }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Yes</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] transition-colors">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(m.absence_id)} className="text-xs text-[var(--color-lw-text-muted)] hover:text-red-400 transition-colors shrink-0 ml-auto">
                              Delete
                            </button>
                          )}
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
