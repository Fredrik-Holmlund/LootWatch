import { useState } from 'react';

interface SetPasswordFormProps {
  onSetPassword: (password: string) => Promise<{ message: string } | null>;
}

export function SetPasswordForm({ onSetPassword }: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError(null);
    const err = await onSetPassword(password);
    if (err) { setError(err.message); setLoading(false); }
    else setDone(true);
  }

  return (
    <div className="min-h-screen bg-[var(--color-lw-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-4xl">⚔️</span>
          <h1 className="text-xl font-bold text-[var(--color-lw-gold-300)] tracking-tight">LootWatch</h1>
          <p className="text-sm text-[var(--color-lw-text-muted)]">Set a new password</p>
        </div>

        {done ? (
          <div className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg p-6 text-center space-y-2">
            <p className="text-sm text-green-400 font-medium">Password updated!</p>
            <p className="text-xs text-[var(--color-lw-text-muted)]">You're now signed in. The app will load shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-lg p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-lw-text-muted)]">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-lw-gold-400)]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-lw-text-muted)]">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-lw-gold-400)]/50"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[var(--color-lw-purple-500)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-lw-purple-400)] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Saving…' : 'Set password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
