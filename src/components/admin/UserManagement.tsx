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

  async function fetchProfiles() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) setError(error.message);
    else setProfiles(data as Profile[]);
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

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
                      {profile.username}
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
