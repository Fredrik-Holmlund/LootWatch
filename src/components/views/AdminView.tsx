import { useState, useEffect } from 'react';
import { UserManagement } from '../admin/UserManagement';
import { RaidLootManager } from '../admin/RaidLootManager';
import { useAppSettings } from '../../hooks/useAppSettings';
import { supabase } from '../../utils/supabase';
import type { Profile } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { SubTabs } from '../ui/SubTabs';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { PageSpinner } from '../ui/Spinner';

interface AdminViewProps { profile: Profile | null; }
type SubTab = 'users' | 'raidloot' | 'settings';

const tabs = [
  { id: 'users'    as SubTab, label: 'Users'     },
  { id: 'raidloot' as SubTab, label: 'Raid Loot' },
  { id: 'settings' as SubTab, label: 'Settings'  },
];

const inputCls = 'bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors w-full';

const ROLE_CARDS = [
  {
    label: 'Admin',
    color: 'text-red-400',
    bg: 'bg-red-950/30 border-red-900/40',
    perks: ['All council permissions', 'Manage user roles', 'Add/edit/delete raid loot', 'Full database access via UI'],
  },
  {
    label: 'Council',
    color: 'text-[var(--color-lw-gold-300)]',
    bg: 'bg-[var(--color-lw-gold-400)]/5 border-[var(--color-lw-gold-500)]/20',
    perks: ['Import CSV loot history', 'Award and delete entries', 'Edit notes and raids', 'Manage priority notes'],
  },
  {
    label: 'Raider',
    color: 'text-[var(--color-lw-text-sub)]',
    bg: 'bg-[var(--color-lw-elevated)] border-[var(--color-lw-border)]',
    perks: ['View loot history (if enabled)', 'View player summaries', 'Browse & add to wishlist', 'Read-only access'],
  },
];

export function AdminView({ profile }: AdminViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('users');
  const { settings, loading: settingsLoading, toggleSetting } = useAppSettings();

  const WCL_KEYS = ['wcl_guild_name', 'wcl_guild_realm', 'wcl_guild_region', 'wcl_game'] as const;
  type WclKey = typeof WCL_KEYS[number];
  const [wclConfig, setWclConfig] = useState<Record<WclKey, string>>({ wcl_guild_name: '', wcl_guild_realm: '', wcl_guild_region: 'EU', wcl_game: 'fresh' });
  const [wclSaving, setWclSaving] = useState(false);
  const [wclSaved,  setWclSaved]  = useState(false);

  const [pWeights, setPWeights] = useState({ attendance: 20, streak: 10, drought: 50, loot: 20 });
  const [attWindow, setAttWindow] = useState(6);
  const [pSaving, setPSaving] = useState(false);
  const [pSaved,  setPSaved]  = useState(false);
  const pSum = Object.values(pWeights).reduce((a, b) => a + b, 0);

  useEffect(() => {
    supabase.from('app_settings').select('key, value')
      .in('key', [...WCL_KEYS, 'priority_weight_attendance', 'priority_weight_streak', 'priority_weight_drought', 'priority_weight_loot', 'attendance_window'])
      .then(({ data }) => {
        if (!data) return;
        const cfg = { ...wclConfig };
        const pw  = { ...pWeights };
        let win = 6;
        for (const row of data) {
          if (WCL_KEYS.includes(row.key as WclKey)) cfg[row.key as WclKey] = row.value as string;
          if (row.key === 'priority_weight_attendance') pw.attendance = Number(row.value);
          if (row.key === 'priority_weight_streak')     pw.streak     = Number(row.value);
          if (row.key === 'priority_weight_drought')    pw.drought    = Number(row.value);
          if (row.key === 'priority_weight_loot')       pw.loot       = Number(row.value);
          if (row.key === 'attendance_window')          win           = Number(row.value);
        }
        setWclConfig(cfg);
        setPWeights(pw);
        setAttWindow(win);
      });
  }, []);

  async function savePWeights() {
    if (pSum !== 100) return;
    setPSaving(true);
    await Promise.all([
      supabase.from('app_settings').upsert({ key: 'priority_weight_attendance', value: String(pWeights.attendance), updated_at: new Date().toISOString() }),
      supabase.from('app_settings').upsert({ key: 'priority_weight_streak',     value: String(pWeights.streak),     updated_at: new Date().toISOString() }),
      supabase.from('app_settings').upsert({ key: 'priority_weight_drought',    value: String(pWeights.drought),    updated_at: new Date().toISOString() }),
      supabase.from('app_settings').upsert({ key: 'priority_weight_loot',       value: String(pWeights.loot),       updated_at: new Date().toISOString() }),
      supabase.from('app_settings').upsert({ key: 'attendance_window',          value: String(attWindow),           updated_at: new Date().toISOString() }),
    ]);
    setPSaving(false); setPSaved(true);
    setTimeout(() => setPSaved(false), 2000);
  }

  async function saveWclConfig() {
    setWclSaving(true);
    for (const key of WCL_KEYS)
      await supabase.from('app_settings').upsert({ key, value: wclConfig[key], updated_at: new Date().toISOString() });
    setWclSaving(false); setWclSaved(true);
    setTimeout(() => setWclSaved(false), 2000);
  }

  const saveBtn = (saving: boolean, saved: boolean, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="text-xs px-3 py-1.5 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold rounded-lg disabled:opacity-40 transition-colors"
    >
      {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Admin"
        subtitle="Manage users, roles, raid loot, and site settings"
        actions={
          <span className="text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/40 px-2.5 py-1 rounded-full">
            Admin Only
          </span>
        }
      />

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      {/* Users */}
      {subTab === 'users' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROLE_CARDS.map(({ label, color, bg, perks }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <p className={`text-sm font-semibold mb-2 ${color}`}>{label}</p>
                <ul className="text-xs text-[var(--color-lw-text-muted)] space-y-1">
                  {perks.map((p) => <li key={p} className="flex gap-1.5"><span className="opacity-50">•</span>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <UserManagement currentUserId={profile?.id ?? ''} />
        </div>
      )}

      {subTab === 'raidloot' && <RaidLootManager />}

      {subTab === 'settings' && (
        <div className="space-y-6 max-w-lg">

          {/* Raider Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Raider Visibility</CardTitle>
              <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">
                Control which tabs raiders can see. Council and Admin always see everything.
              </p>
            </CardHeader>
            {settingsLoading ? <PageSpinner /> : (
              <div className="divide-y divide-[var(--color-lw-border-sub)]">
                {([
                  { key: 'show_dashboard'       as const, label: 'Dashboard',        desc: 'Overview stats and weekly activity' },
                  { key: 'show_history'          as const, label: 'History',           desc: 'Loot table and player summaries' },
                  { key: 'show_wishes_publicly'  as const, label: 'Public Wishlist',   desc: "Raiders see each other's wishes and counts" },
                  { key: 'show_stars_publicly'   as const, label: 'Public Stars',      desc: "Raiders see each other's star priorities" },
                  { key: 'show_assignments'      as const, label: 'Raid Assignments',  desc: 'Enable before the raid, disable while setting up' },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div>
                      <p className="text-sm text-[var(--color-lw-text)] font-medium">{label}</p>
                      <p className="text-xs text-[var(--color-lw-text-muted)]">{desc}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(key)}
                      role="switch"
                      aria-checked={settings[key]}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${settings[key] ? 'bg-[var(--color-lw-purple-500)]' : 'bg-[var(--color-lw-border)]'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Priority weights */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Score Weights</CardTitle>
              <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">Must sum to 100.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Rolling window */}
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-lw-border-sub)]">
                <div className="flex-1">
                  <p className="text-xs font-medium text-[var(--color-lw-text)]">Rolling window</p>
                  <p className="text-xs text-[var(--color-lw-text-muted)]">Last N raids for attendance %</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={20} value={attWindow}
                    onChange={(e) => setAttWindow(Number(e.target.value))}
                    className="w-16 bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-2 py-1.5 text-sm text-[var(--color-lw-text)] text-center focus:outline-none focus:border-[var(--color-lw-purple-400)]/60"
                  />
                  <span className="text-xs text-[var(--color-lw-text-muted)]">raids</span>
                </div>
              </div>

              {([
                { key: 'attendance' as const, label: 'Rolling Attendance', color: '#60a5fa', desc: `Show-up rate (last ${attWindow} raids)` },
                { key: 'streak'     as const, label: 'Best Streak',        color: '#4ade80', desc: 'Longest consecutive run' },
                { key: 'drought'    as const, label: 'Loot Drought',       color: '#c084fc', desc: 'Days since last BIS/Upgrade' },
                { key: 'loot'       as const, label: 'Recent Loot',        color: '#facc15', desc: 'Penalty for items in last 6 weeks' },
              ]).map(({ key, label, color, desc }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color }}>{label}</p>
                      <p className="text-xs text-[var(--color-lw-text-muted)]">{desc}</p>
                    </div>
                    <input
                      type="number" min={0} max={100} value={pWeights[key]}
                      onChange={(e) => setPWeights((p) => ({ ...p, [key]: Number(e.target.value) }))}
                      className="w-16 bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-2 py-1.5 text-sm text-[var(--color-lw-text)] text-center focus:outline-none focus:border-[var(--color-lw-purple-400)]/60"
                    />
                  </div>
                  <div className="h-1.5 bg-[var(--color-lw-border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pWeights[key]}%`, backgroundColor: color, opacity: 0.7 }} />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-semibold ${pSum === 100 ? 'text-green-400' : 'text-red-400'}`}>
                  Sum: {pSum}/100 {pSum !== 100 && '— must equal 100'}
                </span>
                {saveBtn(pSaving, pSaved, savePWeights, pSum !== 100)}
              </div>
            </CardBody>
          </Card>

          {/* WarcraftLogs */}
          <Card>
            <CardHeader>
              <CardTitle>WarcraftLogs Guild</CardTitle>
              <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">Used to sync raid attendance automatically.</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {([
                { key: 'wcl_guild_name'   as WclKey, label: 'Guild Name',  placeholder: 'GLI TCH' },
                { key: 'wcl_guild_realm'  as WclKey, label: 'Realm Slug',  placeholder: 'spineshatter' },
                { key: 'wcl_guild_region' as WclKey, label: 'Region',      placeholder: 'EU' },
              ]).map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-[var(--color-lw-text-sub)] w-24 shrink-0">{label}</label>
                  <input
                    value={wclConfig[key]}
                    onChange={(e) => setWclConfig((c) => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs text-[var(--color-lw-text-sub)] w-24 shrink-0">Game</label>
                <select
                  value={wclConfig.wcl_game}
                  onChange={(e) => setWclConfig((c) => ({ ...c, wcl_game: e.target.value }))}
                  className={inputCls}
                >
                  <option value="retail">Retail</option>
                  <option value="classic">Classic / TBC / Wrath</option>
                  <option value="fresh">Fresh / Season of Discovery</option>
                </select>
              </div>
              <div className="pt-1">
                {saveBtn(wclSaving, wclSaved, saveWclConfig)}
              </div>
            </CardBody>
          </Card>

          <p className="text-xs text-[var(--color-lw-text-muted)]">Changes take effect immediately for all users on next page load.</p>
        </div>
      )}
    </div>
  );
}
