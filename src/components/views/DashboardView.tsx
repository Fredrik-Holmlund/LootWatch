import { useMemo } from 'react';
import { useLootHistory } from '../../hooks/useLootHistory';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';

const RESPONSE_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'bis',       label: 'BIS',          color: '#22c55e' },
  { key: 'upgrade',   label: 'Upgrade',       color: '#3b82f6' },
  { key: 'minor',     label: 'Minor Upgrade', color: '#60a5fa' },
  { key: 'offspec',   label: 'Offspec',       color: '#a78bfa' },
  { key: 'transmog',  label: 'Transmog',      color: '#f472b6' },
  { key: 'pvp',       label: 'PvP',           color: '#fb923c' },
  { key: 'greed',     label: 'Greed',         color: '#94a3b8' },
  { key: 'other',     label: 'Other',         color: '#64748b' },
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

export function DashboardView() {
  const { entries, loading } = useLootHistory();

  const stats = useMemo(() => {
    if (!entries.length) return null;

    const uniquePlayers = new Set(entries.map((e) => stripRealm(e.player_name).toLowerCase())).size;
    const uniqueItems = new Set(entries.map((e) => e.item_name.toLowerCase())).size;
    const uniqueRaids = new Set(entries.map((e) => e.raid).filter(Boolean)).size;

    // Response breakdown
    const responseCounts: Record<string, number> = {};
    for (const e of entries) {
      const cat = categoriseResponse(e.response);
      responseCounts[cat] = (responseCounts[cat] ?? 0) + 1;
    }

    // Top recipients
    const playerCounts: Record<string, { count: number; class: string | null }> = {};
    for (const e of entries) {
      const name = stripRealm(e.player_name);
      if (!playerCounts[name]) playerCounts[name] = { count: 0, class: e.player_class };
      playerCounts[name].count++;
    }
    const topPlayers = Object.entries(playerCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    // Items by raid
    const raidCounts: Record<string, number> = {};
    for (const e of entries) {
      if (!e.raid) continue;
      raidCounts[e.raid] = (raidCounts[e.raid] ?? 0) + 1;
    }
    const raidRows = Object.entries(raidCounts).sort((a, b) => b[1] - a[1]);

    // Items per week (last 12 weeks)
    const now = new Date();
    const weekBuckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weekBuckets[weekLabel(d)] = 0;
    }
    for (const e of entries) {
      const d = new Date(e.timestamp);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays > 83) continue; // outside 12 weeks
      const label = weekLabel(d);
      weekBuckets[label] = (weekBuckets[label] ?? 0) + 1;
    }
    const weekData = Object.entries(weekBuckets);

    return { uniquePlayers, uniqueItems, uniqueRaids, responseCounts, topPlayers, raidRows, weekData };
  }, [entries]);

  const recent = entries.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-600 text-sm">
        <span className="animate-spin mr-2">⏳</span> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Guild loot distribution overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Items Distributed', value: entries.length },
          { label: 'Unique Recipients', value: stats?.uniquePlayers ?? 0 },
          { label: 'Unique Items', value: stats?.uniqueItems ?? 0 },
          { label: 'Raids Tracked', value: stats?.uniqueRaids ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-400">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Response Breakdown</h3>
          {stats && entries.length > 0 ? (
            <div className="space-y-2">
              {RESPONSE_CONFIG.map(({ key, label, color }) => {
                const count = stats.responseCounts[key] ?? 0;
                if (!count) return null;
                const pct = Math.round((count / entries.length) * 100);
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span style={{ color }} className="font-medium">{label}</span>
                      <span className="text-gray-500">{count} <span className="text-gray-700">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600">No data</p>
          )}
        </div>

        {/* Items by raid */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Items by Raid</h3>
          {stats && stats.raidRows.length > 0 ? (
            <div className="space-y-2">
              {stats.raidRows.map(([raid, count]) => {
                const max = stats.raidRows[0][1];
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={raid} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 truncate max-w-[200px]">{raid}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-500/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600">No data</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top recipients */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Top Recipients</h3>
          {stats && stats.topPlayers.length > 0 ? (
            <div className="space-y-1.5">
              {stats.topPlayers.map(([name, { count, class: cls }], i) => {
                const max = stats.topPlayers[0][1].count;
                const pct = Math.round((count / max) * 100);
                const color = getClassColor(cls);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-700 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span style={{ color }} className="font-medium">{name}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600">No data</p>
          )}
        </div>

        {/* Activity last 12 weeks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Weekly Activity <span className="text-gray-600 font-normal">(last 12 weeks)</span></h3>
          {stats && stats.weekData.some(([, v]) => v > 0) ? (
            <div className="flex items-end gap-1 h-24">
              {stats.weekData.map(([label, count]) => {
                const max = Math.max(...stats.weekData.map(([, v]) => v), 1);
                const heightPct = Math.round((count / max) * 100);
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <span className="text-[9px] text-gray-700 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {count}
                    </span>
                    <div className="w-full bg-gray-800 rounded-sm relative" style={{ height: '72px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-yellow-500/50 rounded-sm transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-700 hidden sm:block">{label.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600">No data in the last 12 weeks</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Recent Activity</h3>
        {recent.length > 0 ? (
          <div className="divide-y divide-gray-800/60">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2 text-xs">
                <span className="text-gray-600 w-20 flex-shrink-0">
                  {new Date(e.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
                <span style={{ color: getClassColor(e.player_class) }} className="font-medium w-28 flex-shrink-0 truncate">
                  {stripRealm(e.player_name)}
                </span>
                <span className="text-gray-300 flex-1 truncate">{e.item_name}</span>
                <span className="text-gray-600 hidden sm:block truncate max-w-[120px]">{e.raid}</span>
                <ResponseDot response={e.response} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function ResponseDot({ response }: { response: string }) {
  const cat = categoriseResponse(response);
  const conf = RESPONSE_CONFIG.find((c) => c.key === cat) ?? RESPONSE_CONFIG[RESPONSE_CONFIG.length - 1];
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: conf.color, backgroundColor: `${conf.color}18` }}>
      {response || '—'}
    </span>
  );
}

function weekLabel(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD of Monday-ish
}
