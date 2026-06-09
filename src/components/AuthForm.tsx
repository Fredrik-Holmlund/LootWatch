import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { LootWatchLogo } from './ui/LootWatchLogo';
import { Spinner } from './ui/Spinner';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<unknown>;
  onSignUp: (email: string, password: string, username: string) => Promise<unknown>;
}

type Mode = 'signin' | 'signup' | 'reset';

const inputCls = [
  'w-full rounded-lg px-3 py-2.5 text-sm transition-colors',
  'bg-[var(--color-lw-base)] border border-[var(--color-lw-border)]',
  'text-[var(--color-lw-text)] placeholder:text-[var(--color-lw-text-muted)]',
  'focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 focus:ring-1 focus:ring-[var(--color-lw-purple-400)]/20',
].join(' ');

const labelCls = 'block text-xs font-medium text-[var(--color-lw-text-sub)] mb-1.5';

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [mode, setMode]           = useState<Mode>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [username, setUsername]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [info, setInfo]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(m: Mode) { setMode(m); setError(null); setInfo(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setSubmitting(true);

    if (mode === 'signin') {
      const err = await onSignIn(email, password) as { message?: string } | null;
      if (err) setError((err as { message: string }).message);
    } else if (mode === 'signup') {
      if (!username.trim()) { setError('Username is required.'); setSubmitting(false); return; }
      const err = await onSignUp(email, password, username.trim()) as { message?: string } | null;
      if (err) setError((err as { message: string }).message);
      else { setInfo('Account created! Check your email to confirm, then sign in.'); switchMode('signin'); }
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });
      if (error) setError(error.message);
      else setInfo('Password reset link sent — check your email.');
    }

    setSubmitting(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #0f1624 0%, var(--color-lw-base) 70%)',
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] mb-5 shadow-xl">
            <LootWatchLogo className="w-10 h-10" />
          </div>
          <h1
            className="text-2xl font-semibold text-[var(--color-lw-text)] tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LootWatch
          </h1>
          <p className="text-sm text-[var(--color-lw-text-muted)] mt-1">WoW TBC Guild Loot Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-2xl p-6 shadow-2xl">

          {mode !== 'reset' ? (
            <>
              {/* Tabs */}
              <div className="flex mb-6 bg-[var(--color-lw-surface)] rounded-lg p-1 gap-1">
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={[
                      'flex-1 py-1.5 text-sm font-medium rounded-md transition-colors',
                      mode === m
                        ? 'bg-[var(--color-lw-card)] text-[var(--color-lw-text)] shadow-sm'
                        : 'text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)]',
                    ].join(' ')}
                  >
                    {m === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className={labelCls}>Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="YourCharacterName" className={inputCls} required autoFocus />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls} required autoFocus={mode === 'signin'} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls} required minLength={6} />
                </div>

                {error && <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}
                {info  && <p className="text-green-400 text-xs bg-green-950/40 border border-green-900/40 rounded-lg px-3 py-2">{info}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {submitting ? <Spinner className="w-4 h-4 border-white/30 border-t-white" /> : null}
                  {submitting ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {mode === 'signin' && (
                  <button type="button" onClick={() => switchMode('reset')}
                    className="w-full text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] transition-colors pt-1">
                    Forgot your password?
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-[var(--color-lw-text)] mb-1">Reset Password</h2>
                <p className="text-xs text-[var(--color-lw-text-muted)]">Enter your email and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls} required autoFocus />
                </div>
                {error && <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}
                {info  && <p className="text-green-400 text-xs bg-green-950/40 border border-green-900/40 rounded-lg px-3 py-2">{info}</p>}
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {submitting ? <Spinner className="w-4 h-4 border-white/30 border-t-white" /> : null}
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => switchMode('signin')}
                  className="w-full text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] transition-colors pt-1">
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
