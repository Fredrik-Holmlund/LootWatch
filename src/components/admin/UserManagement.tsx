import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { Profile, UserRole } from '../../types';

interface UserManagementProps {
  currentUserId: string;
}

const ROLES: UserRole[] = ['raider', 'council', 'admin'];

const ROLE_STYLE: Record<UserRole, string> = {
  raider:  'text-gray-400 bg-gray-800 border-gray-700',
  council: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  admin:   'text-red-400 bg-red-400/10 border-red-400/20',
};

const ROLE_LABEL: Record<UserRole, string> = {
  raider:  '🛡️ Raider',
  council: '⚔️ Council',
  admin:   '👑 Admin',
};

export function UserManagement({ currentUserId }: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [usernameValue, setUsernameValue] = useState('');
  const [renameMsg, setRenameMsg] = useState<string | null>(null);

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

    // Cascade rename to wishlist and loot planner candidates (not history/attendance — those are historical)
    const [wishResult, candidateResult] = await Promise.all([
      supabase.from('soft_reserves').update({ player_name: trimmed }).eq('player_name', oldName),
      supabase.from('loot_candidates').update({ player_name: trimmed }).eq('player_name', oldName),
    ]);

    const cascadeError = wishResult.error?.message ?? candidateResult.error?.message ?? null;
    if (cascadeError) setError(`Profile renamed but cascade failed: ${cascadeError}`);

    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, username: trimmed } : p)));
    setUpdating(null);
    setEditingUsername(null);
    setRenameMsg(`"${oldName}" → "${trimmed}" — wishlist and planner candidates updated`);
    setTimeout(() => setRenameMsg(null), 5000);
  }

  async function changeRole(profile: Profile, newRole: UserRole) {
    if (profile.id === currentUserId) return; // can't change own role
    setUpdating(profile.id);
    setError(null);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (error) setError(error.message);
    else setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p)));
    setUpdating(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Registered Users</h3>
        <button
          onClick={fetchProfiles}
          className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700 px-2 py-1 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>
      )}
      {renameMsg && (
        <div className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{renameMsg}</div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-600 text-sm">Loading users…</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">No users registered yet.</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {profiles.map((profile) => {
                const isSelf = profile.id === currentUserId;
                return (
                  <tr key={profile.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {editingUsername === profile.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            autoFocus
                            value={usernameValue}
                            onChange={(e) => setUsernameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveUsername(profile.id); if (e.key === 'Escape') setEditingUsername(null); }}
                            className="bg-gray-800 border border-yellow-500/50 rounded px-2 py-0.5 text-white text-xs focus:outline-none w-32"
                          />
                          <button onClick={() => saveUsername(profile.id)} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                          <button onClick={() => setEditingUsername(null)} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-yellow-300 transition-colors"
                          onClick={() => { setEditingUsername(profile.id); setUsernameValue(profile.username); }}
                          title="Click to edit username"
                        >
                          {profile.username}
                        </span>
                      )}
                      {isSelf && <span className="ml-2 text-xs text-gray-600">(you)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ROLE_STYLE[profile.role]}`}>
                        {ROLE_LABEL[profile.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className="text-xs text-gray-700 italic">cannot change own role</span>
                      ) : updating === profile.id ? (
                        <span className="text-xs text-gray-600">Saving…</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {ROLES.filter((r) => r !== profile.role).map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(profile, r)}
                              className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${ROLE_STYLE[r]} hover:opacity-80`}
                            >
                              {ROLE_LABEL[r]}
                            </button>
                          ))}
                        </div>
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
