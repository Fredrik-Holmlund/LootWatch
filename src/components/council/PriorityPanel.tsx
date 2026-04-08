import { usePriorityScore } from '../../hooks/usePriorityScore';
import type { PlayerPriority } from '../../hooks/usePriorityScore';

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 w-7 text-right">{value}</span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#facc15';
  if (score >= 25) return '#fb923c';
  return '#f87171';
}

function DroughtLabel({ days }: { days: number }) {
  if (days >= 999) return <span className="text-xs text-gray-500">Never received</span>;
  if (days === 0) return <span className="text-xs text-gray-500">Today</span>;
  return <span className="text-xs text-gray-500">{days}d ago</span>;
}

export function PriorityPanel() {
  const { priorities, weights, loading, refresh } = usePriorityScore();

  if (loading) {
    return <div className="text-center py-10 text-gray-600 text-sm">Computing priority scores…</div>;
  }

  if (priorities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        No data yet. Import loot history and attendance sessions first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weights summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
          <span>Weights:</span>
          <span className="text-blue-400">Attendance {weights.attendance}%</span>
          <span className="text-purple-400">Drought {weights.drought}%</span>
          <span className="text-yellow-400">Loot {weights.loot}%</span>
        </div>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
        <p className="text-xs text-gray-700">Adjust weights in Admin → Settings.</p>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_minmax(120px,1fr)_80px_1fr_1fr_1fr] gap-3 px-4 py-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>#</span>
          <span>Player</span>
          <span className="text-center">Score</span>
          <span>Attendance</span>
          <span>Drought</span>
          <span>Recent Loot</span>
        </div>

        {priorities.map((p: PlayerPriority, i) => (
          <div
            key={p.name}
            className="grid grid-cols-[2rem_minmax(120px,1fr)_80px_1fr_1fr_1fr] gap-3 items-center px-4 py-2.5 border-b border-gray-800/60 last:border-0 hover:bg-gray-800/20 transition-colors"
          >
            {/* Rank */}
            <span className="text-xs text-gray-600 font-mono">{i + 1}</span>

            {/* Name */}
            <span className="text-sm font-medium text-gray-200 truncate">{p.name}</span>

            {/* Total score badge */}
            <div className="flex justify-center">
              <span
                className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
                style={{
                  color: scoreColor(p.score),
                  backgroundColor: `${scoreColor(p.score)}18`,
                  border: `1px solid ${scoreColor(p.score)}40`,
                }}
              >
                {p.score}
              </span>
            </div>

            {/* Attendance */}
            <div className="space-y-0.5">
              <ScoreBar value={p.attendanceScore} color="#60a5fa" />
              <p className="text-xs text-gray-600">{p.attendancePct}% attendance</p>
            </div>

            {/* Drought */}
            <div className="space-y-0.5">
              <ScoreBar value={p.droughtScore} color="#a78bfa" />
              <DroughtLabel days={p.droughtDays} />
            </div>

            {/* Recent loot */}
            <div className="space-y-0.5">
              <ScoreBar value={p.lootScore} color="#fbbf24" />
              <p className="text-xs text-gray-600">
                {p.recentBisCount === 0 ? 'No recent items' : `${p.recentBisCount} item${p.recentBisCount > 1 ? 's' : ''} (6 wks)`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-700">
        Drought capped at 30 days. Only BIS/Upgrade responses count for loot score. Bench counts as attendance.
      </p>
    </div>
  );
}
