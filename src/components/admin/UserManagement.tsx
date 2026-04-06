import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { Profile, UserRole } from '../../types';

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');
    if (error) setError(error.message);
    else setProfiles(data as Profile[]);
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function toggleRole(profile: Profile) {
    const newRole: UserRole = profile.role === 'council' ? 'raider' : 'council';
    setUpdating(profile.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);
    if (error) {
      setError(error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
    }
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
        <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {profile.username}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={profile.role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRole(profile)}
                      disabled={updating === profile.id}
                      className="text-xs px-3 py-1 border border-gray-700 hover:border-yellow-500/50 text-gray-400 hover:text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === profile.id
                        ? '…'
                        : profile.role === 'council'
                        ? 'Demote to Raider'
                        : 'Promote to Council'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        role === 'council'
          ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
          : 'text-gray-400 bg-gray-800 border border-gray-700'
      }`}
    >
      {role === 'council' ? '⚔️ Council' : '🛡️ Raider'}
    </span>
  );
}
