import { usePriorityScore } from '../../hooks/usePriorityScore';
import type { PlayerPriority } from '../../hooks/usePriorityScore';

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-5 bg-[var(--color-lw-border)] rounded overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color, opacity: 0.85 }} />
      <div className="absolute inset-0 px-1.5 flex items-center pointer-events-none" style={{ clipPath: `inset(0 ${100 - value}% 0 0 round 4px)` }}>
        <span className="text-[10px] font-semibold" style={{ color: 'rgba(0,0,0,0.75)' }}>{value}%</span>
      </div>
      <div className="absolute inset-0 px-1.5 flex items-center pointer-events-none" style={{ clipPath: `inset(0 0 0 ${value}% round 4px)` }}>
        <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}%</span>
      </div>
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
  if (days >= 999) return <span className="text-xs text-[var(--color-lw-text-muted)]">Never received</span>;
  if (days === 0) return <span className="text-xs text-[var(--color-lw-text-muted)]">Today</span>;
  return <span className="text-xs text-[var(--color-lw-text-muted)]">{days}d ago</span>;
}

export function PriorityPanel() {
  const { priorities, weights, attWindow, loading, refresh } = usePriorityScore();
  const totalRaids = priorities[0]?.allTimeTotal ?? 0;

  if (loading) {
    return <div className="text-center py-10 text-[var(--color-lw-text-muted)] text-sm">Computing priority scores…</div>;
  }

  if (priorities.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-lw-text-muted)] text-sm">
        No data yet. Import loot history and attendance sessions first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weights summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-[var(--color-lw-text-muted)] bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg px-4 py-2">
          <span>Weights:</span>
          <span className="text-[#60a5fa]">Rolling att. {weights.attendance}%</span>
          <span className="text-green-400">Streak {weights.streak}%</span>
          <span className="text-[#a78bfa]">Drought {weights.drought}%</span>
          <span className="text-[var(--color-lw-gold-300)]">Loot {weights.loot}%</span>
          <span className="text-[var(--color-lw-text-muted)]">· Window: last {attWindow} raids</span>
        </div>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1.5 bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
        <p className="text-xs text-[var(--color-lw-text-muted)]">Adjust weights in Admin → Settings.</p>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_minmax(120px,1fr)_80px_1fr_1fr_1fr_1fr] gap-3 px-4 py-2 border-b border-[var(--color-lw-border)] text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">
          <span>#</span>
          <span>Player</span>
          <span className="text-center">Score</span>
          <span>Rolling Att.</span>
          <span>Streak</span>
          <span>Drought</span>
          <span>Recent Loot</span>
        </div>

        {priorities.map((p: PlayerPriority, i) => (
          <div
            key={p.name}
            className="grid grid-cols-[2rem_minmax(120px,1fr)_80px_1fr_1fr_1fr_1fr] gap-3 items-center px-4 py-2.5 border-b border-[var(--color-lw-border)]/60 last:border-0 hover:bg-[var(--color-lw-elevated)]/20 transition-colors"
          >
            {/* Rank */}
            <span className="text-xs text-[var(--color-lw-text-muted)] font-mono">{i + 1}</span>

            {/* Name */}
            <span className="text-sm font-medium text-[var(--color-lw-text)] truncate">{p.name}</span>

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

            {/* Rolling attendance */}
            <div className="space-y-0.5">
              <ScoreBar value={p.attendanceScore} color="#60a5fa" />
              <p className="text-xs text-[var(--color-lw-text-muted)]">
                {p.rollingAttended}/{p.rollingTotal} last {attWindow} · {p.allTimeAttended}/{p.allTimeTotal} all-time
              </p>
            </div>

            {/* Streak */}
            <div className="space-y-0.5">
              <ScoreBar value={p.streakScore} color="#4ade80" />
              <p className="text-xs text-[var(--color-lw-text-muted)]">
                Best: {p.bestStreak} · Now: {p.currentStreak}
              </p>
            </div>

            {/* Drought */}
            <div className="space-y-0.5">
              <ScoreBar value={p.droughtScore} color="#a78bfa" />
              <DroughtLabel days={p.droughtDays} />
            </div>

            {/* Recent loot */}
            <div className="space-y-0.5">
              <ScoreBar value={p.lootScore} color="#fbbf24" />
              <p className="text-xs text-[var(--color-lw-text-muted)]">
                {p.recentBisCount === 0 ? 'No recent items' : `${p.recentBisCount} item${p.recentBisCount > 1 ? 's' : ''} (6 wks)`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--color-lw-text-muted)]">
        Rolling att. = last {attWindow} raids. Streak scored vs. total raids ({totalRaids}) — a {totalRaids}-raid streak = 100%. Streak counts from first appearance; bench = present.
      </p>
    </div>
  );
}
