import { useState, useEffect } from 'react';
import { UserManagement } from '../admin/UserManagement';
import { RaidLootManager } from '../admin/RaidLootManager';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useGuildNotice } from '../../hooks/useGuildNotice';
import { useResponseWeights } from '../../hooks/useResponseWeights';
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
  const { responses: rspList, weights: rspWeights, loading: rspLoading, saveWeights: saveRspWeights } = useResponseWeights();
  const [localRspWeights, setLocalRspWeights] = useState<Record<string, number>>({});
  const [rspSaving, setRspSaving] = useState(false);
  const [rspSaved,  setRspSaved]  = useState(false);
  useEffect(() => { setLocalRspWeights(rspWeights); }, [rspWeights]);
  async function handleSaveRspWeights() {
    setRspSaving(true);
    await saveRspWeights(localRspWeights);
    setRspSaving(false); setRspSaved(true);
    setTimeout(() => setRspSaved(false), 2000);
  }

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

  const { notice, saveNotice } = useGuildNotice();
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticeActive, setNoticeActive] = useState(false);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeSaved, setNoticeSaved] = useState(false);
  useEffect(() => {
    if (notice) { setNoticeMsg(notice.message); setNoticeActive(notice.is_active); }
  }, [notice]);
  async function handleSaveNotice() {
    setNoticeSaving(true);
    await saveNotice(noticeMsg, noticeActive);
    setNoticeSaving(false); setNoticeSaved(true);
    setTimeout(() => setNoticeSaved(false), 2000);
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

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

            {/* Guild Notice */}
            <Card>
              <CardHeader>
                <CardTitle>Guild Notice</CardTitle>
                <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">
                  Pinned message shown at the top of the Dashboard for all users.
                </p>
              </CardHeader>
              <CardBody className="space-y-3">
                <textarea
                  rows={3}
                  value={noticeMsg}
                  onChange={e => setNoticeMsg(e.target.value)}
                  placeholder="e.g. Progression week — SSC Thursday 20:00. Bring flasks and consumables!"
                  className="w-full bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-lw-text)] placeholder:text-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-fel-400)]/60 transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setNoticeActive(v => !v)}
                      role="switch"
                      aria-checked={noticeActive}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${noticeActive ? 'bg-[var(--color-lw-fel-500)]' : 'bg-[var(--color-lw-border)]'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${noticeActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs text-[var(--color-lw-text-sub)]">{noticeActive ? 'Visible to all users' : 'Hidden'}</span>
                  </label>
                  {saveBtn(noticeSaving, noticeSaved, handleSaveNotice)}
                </div>
              </CardBody>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* How priority score works — info box */}
            <div className="bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded-xl p-4 space-y-3 text-xs text-[var(--color-lw-text-muted)]">
              <p className="text-sm font-semibold text-[var(--color-lw-text)]">How Priority Score Works</p>
              <p>Each raider gets a score from <span className="text-[var(--color-lw-text-sub)]">0–100</span> based on four components. Each component is scored 0–100 and then multiplied by its weight (must sum to 100).</p>
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-[#60a5fa] font-semibold w-28 shrink-0">Rolling Att.</span><span>Attendance % over the last N raids (set below). 100% = full score.</span></div>
                <div className="flex gap-2"><span className="text-[#4ade80] font-semibold w-28 shrink-0">Streak</span><span>Best consecutive attendance run, scored relative to total raids. Counts from first appearance; bench = present.</span></div>
                <div className="flex gap-2"><span className="text-[#a78bfa] font-semibold w-28 shrink-0">Drought</span><span>Days since last significant item (weight ≥ 0.3). Caps at 30 days = 100 drought score. No item ever = max score.</span></div>
                <div className="flex gap-2"><span className="text-[#fbbf24] font-semibold w-28 shrink-0">Recent Loot</span><span>Weighted loot received in the last 6 weeks. Each "1.0 unit" subtracts 25 points from 100. BIS (1.0) + Upgrade (0.7) = 1.7 units → 100−42 = 58 loot score. Offspec (0.2) barely counts.</span></div>
              </div>
              <p className="border-t border-[var(--color-lw-border-sub)] pt-2">
                <span className="font-semibold text-[var(--color-lw-text-sub)]">Example: </span>
                Weights 20/10/50/20 · Raider with 90% att, best streak, 20 days drought, 1 BIS this tier:<br />
                <span className="font-mono">= 90×0.20 + 100×0.10 + 67×0.50 + 75×0.20 = 18+10+33+15 = 76 pts</span>
              </p>
            </div>

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

            {/* Response Weights */}
            <Card>
              <CardHeader>
                <CardTitle>Response Weights</CardTitle>
                <p className="text-xs text-[var(--color-lw-text-muted)] mt-0.5">
                  Assign a weight (0.0–1.0) to each loot response found in your history. Used for both <strong className="text-[var(--color-lw-text-sub)]">Drought</strong> (items ≥ 0.3 break drought) and <strong className="text-[var(--color-lw-text-sub)]">Recent Loot</strong> score.
                </p>
              </CardHeader>
              <CardBody className="space-y-3">
                {rspLoading ? <PageSpinner /> : rspList.length === 0 ? (
                  <p className="text-xs text-[var(--color-lw-text-muted)]">No loot history imported yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 items-center">
                      <span className="text-[10px] text-[var(--color-lw-text-muted)] uppercase tracking-wider font-semibold col-span-1">Response</span>
                      <span className="text-[10px] text-[var(--color-lw-text-muted)] uppercase tracking-wider font-semibold">Weight</span>
                      <span className="text-[10px] text-[var(--color-lw-text-muted)] uppercase tracking-wider font-semibold text-right">Value</span>
                      {rspList.map(rsp => {
                        const w = localRspWeights[rsp] ?? 0;
                        const barColor = w >= 0.7 ? '#4ade80' : w >= 0.4 ? '#facc15' : w >= 0.1 ? '#fb923c' : 'rgba(255,255,255,0.12)';
                        return (
                          <>
                            <span key={`lbl-${rsp}`} className="text-xs text-[var(--color-lw-text)] font-medium truncate max-w-[140px]" title={rsp}>{rsp}</span>
                            <div key={`bar-${rsp}`} className="relative flex items-center gap-2">
                              <div className="flex-1 relative h-2 bg-[var(--color-lw-border)] rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${w * 100}%`, backgroundColor: barColor }} />
                              </div>
                              <input
                                type="range" min={0} max={1} step={0.05}
                                value={w}
                                onChange={e => setLocalRspWeights(prev => ({ ...prev, [rsp]: Number(e.target.value) }))}
                                className="w-24 accent-[var(--color-lw-fel-400)]"
                              />
                            </div>
                            <span key={`val-${rsp}`} className="text-xs font-mono text-right" style={{ color: barColor }}>{w.toFixed(2)}</span>
                          </>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--color-lw-border-sub)]">
                      <p className="text-xs text-[var(--color-lw-text-muted)]">0.0 = ignored · ≥0.3 = breaks drought · 1.0 = full penalty</p>
                      {saveBtn(rspSaving, rspSaved, handleSaveRspWeights)}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

          </div>

          <p className="lg:col-span-2 text-xs text-[var(--color-lw-text-muted)]">Changes take effect immediately for all users on next page load.</p>
        </div>
      )}
    </div>
  );
}
