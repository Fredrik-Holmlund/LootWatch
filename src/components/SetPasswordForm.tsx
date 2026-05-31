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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-4xl">⚔️</span>
          <h1 className="text-xl font-bold text-yellow-400 tracking-tight">LootWatch</h1>
          <p className="text-sm text-gray-500">Set a new password</p>
        </div>

        {done ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-2">
            <p className="text-sm text-green-400 font-medium">Password updated!</p>
            <p className="text-xs text-gray-500">You're now signed in. The app will load shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-yellow-500 text-gray-950 text-sm font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Saving…' : 'Set password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
