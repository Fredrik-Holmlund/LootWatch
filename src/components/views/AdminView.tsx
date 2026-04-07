import { useState } from 'react';
import { UserManagement } from '../admin/UserManagement';
import { RaidLootManager } from '../admin/RaidLootManager';
import type { Profile } from '../../types';

interface AdminViewProps {
  profile: Profile | null;
}

type SubTab = 'users' | 'raidloot';

export function AdminView({ profile }: AdminViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('users');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Admin</h2>
          <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
            Admin Only
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, and raid loot data</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([
          ['users',    '👥 Users'],
          ['raidloot', '⚔️ Raid Loot'],
        ] as [SubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === id
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'users' && (
        <>
          {/* Role overview */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '👑 Admin', color: 'text-red-400 border-red-400/20 bg-red-400/5', perks: ['All council permissions', 'Manage user roles', 'Add/edit/delete raid loot', 'Full database access via UI'] },
              { label: '⚔️ Council', color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5', perks: ['Import CSV loot history', 'Award and delete entries', 'Edit notes and raids', 'Manage priority notes'] },
              { label: '🛡️ Raider', color: 'text-gray-400 border-gray-700 bg-gray-800/40', perks: ['View loot history', 'View player summaries', 'Browse & add to wishlist', 'Read-only access'] },
            ].map(({ label, color, perks }) => (
              <div key={label} className={`rounded-xl border p-3 ${color}`}>
                <p className="text-sm font-semibold mb-2">{label}</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  {perks.map((p) => <li key={p}>• {p}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <UserManagement currentUserId={profile?.id ?? ''} />
        </>
      )}

      {subTab === 'raidloot' && <RaidLootManager />}
    </div>
  );
}
