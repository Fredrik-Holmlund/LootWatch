import { useState, useEffect } from 'react';
import { UserManagement } from '../admin/UserManagement';
import { RaidLootManager } from '../admin/RaidLootManager';
import { useAppSettings } from '../../hooks/useAppSettings';
import { supabase } from '../../utils/supabase';
import type { Profile } from '../../types';

interface AdminViewProps {
  profile: Profile | null;
}

type SubTab = 'users' | 'raidloot' | 'settings';

export function AdminView({ profile }: AdminViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('users');
  const { settings, loading: settingsLoading, toggleSetting } = useAppSettings();

  // WarcraftLogs guild config
  const WCL_KEYS = ['wcl_guild_name', 'wcl_guild_realm', 'wcl_guild_region', 'wcl_game'] as const;
  type WclKey = typeof WCL_KEYS[number];
  const [wclConfig, setWclConfig] = useState<Record<WclKey, string>>({ wcl_guild_name: '', wcl_guild_realm: '', wcl_guild_region: 'EU', wcl_game: 'fresh' });
  const [wclSaving, setWclSaving] = useState(false);
  const [wclSaved, setWclSaved] = useState(false);

  // Priority score weights
  const [pWeights, setPWeights] = useState({ attendance: 30, drought: 50, loot: 20 });
  const [pSaving, setPSaving] = useState(false);
  const [pSaved, setPSaved] = useState(false);
  const pSum = pWeights.attendance + pWeights.drought + pWeights.loot;

  useEffect(() => {
    supabase.from('app_settings').select('key, value')
      .in('key', [...WCL_KEYS, 'priority_weight_attendance', 'priority_weight_drought', 'priority_weight_loot'])
      .then(({ data }) => {
        if (!data) return;
        const cfg = { ...wclConfig };
        const pw = { ...pWeights };
        for (const row of data) {
          if (WCL_KEYS.includes(row.key as WclKey)) cfg[row.key as WclKey] = row.value as string;
          if (row.key === 'priority_weight_attendance') pw.attendance = Number(row.value);
          if (row.key === 'priority_weight_drought')    pw.drought    = Number(row.value);
          if (row.key === 'priority_weight_loot')       pw.loot       = Number(row.value);
        }
        setWclConfig(cfg);
        setPWeights(pw);
      });
  }, []);

  async function savePWeights() {
    if (pSum !== 100) return;
    setPSaving(true);
    await supabase.from('app_settings').upsert({ key: 'priority_weight_attendance', value: String(pWeights.attendance), updated_at: new Date().toISOString() });
    await supabase.from('app_settings').upsert({ key: 'priority_weight_drought',    value: String(pWeights.drought),    updated_at: new Date().toISOString() });
    await supabase.from('app_settings').upsert({ key: 'priority_weight_loot',       value: String(pWeights.loot),       updated_at: new Date().toISOString() });
    setPSaving(false);
    setPSaved(true);
    setTimeout(() => setPSaved(false), 2000);
  }

  async function saveWclConfig() {
    setWclSaving(true);
    for (const key of WCL_KEYS) {
      await supabase.from('app_settings')
        .upsert({ key, value: wclConfig[key], updated_at: new Date().toISOString() });
    }
    setWclSaving(false);
    setWclSaved(true);
    setTimeout(() => setWclSaved(false), 2000);
  }

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
        <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, raid loot, and site settings</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([
          ['users',    '👥 Users'],
          ['raidloot', '⚔️ Raid Loot'],
          ['settings', '⚙️ Settings'],
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '👑 Admin', color: 'text-red-400 border-red-400/20 bg-red-400/5', perks: ['All council permissions', 'Manage user roles', 'Add/edit/delete raid loot', 'Full database access via UI'] },
              { label: '⚔️ Council', color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5', perks: ['Import CSV loot history', 'Award and delete entries', 'Edit notes and raids', 'Manage priority notes'] },
              { label: '🛡️ Raider', color: 'text-gray-400 border-gray-700 bg-gray-800/40', perks: ['View loot history (if enabled)', 'View player summaries (if enabled)', 'Browse & add to wishlist', 'Read-only access'] },
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

      {subTab === 'settings' && (
        <div className="space-y-4 max-w-lg">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Raider Visibility</h3>
            <p className="text-xs text-gray-600 mb-4">
              Control which tabs raiders can see. Council and Admin always see all tabs. Wishlist is always visible.
            </p>
          </div>

          {settingsLoading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {([
                { key: 'show_dashboard' as const,       label: 'Dashboard',              desc: 'Overview stats, top recipients, weekly activity' },
                { key: 'show_history' as const,         label: 'History',                desc: 'Loot table, player summaries, warnings' },
                { key: 'show_wishes_publicly' as const, label: 'Public Wishlist',        desc: 'Raiders can see each other\'s wishes and wish counts. Turn off to hide until after loot is distributed.' },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{label}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      settings[key] ? 'bg-yellow-500' : 'bg-gray-700'
                    }`}
                    role="switch"
                    aria-checked={settings[key]}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        settings[key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-700">
            Changes take effect immediately for all users on next page load.
          </p>

          {/* Priority score weights */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Priority Score Weights</h3>
            <p className="text-xs text-gray-600 mb-3">Must sum to 100. Controls how each factor influences the priority ranking.</p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              {([
                { key: 'attendance' as const, label: 'Attendance', color: 'text-blue-400', desc: 'Show-up rate (bench counts)' },
                { key: 'drought'    as const, label: 'Drought',    color: 'text-purple-400', desc: 'Days since last BIS/Upgrade (cap 30d)' },
                { key: 'loot'       as const, label: 'Recent Loot', color: 'text-yellow-400', desc: 'Penalty for items in last 6 weeks' },
              ]).map(({ key, label, color, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">
                    <p className={`text-xs font-medium ${color}`}>{label}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pWeights[key]}
                    onChange={(e) => setPWeights((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-yellow-500/50"
                  />
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-500/60 transition-all" style={{ width: `${pWeights[key]}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-semibold ${pSum === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  Sum: {pSum}/100 {pSum !== 100 && '— must equal 100'}
                </span>
                <button
                  onClick={savePWeights}
                  disabled={pSaving || pSum !== 100}
                  className="text-xs px-3 py-1.5 bg-yellow-500 text-gray-950 font-semibold rounded-lg disabled:opacity-40"
                >
                  {pSaved ? '✓ Saved' : pSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* WarcraftLogs guild config */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">WarcraftLogs Guild</h3>
            <p className="text-xs text-gray-600 mb-3">Used to sync raid attendance automatically.</p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              {([
                { key: 'wcl_guild_name' as WclKey, label: 'Guild Name', placeholder: 'GLI TCH' },
                { key: 'wcl_guild_realm' as WclKey, label: 'Realm Slug', placeholder: 'spineshatter' },
                { key: 'wcl_guild_region' as WclKey, label: 'Region', placeholder: 'EU' },
              ]).map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</label>
                  <input
                    value={wclConfig[key]}
                    onChange={(e) => setWclConfig((c) => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500 w-24 flex-shrink-0">Game</label>
                <select
                  value={wclConfig.wcl_game}
                  onChange={(e) => setWclConfig((c) => ({ ...c, wcl_game: e.target.value }))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="retail">Retail</option>
                  <option value="classic">Classic / TBC / Wrath</option>
                  <option value="fresh">Fresh / Season of Discovery</option>
                </select>
              </div>
              <button
                onClick={saveWclConfig}
                disabled={wclSaving}
                className="text-xs px-3 py-1.5 bg-yellow-500 text-gray-950 font-semibold rounded-lg disabled:opacity-40"
              >
                {wclSaved ? '✓ Saved' : wclSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
