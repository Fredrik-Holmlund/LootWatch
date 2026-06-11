import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { Profile, UserRole } from '../../types';

interface UserManagementProps {
  currentUserId: string;
}

const ROLES: UserRole[] = ['raider', 'planner', 'council', 'admin'];

const ROLE_STYLE: Record<UserRole, string> = {
  raider:  'text-[var(--color-lw-text-sub)] bg-[var(--color-lw-elevated)] border-[var(--color-lw-border)]',
  planner: 'text-[var(--color-lw-purple-400)] bg-[var(--color-lw-purple-500)]/10 border-[var(--color-lw-purple-500)]/30',
  council: 'text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10 border-[var(--color-lw-gold-500)]/30',
  admin:   'text-red-400 bg-red-950/30 border-red-900/40',
};

const ROLE_LABEL: Record<UserRole, string> = {
  raider:  'Raider',
  planner: 'Planner',
  council: 'Council',
  admin:   'Admin',
};

const inputEdit = 'bg-[var(--color-lw-base)] border border-[var(--color-lw-purple-500)]/50 rounded px-2 py-0.5 text-[var(--color-lw-text)] text-xs focus:outline-none w-32';

export function UserManagement({ currentUserId }: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [usernameValue, setUsernameValue] = useState('');
  const [renameMsg, setRenameMsg] = useState<string | null>(null);
  const [batchLocking, setBatchLocking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchProfiles() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) setError(error.message);
    else setProfiles(data as Profile[]);
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function saveUsername(id: string) {
    const trimmed = usernameValue.trim();
    if (!trimmed) return;
    const oldName = profiles.find((p) => p.id === id)?.username ?? '';
    setUpdating(id);
    setError(null);

    const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', id);
    if (error) { setError(error.message); setUpdating(null); return; }

    const [wishResult, candidateResult, rowResult, historyResult] = await Promise.all([
      supabase.from('soft_reserves').update({ player_name: trimmed }).eq('player_name', oldName),
      supabase.from('loot_candidates').update({ player_name: trimmed }).eq('player_name', oldName),
      supabase.from('sheet_rows').update({ player_name: trimmed }).eq('player_name', oldName),
      supabase.from('loot_entries').update({ player_name: trimmed }).eq('player_name', oldName),
    ]);

    const cascadeError = wishResult.error?.message ?? candidateResult.error?.message ?? rowResult.error?.message ?? historyResult.error?.message ?? null;
    if (cascadeError) setError(`Profile renamed but cascade failed: ${cascadeError}`);

    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, username: trimmed } : p)));
    setUpdating(null);
    setEditingUsername(null);
    setRenameMsg(`"${oldName}" → "${trimmed}" — wishlist and planner candidates updated`);
    setTimeout(() => setRenameMsg(null), 5000);
  }

  async function changeRole(profile: Profile, newRole: UserRole) {
    if (profile.id === currentUserId) return;
    setUpdating(profile.id);
    setError(null);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (error) setError(error.message);
    else setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p)));
    setUpdating(null);
  }

  async function toggleStarsLocked(profile: Profile) {
    setUpdating(profile.id);
    const newVal = !profile.stars_locked;
    const { error } = await supabase.from('profiles').update({ stars_locked: newVal }).eq('id', profile.id);
    if (error) setError(error.message);
    else setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, stars_locked: newVal } : p)));
    setUpdating(null);
  }

  async function deleteUser(profile: Profile) {
    setUpdating(profile.id);
    setError(null);
    // Clean up user data then remove profile (auth user remains but can't access app)
    await Promise.all([
      supabase.from('soft_reserves').delete().eq('player_name', profile.username),
      supabase.from('loot_candidates').delete().eq('player_name', profile.username),
    ]);
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
    if (error) setError(error.message);
    else setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setUpdating(null);
    setConfirmDelete(null);
  }

  async function batchSetStarsLocked(locked: boolean) {
    setBatchLocking(true);
    setError(null);
    const { error } = await supabase.from('profiles').update({ stars_locked: locked }).neq('id', '');
    if (error) setError(error.message);
    else setProfiles((prev) => prev.map((p) => ({ ...p, stars_locked: locked })));
    setBatchLocking(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-lw-text)]">Registered Users</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => batchSetStarsLocked(true)}
            disabled={batchLocking}
            className="text-xs text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10 border border-[var(--color-lw-gold-500)]/30 hover:bg-[var(--color-lw-gold-400)]/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            Lock all stars
          </button>
          <button
            onClick={() => batchSetStarsLocked(false)}
            disabled={batchLocking}
            className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            Unlock all stars
          </button>
          <button
            onClick={fetchProfiles}
            className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] border border-[var(--color-lw-border)] hover:border-[var(--color-lw-border-sub)] px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>
      )}
      {renameMsg && (
        <div className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{renameMsg}</div>
      )}

      {loading ? (
        <div className="text-center py-10 text-[var(--color-lw-text-muted)] text-sm">Loading users…</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-lw-text-muted)] text-sm">No users registered yet.</div>
      ) : (
        <div className="lw-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Stars</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Change Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-lw-border-sub)]">
              {profiles.map((profile) => {
                const isSelf = profile.id === currentUserId;
                return (
                  <tr key={profile.id} className="transition-colors odd:bg-[var(--color-lw-surface)]/25 even:bg-transparent hover:bg-[var(--color-lw-surface)]/60">
                    <td className="px-4 py-3 font-medium text-[var(--color-lw-text)]">
                      {editingUsername === profile.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            autoFocus
                            value={usernameValue}
                            onChange={(e) => setUsernameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveUsername(profile.id); if (e.key === 'Escape') setEditingUsername(null); }}
                            className={inputEdit}
                          />
                          <button onClick={() => saveUsername(profile.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingUsername(null)} className="text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-[var(--color-lw-gold-300)] transition-colors"
                          onClick={() => { setEditingUsername(profile.id); setUsernameValue(profile.username); }}
                          title="Click to edit username"
                        >
                          {profile.username}
                        </span>
                      )}
                      {isSelf && <span className="ml-2 text-xs text-[var(--color-lw-text-muted)]">(you)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ROLE_STYLE[profile.role]}`}>
                        {ROLE_LABEL[profile.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {updating === profile.id ? (
                        <span className="text-xs text-[var(--color-lw-text-muted)]">…</span>
                      ) : (
                        <button
                          onClick={() => toggleStarsLocked(profile)}
                          title={profile.stars_locked ? 'Click to unlock stars' : 'Click to lock stars'}
                          className={`text-sm font-bold transition-colors ${profile.stars_locked ? 'text-[var(--color-lw-gold-300)]' : 'text-[var(--color-lw-border)]'}`}
                        >
                          {profile.stars_locked ? '🔒' : '🔓'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-lw-text-muted)]">
                      {new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className="text-xs text-[var(--color-lw-text-muted)] italic">cannot change own role</span>
                      ) : updating === profile.id ? (
                        <span className="text-xs text-[var(--color-lw-text-muted)]">Saving…</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {ROLES.filter((r) => r !== profile.role).map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(profile, r)}
                              className={`text-xs px-2 py-0.5 rounded-lg border transition-colors hover:opacity-80 ${ROLE_STYLE[r]}`}
                            >
                              {ROLE_LABEL[r]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!isSelf && (
                        confirmDelete === profile.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-red-400">Remove user?</span>
                            <button
                              onClick={() => deleteUser(profile)}
                              disabled={updating === profile.id}
                              className="text-xs text-white bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] px-2 py-0.5 rounded border border-[var(--color-lw-border)] transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(profile.id)}
                            title="Remove user"
                            className="text-[var(--color-lw-text-muted)] hover:text-red-400 transition-colors p-1 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
                            </svg>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
