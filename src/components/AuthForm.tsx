import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<unknown>;
  onSignUp: (email: string, password: string, username: string) => Promise<unknown>;
}

type Mode = 'signin' | 'signup' | 'reset';

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const err = await onSignIn(email, password) as { message?: string } | null;
      if (err) setError((err as { message: string }).message);
    } else if (mode === 'signup') {
      if (!username.trim()) {
        setError('Username is required.');
        setSubmitting(false);
        return;
      }
      const err = await onSignUp(email, password, username.trim()) as { message?: string } | null;
      if (err) {
        setError((err as { message: string }).message);
      } else {
        setInfo('Account created! Check your email to confirm, then sign in.');
        switchMode('signin');
      }
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo('Password reset link sent — check your email.');
      }
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl">⚔️</span>
            <h1 className="text-3xl font-bold text-yellow-400 tracking-tight">LootWatch</h1>
          </div>
          <p className="text-gray-500 text-sm">WoW TBC Guild Loot Tracker</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
          {mode !== 'reset' ? (
            <>
              {/* Sign in / Sign up tabs */}
              <div className="flex mb-6 bg-gray-800 rounded-lg p-1 gap-1">
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      mode === m ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {m === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="YourCharacterName"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                )}
                {info && (
                  <p className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{info}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors pt-1"
                  >
                    Forgot your password?
                  </button>
                )}
              </form>
            </>
          ) : (
            /* Reset password form */
            <>
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-white mb-1">Reset Password</h2>
                <p className="text-xs text-gray-500">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                )}
                {info && (
                  <p className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{info}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors pt-1"
                >
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
