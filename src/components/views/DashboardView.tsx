import { useMemo } from 'react';
import { useLootHistory } from '../../hooks/useLootHistory';
import { useAttendance } from '../../hooks/useAttendance';
import { useWishlist } from '../../hooks/useWishlist';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';

const RESPONSE_CONFIG: { key: string; label: string; color: string }[] = [
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

function weekLabel(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: 'gold' | 'purple' | 'blue';
}

function StatCard({ label, value, accent = 'gold' }: StatCardProps) {
  const accentColor = {
    gold:   'var(--color-lw-gold-400)',
    purple: 'var(--color-lw-purple-400)',
    blue:   '#60a5fa',
  }[accent];

  return (
    <div
      className="lw-card p-4 border-l-2"
      style={{ borderLeftColor: accentColor }}
    >
      <p className="text-2xl font-bold tabular-nums" style={{ color: accentColor }}>{value}</p>
      <p className="text-xs text-[var(--color-lw-text-muted)] mt-1 leading-tight">{label}</p>
    </div>
  );
}

interface RankRowProps {
  rank: number;
  name: string;
  right: string;
  pct: number;
  color: string;
}

function RankRow({ rank, name, right, pct, color }: RankRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-lw-text-muted)] w-4 text-right tabular-nums shrink-0">{rank}</span>
      <div className="flex-1 relative h-7 bg-[var(--color-lw-border)] rounded overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2.5">
          <span className="text-xs font-semibold text-white drop-shadow truncate">{name}</span>
          <span className="text-xs font-medium text-white/70 tabular-nums ml-2 shrink-0">{right}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const { entries, loading } = useLootHistory();
  const { sessions, attendance } = useAttendance();
  const { wishes } = useWishlist(null);

  const stats = useMemo(() => {
    if (!entries.length) return null;
    const uniquePlayers = new Set(entries.map((e) => stripRealm(e.player_name).toLowerCase())).size;
    const uniqueItems   = new Set(entries.map((e) => e.item_name.toLowerCase())).size;
    const uniqueRaids   = new Set(entries.map((e) => e.raid).filter(Boolean)).size;

    const responseCounts: Record<string, number> = {};
    for (const e of entries) {
      const cat = categoriseResponse(e.response);
      responseCounts[cat] = (responseCounts[cat] ?? 0) + 1;
    }

    const playerCounts: Record<string, { count: number; class: string | null }> = {};
    for (const e of entries) {
      const name = stripRealm(e.player_name);
      if (!playerCounts[name]) playerCounts[name] = { count: 0, class: e.player_class };
      playerCounts[name].count++;
    }
    const topPlayers = Object.entries(playerCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    const now = new Date();
    const weekBuckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weekBuckets[weekLabel(d)] = 0;
    }
    for (const e of entries) {
      const d = new Date(e.timestamp);
      if (Math.floor((now.getTime() - d.getTime()) / 86400000) > 83) continue;
      const lbl = weekLabel(d);
      weekBuckets[lbl] = (weekBuckets[lbl] ?? 0) + 1;
    }
    const weekData = Object.entries(weekBuckets);

    return { uniquePlayers, uniqueItems, uniqueRaids, responseCounts, topPlayers, weekData };
  }, [entries]);

  const attStats = useMemo(() => {
    const total = sessions.length;
    if (total === 0) return null;

    const attended: Record<string, number> = {};
    const benched:  Record<string, number> = {};
    for (const m of Object.values(attendance)) {
      for (const [name, status] of Object.entries(m)) {
        if (status === 'attended') attended[name] = (attended[name] ?? 0) + 1;
        else if (status === 'bench') benched[name] = (benched[name] ?? 0) + 1;
      }
    }

    const allNames = [...new Set([...Object.keys(attended), ...Object.keys(benched)])];
    const rows = allNames.map((name) => {
      const a = attended[name] ?? 0;
      const b = benched[name]  ?? 0;
      const present = a + b;
      const absent  = total - present;
      return { name, present, benched: b, absent, pct: Math.round((present / total) * 100), benchPct: Math.round((b / total) * 100) };
    });

    const avgPct       = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;
    const topAttendance = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 10);
    const topAbsent    = [...rows].sort((a, b) => b.absent - a.absent).slice(0, 10);
    const topBenched   = [...rows].filter(r => r.benched > 0).sort((a, b) => b.benched - a.benched).slice(0, 10);

    return { topAttendance, topAbsent, topBenched, avgPct, total };
  }, [sessions, attendance]);

  const wishStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of wishes) counts[w.item_name] = (counts[w.item_name] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [wishes]);

  const recent = entries.slice(0, 8);

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      <PageHeader
        title="Dashboard"
        subtitle="Guild loot distribution overview"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Items Distributed"  value={entries.length}              accent="gold"   />
        <StatCard label="Unique Recipients"  value={stats?.uniquePlayers ?? 0}   accent="gold"   />
        <StatCard label="Unique Items"       value={stats?.uniqueItems ?? 0}     accent="gold"   />
        <StatCard label="Raids Tracked"      value={stats?.uniqueRaids ?? 0}     accent="gold"   />
        <StatCard label="Sessions Tracked"   value={sessions.length}             accent="purple" />
        <StatCard label="Avg Attendance"     value={attStats ? `${attStats.avgPct}%` : '—'} accent="purple" />
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            Weekly Activity
            <span className="text-[var(--color-lw-text-muted)] font-normal ml-1.5">(last 12 weeks)</span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          {stats && stats.weekData.some(([, v]) => v > 0) ? (
            <div className="flex items-end gap-1.5 h-28">
              {stats.weekData.map(([label, count]) => {
                const max = Math.max(...stats.weekData.map(([, v]) => v), 1);
                const heightPct = Math.round((count / max) * 100);
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <span className="text-[9px] text-[var(--color-lw-text-muted)] opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div className="w-full rounded-sm relative" style={{ height: '88px', background: 'var(--color-lw-border)' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-sm transition-all"
                        style={{ height: `${heightPct}%`, background: `linear-gradient(to top, var(--color-lw-purple-500), var(--color-lw-purple-400))`, opacity: 0.8 }}
                      />
                    </div>
                    <span className="text-[8px] text-[var(--color-lw-text-muted)] hidden sm:block">{label.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-lw-text-muted)]">No data in the last 12 weeks</p>
          )}
        </CardBody>
      </Card>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Recipients */}
        <Card>
          <CardHeader><CardTitle>Top Recipients</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            {stats?.topPlayers.length ? stats.topPlayers.map(([name, { count, class: cls }], i) => (
              <RankRow
                key={name}
                rank={i + 1}
                name={name}
                right={String(count)}
                pct={Math.round((count / stats.topPlayers[0][1].count) * 100)}
                color={getClassColor(cls)}
              />
            )) : <p className="text-xs text-[var(--color-lw-text-muted)]">No data</p>}
          </CardBody>
        </Card>

        {/* Most Wished Items */}
        <Card>
          <CardHeader>
            <CardTitle>
              Most Wished Items
              <span className="text-[var(--color-lw-text-muted)] font-normal ml-1.5">({wishes.length} total)</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {wishStats.length ? wishStats.map(([name, count], i) => (
              <RankRow
                key={name}
                rank={i + 1}
                name={name}
                right={`♥ ${count}`}
                pct={Math.round((count / wishStats[0][1]) * 100)}
                color="var(--color-lw-purple-400)"
              />
            )) : <p className="text-xs text-[var(--color-lw-text-muted)]">No wishes yet</p>}
          </CardBody>
        </Card>

        {/* Top Attendance */}
        <Card>
          <CardHeader><CardTitle>Top Attendance</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            {attStats?.topAttendance.length ? attStats.topAttendance.map(({ name, pct, present }, i) => {
              const color = pct >= 75 ? '#4ade80' : pct >= 50 ? '#facc15' : pct >= 25 ? '#fb923c' : '#f87171';
              return (
                <RankRow
                  key={name}
                  rank={i + 1}
                  name={name}
                  right={`${present}/${attStats.total}`}
                  pct={pct}
                  color={color}
                />
              );
            }) : <p className="text-xs text-[var(--color-lw-text-muted)]">No attendance data yet</p>}
          </CardBody>
        </Card>

        {/* Most Benched */}
        <Card>
          <CardHeader><CardTitle>Most Benched</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            {attStats?.topBenched.length ? attStats.topBenched.map(({ name, benched, benchPct }, i) => (
              <RankRow
                key={name}
                rank={i + 1}
                name={name}
                right={`${benched}/${attStats.total}`}
                pct={benchPct}
                color="#fb923c"
              />
            )) : <p className="text-xs text-[var(--color-lw-text-muted)]">No bench data yet</p>}
          </CardBody>
        </Card>

        {/* Most Absent */}
        <Card>
          <CardHeader><CardTitle>Most Absent</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            {attStats?.topAbsent.filter(r => r.absent > 0).length ? attStats.topAbsent.filter(r => r.absent > 0).map(({ name, absent, pct }, i) => {
              const absentPct = 100 - pct;
              const color = absentPct >= 75 ? '#f87171' : absentPct >= 50 ? '#fb923c' : absentPct >= 25 ? '#facc15' : '#94a3b8';
              return (
                <RankRow
                  key={name}
                  rank={i + 1}
                  name={name}
                  right={`${absent}/${attStats.total} missed`}
                  pct={absentPct}
                  color={color}
                />
              );
            }) : <p className="text-xs text-[var(--color-lw-text-muted)]">No absence data yet</p>}
          </CardBody>
        </Card>

      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        {recent.length > 0 ? (
          <div className="divide-y divide-[var(--color-lw-border-sub)]">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-[var(--color-lw-surface)]/40 transition-colors">
                <span className="text-[var(--color-lw-text-muted)] w-20 shrink-0">
                  {new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
                <span style={{ color: getClassColor(e.player_class) }} className="font-medium w-28 shrink-0 truncate">
                  {stripRealm(e.player_name)}
                </span>
                <span className="text-[var(--color-lw-text)] flex-1 truncate">{e.item_name}</span>
                <span className="text-[var(--color-lw-text-muted)] hidden sm:block truncate max-w-[120px]">{e.raid}</span>
                <ResponsePill response={e.response} />
              </div>
            ))}
          </div>
        ) : (
          <CardBody>
            <p className="text-xs text-[var(--color-lw-text-muted)]">No recent activity</p>
          </CardBody>
        )}
      </Card>

    </div>
  );
}

function ResponsePill({ response }: { response: string }) {
  const cat  = categoriseResponse(response);
  const conf = RESPONSE_CONFIG.find((c) => c.key === cat) ?? RESPONSE_CONFIG[RESPONSE_CONFIG.length - 1];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ color: conf.color, backgroundColor: `${conf.color}18` }}
    >
      {response || '—'}
    </span>
  );
}
