import { useMemo } from 'react';
import { useLootHistory } from '../../hooks/useLootHistory';
import { useAttendance } from '../../hooks/useAttendance';
import { useWishlist } from '../../hooks/useWishlist';
import { useAbsence } from '../../hooks/useAbsence';
import { useGuildNotice } from '../../hooks/useGuildNotice';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import type { Profile } from '../../types';

interface DashboardViewProps {
  profile?: Profile | null;
  username: string;
}

// Next N upcoming raid dates (Wed=3, Sun=0)
const RAID_DAYS = [0, 3];
function getNextRaidDates(count = 3): string[] {
  const dates: string[] = [];
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 90 && dates.length < count; i++) {
    if (RAID_DAYS.includes(d.getDay())) {
      dates.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
function getRaidDaysBetween(from: string, to: string): string[] {
  const result: string[] = [];
  const cur = new Date(from + 'T00:00:00');
  const end = new Date(to   + 'T00:00:00');
  while (cur <= end) {
    if (RAID_DAYS.includes(cur.getDay())) {
      result.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + 'T00:00:00').getTime() - today.getTime()) / 86400000);
}

// ── Attendance bar row ────────────────────────────────────────────────────────

function AttRow({ rank, name, rollingPct, totalPct, total, rolling, isMe, isPerfect }: {
  rank: number; name: string; rollingPct: number; totalPct: number;
  total: number; rolling: number; isMe: boolean; isPerfect: boolean;
}) {
  const color = rollingPct >= 80 ? '#4ade80' : rollingPct >= 60 ? '#facc15' : rollingPct >= 40 ? '#fb923c' : '#f87171';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isMe ? 'bg-[var(--color-lw-fel-500)]/8 ring-1 ring-[var(--color-lw-fel-500)]/25' : 'hover:bg-[var(--color-lw-base)]/40'}`}>
      <span className="text-xs w-5 text-right shrink-0">
        {isPerfect ? <span title="100% attendance">👑</span> : <span className="text-[var(--color-lw-text-muted)]">{rank}</span>}
      </span>
      <div className="flex-1 relative h-6 bg-[var(--color-lw-border)] rounded overflow-hidden min-w-0">
        <div className="absolute inset-y-0 left-0 rounded transition-all duration-500" style={{ width: `${rollingPct}%`, backgroundColor: color, opacity: 0.8 }} />
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none" style={{ clipPath: `inset(0 ${100 - rollingPct}% 0 0 round 4px)` }}>
          <span className="text-xs font-semibold truncate" style={{ color: 'rgba(0,0,0,0.75)' }}>{name}</span>
          <span className="text-xs tabular-nums ml-1 shrink-0" style={{ color: 'rgba(0,0,0,0.55)' }}>{rollingPct}%</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none" style={{ clipPath: `inset(0 0 0 ${rollingPct}% round 4px)` }}>
          <span className={`text-xs font-semibold truncate ${isMe ? 'text-[var(--color-lw-fel-400)]' : 'text-[var(--color-lw-text)]'}`}>{name}{isMe ? ' ★' : ''}</span>
          <span className="text-xs tabular-nums ml-1 shrink-0 text-[var(--color-lw-text-muted)]">{rollingPct}%</span>
        </div>
      </div>
      <span className="text-[10px] text-[var(--color-lw-text-muted)] w-12 text-right shrink-0 tabular-nums hidden sm:block">
        {rolling}/{total}
      </span>
      <span className="text-[10px] text-[var(--color-lw-text-muted)] w-10 text-right shrink-0 tabular-nums hidden md:block">
        {totalPct}%
      </span>
    </div>
  );
}

function pinnedFirst<T extends [string, { rollingPct: number; pct: number }]>(list: T[], myName: string | null): T[] {
  if (!myName) return list;
  const idx = list.findIndex(([n]) => n === myName);
  if (idx <= 0) return list;
  return [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)];
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function DashboardView({ username }: DashboardViewProps) {
  const { entries, loading: lootLoading } = useLootHistory();
  const { sessions, loading: attLoading, attendanceStats } = useAttendance();
  const { wishes } = useWishlist(null);
  const { absences } = useAbsence();
  const { notice } = useGuildNotice();

  const loading = lootLoading || attLoading;

  const today = new Date().toISOString().slice(0, 10);
  const nextRaids = useMemo(() => getNextRaidDates(3), []);

  // Absence counts per upcoming raid date
  const absentPerRaid = useMemo(() => {
    const map: Record<string, string[]> = {};
    const upcoming = absences.filter(a => a.to_date >= today);
    for (const a of upcoming) {
      const from = a.from_date < today ? today : a.from_date;
      for (const rd of getRaidDaysBetween(from, a.to_date)) {
        if (!map[rd]) map[rd] = [];
        map[rd].push(a.player_name);
      }
    }
    return map;
  }, [absences, today]);

  // Attendance stats — rolling 6 and all-time
  const stats6 = useMemo(() => attendanceStats(12), [attendanceStats]);
  const statsAll = useMemo(() => attendanceStats(9999), [attendanceStats]);

  const sortedByRolling = useMemo(() =>
    Object.entries(stats6).sort((a, b) => b[1].rollingPct - a[1].rollingPct || b[1].pct - a[1].pct),
    [stats6]
  );
  const sortedByAll = useMemo(() =>
    Object.entries(statsAll).sort((a, b) => b[1].pct - a[1].pct),
    [statsAll]
  );

  // Keep stats as the rolling one for personal stats
  const stats = stats6;

  // Find current user in attendance
  const myName = useMemo(() => {
    if (!username) return null;
    const lower = username.toLowerCase();
    return Object.keys(stats).find(n => stripRealm(n).toLowerCase() === lower) ?? null;
  }, [stats, username]);

  const myStats = myName ? stats[myName] : null;
  const myRank  = myName ? sortedByRolling.findIndex(([n]) => n === myName) + 1 : null;

  // Personal loot count (all time)
  const myLootCount = useMemo(() => {
    if (!username) return 0;
    const lower = username.toLowerCase();
    return entries.filter(e => stripRealm(e.player_name).toLowerCase() === lower).length;
  }, [entries, username]);

  // Most wished items
  const wishStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of wishes) counts[w.item_name] = (counts[w.item_name] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [wishes]);

  // Recent loot
  const recent = entries.slice(0, 10);

  if (loading) return <PageSpinner />;

  const hasAttendance = sessions.length > 0;
  const rollingWindow = Math.min(12, sessions.length);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-5 pb-8 space-y-6">

      <PageHeader title="Overview" subtitle="Guild activity and your personal stats" />

      {/* Guild notice banner */}
      {notice?.is_active && notice.message && (
        <div className="flex items-start gap-3 bg-[var(--color-lw-fel-500)]/8 border border-[var(--color-lw-fel-500)]/25 rounded-lg px-4 py-3">
          <span className="text-[var(--color-lw-fel-400)] text-base shrink-0 mt-0.5">📌</span>
          <p className="text-sm text-[var(--color-lw-text)] leading-relaxed whitespace-pre-wrap">{notice.message}</p>
        </div>
      )}

      {/* Guild-wide stat cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Items Distributed', value: entries.length,                                          color: '#c9a227' },
            { label: 'Unique Recipients',  value: new Set(entries.map(e => stripRealm(e.player_name).toLowerCase())).size, color: '#c9a227' },
            { label: 'Unique Items',       value: new Set(entries.map(e => e.item_name.toLowerCase())).size,              color: '#c9a227' },
            { label: 'Raids Tracked',      value: new Set(entries.map(e => e.raid).filter(Boolean)).size,                 color: '#c9a227' },
            { label: 'Sessions Tracked',   value: sessions.length,                                         color: 'var(--color-lw-fel-400)' },
            { label: 'Avg Attendance',     value: hasAttendance
                ? `${Math.round(Object.values(statsAll).reduce((s, r) => s + r.pct, 0) / Math.max(Object.values(statsAll).length, 1))}%`
                : '—',                                                                                      color: 'var(--color-lw-fel-400)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[var(--color-lw-elevated)] px-4 py-4">
              {/* Subtle glow blob */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ background: color }} />
              <p className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>{value}</p>
              <p className="text-xs text-[var(--color-lw-text-muted)] mt-2 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Personal stats row */}
      {hasAttendance && (
        myStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Last 6 weeks',
                value: `${myStats.rollingPct}%`,
                sub: `${myStats.rollingAttended} / ${myStats.rollingTotal} attended`,
                accent: myStats.rollingPct >= 80 ? '#4ade80' : myStats.rollingPct >= 60 ? '#facc15' : '#fb923c',
              },
              {
                label: 'All-time attendance',
                value: `${myStats.pct}%`,
                sub: `${myStats.attended + myStats.benched} / ${myStats.total} sessions`,
                accent: 'var(--color-lw-fel-400)',
              },
              {
                label: 'Attendance rank',
                value: myRank ? `#${myRank}` : '—',
                sub: `of ${sortedByRolling.length} raiders`,
                accent: myRank && myRank <= 3 ? '#facc15' : 'var(--color-lw-text-sub)',
              },
              {
                label: 'Items received',
                value: myLootCount,
                sub: 'all time',
                accent: 'var(--color-lw-gold-300)',
              },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="lw-card p-4 border-l-2 space-y-0.5" style={{ borderLeftColor: accent }}>
                <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{value}</p>
                <p className="text-xs text-[var(--color-lw-text-muted)] leading-tight">{label}</p>
                <p className="text-[10px] text-[var(--color-lw-text-muted)] opacity-60">{sub}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-4 py-3">
            <span className="text-amber-400 text-base shrink-0">⚠</span>
            <div>
              <p className="text-sm text-[var(--color-lw-text)]">Your character isn't linked to attendance data</p>
              <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">
                Your username is <span className="text-[var(--color-lw-text-sub)] font-medium">"{username}"</span> — ask an officer to make sure it matches your character name exactly.
              </p>
            </div>
          </div>
        )
      )}

      {/* Mid row: next raids + two attendance leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_1fr] gap-4">

        {/* Next raids */}
        <Card>
          <CardHeader><CardTitle>Upcoming Raids</CardTitle></CardHeader>
          <div className="divide-y divide-[var(--color-lw-border-sub)]">
            {nextRaids.map(date => {
              const d = new Date(date + 'T00:00:00');
              const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
              const dateFmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const away = daysUntil(date);
              const absentCount = absentPerRaid[date]?.length ?? 0;
              return (
                <div key={date} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-lw-text)]">{dayName}</p>
                    <p className="text-xs text-[var(--color-lw-text-muted)]">{dateFmt}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-medium ${away === 0 ? 'text-[var(--color-lw-fel-400)]' : away <= 2 ? 'text-amber-400' : 'text-[var(--color-lw-text-muted)]'}`}>
                      {away === 0 ? 'Today' : away === 1 ? 'Tomorrow' : `In ${away} days`}
                    </p>
                    {absentCount > 0 && (
                      <p className={`text-[10px] mt-0.5 ${absentCount >= 5 ? 'text-red-400' : absentCount >= 3 ? 'text-orange-400' : 'text-[var(--color-lw-text-muted)]'}`}>
                        {absentCount} absent
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {nextRaids.length === 0 && (
              <CardBody><p className="text-xs text-[var(--color-lw-text-muted)]">No upcoming raid dates</p></CardBody>
            )}
          </div>
        </Card>

        {/* Attendance — Last 6 weeks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance</CardTitle>
              <span className="text-[10px] text-[var(--color-lw-fel-400)] bg-[var(--color-lw-fel-500)]/10 border border-[var(--color-lw-fel-500)]/25 rounded-full px-2 py-0.5 font-medium">
                Last 6 weeks
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-0.5 px-2 pb-3">
            {hasAttendance ? pinnedFirst(sortedByRolling, myName).slice(0, 10).map(([name, s]) => (
              <AttRow
                key={name}
                rank={sortedByRolling.findIndex(([n]) => n === name) + 1}
                name={stripRealm(name)}
                rollingPct={s.rollingPct}
                totalPct={s.pct}
                total={s.rollingTotal}
                rolling={s.rollingAttended}
                isMe={name === myName}
                isPerfect={s.rollingPct === 100}
              />
            )) : <p className="text-xs text-[var(--color-lw-text-muted)]">No attendance data yet</p>}
          </CardBody>
        </Card>

        {/* Attendance — All time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance</CardTitle>
              <span className="text-[10px] text-[var(--color-lw-text-muted)] bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-full px-2 py-0.5 font-medium">
                All time
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-0.5 px-2 pb-3">
            {hasAttendance ? pinnedFirst(sortedByAll, myName).slice(0, 10).map(([name, s]) => (
              <AttRow
                key={name}
                rank={sortedByAll.findIndex(([n]) => n === name) + 1}
                name={stripRealm(name)}
                rollingPct={s.pct}
                totalPct={s.pct}
                total={s.total}
                rolling={s.attended + s.benched}
                isMe={name === myName}
                isPerfect={s.pct === 100}
              />
            )) : <p className="text-xs text-[var(--color-lw-text-muted)]">No attendance data yet</p>}
          </CardBody>
        </Card>
      </div>

      {/* Bottom row: most wished + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Most wished items */}
        <Card>
          <CardHeader>
            <CardTitle>
              Most Wished Items
              <span className="text-[var(--color-lw-text-muted)] font-normal text-xs ml-2">({wishes.length} total)</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 pb-4">
            {wishStats.length ? wishStats.map(([name, count], i) => {
              const pct = Math.round((count / wishStats[0][1]) * 100);
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-lw-text-muted)] w-4 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 relative h-6 bg-[var(--color-lw-border)] rounded overflow-hidden min-w-0">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--color-lw-fel-600), var(--color-lw-fel-400))', opacity: 0.75 }} />
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none" style={{ clipPath: `inset(0 ${100 - pct}% 0 0 round 4px)` }}>
                      <span className="text-xs font-semibold truncate" style={{ color: 'rgba(0,0,0,0.75)' }}>{name}</span>
                      <span className="text-xs font-medium ml-1 shrink-0" style={{ color: 'rgba(0,0,0,0.55)' }}>❤ {count}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none" style={{ clipPath: `inset(0 0 0 ${pct}% round 4px)` }}>
                      <span className="text-xs font-semibold text-[var(--color-lw-text)] truncate">{name}</span>
                      <span className="text-xs text-[var(--color-lw-text-muted)] ml-1 shrink-0">❤ {count}</span>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-xs text-[var(--color-lw-text-muted)]">No wishes yet</p>}
          </CardBody>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader><CardTitle>Recent Loot</CardTitle></CardHeader>
          {recent.length > 0 ? (
            <div className="divide-y divide-[var(--color-lw-border-sub)]">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-[var(--color-lw-base)]/40 transition-colors">
                  <span className="text-[var(--color-lw-text-muted)] w-16 shrink-0">
                    {new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  <span style={{ color: getClassColor(e.player_class) }} className="font-medium w-24 shrink-0 truncate">
                    {stripRealm(e.player_name)}
                  </span>
                  <span className="text-[var(--color-lw-text)] flex-1 truncate">{e.item_name}</span>
                  <ResponsePill response={e.response} />
                </div>
              ))}
            </div>
          ) : (
            <CardBody>
              <p className="text-xs text-[var(--color-lw-text-muted)]">No loot recorded yet</p>
            </CardBody>
          )}
        </Card>

      </div>
    </div>
  );
}

const RESPONSE_CONFIG = [
  { key: 'bis',      label: 'BIS',          color: '#4ade80' },
  { key: 'upgrade',  label: 'Upgrade',       color: '#60a5fa' },
  { key: 'minor',    label: 'Minor Upgrade', color: '#93c5fd' },
  { key: 'offspec',  label: 'Offspec',       color: '#c084fc' },
  { key: 'transmog', label: 'Transmog',      color: '#f472b6' },
  { key: 'pvp',      label: 'PvP',           color: '#fb923c' },
  { key: 'greed',    label: 'Greed',         color: '#64748b' },
  { key: 'other',    label: 'Other',         color: '#475569' },
];

function categoriseResponse(r: string): string {
  const v = r.toLowerCase();
  if (v.includes('bis') || v === 'ms' || v.includes('major')) return 'bis';
  if (v.includes('minor')) return 'minor';
  if (v.includes('upgrade')) return 'upgrade';
  if (v.includes('offspec') || v === 'os') return 'offspec';
  if (v.includes('transmog')) return 'transmog';
  if (v.includes('pvp')) return 'pvp';
  if (v.includes('greed') || v.includes('pass')) return 'greed';
  return 'other';
}

function ResponsePill({ response }: { response: string }) {
  const cat  = categoriseResponse(response);
  const conf = RESPONSE_CONFIG.find(c => c.key === cat) ?? RESPONSE_CONFIG[RESPONSE_CONFIG.length - 1];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: conf.color, backgroundColor: `${conf.color}18` }}>
      {response || '—'}
    </span>
  );
}
