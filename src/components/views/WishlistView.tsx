import { useState, useMemo } from 'react';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { useWishlist } from '../../hooks/useWishlist';
import { useWowheadTooltips } from '../../hooks/useWowheadTooltips';
import { useAppSettings } from '../../hooks/useAppSettings';
import { TBC_PHASES, getPhaseForInstance, sortBosses } from '../../data/tbcPhases';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import { canEdit } from '../../types';
import type { Profile, RaidLoot, SoftReserve, UserRole } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { SubTabs } from '../ui/SubTabs';
import { PageSpinner } from '../ui/Spinner';

interface WishlistViewProps {
  profile: Profile | null;
  role: UserRole | null;
}

type SubTab = 'browse' | 'all';

const STAR_LABELS: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★' };

function StarBadge({ star }: { star: 1 | 2 | 3 }) {
  const colors: Record<number, string> = { 1: 'text-[var(--color-lw-text-muted)]', 2: 'text-[var(--color-lw-gold-300)]', 3: 'text-[var(--color-lw-gold-400)]' };
  return <span className={`text-xs font-bold ${colors[star]}`}>{STAR_LABELS[star]}</span>;
}

export function WishlistView({ profile, role }: WishlistViewProps) {
  const { loot, loading: lootLoading } = useRaidLoot();
  const { wishes, loading: wishLoading, myWishedIds, myWishes, usedStarTiers, toggleWish, setItemStar, deleteWish } = useWishlist(profile);
  const { settings } = useAppSettings();
  const [subTab, setSubTab] = useState<SubTab>('browse');
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [filterClass, setFilterClass] = useState('');
  const [filterInstance, setFilterInstance] = useState('');

  const canSeeOthers = settings.show_wishes_publicly || canEdit(role);
  const canSeeStars  = settings.show_stars_publicly  || canEdit(role);
  const isLocked     = profile?.stars_locked ?? false;

  const grouped = useMemo(() => {
    const phaseLoot = loot.filter((item) => getPhaseForInstance(item.instance_name) === selectedPhase && !item.hidden);
    const byInstance: Record<string, Record<string, RaidLoot[]>> = {};
    for (const item of phaseLoot) {
      if (!byInstance[item.instance_name]) byInstance[item.instance_name] = {};
      if (!byInstance[item.instance_name][item.boss_name]) byInstance[item.instance_name][item.boss_name] = [];
      byInstance[item.instance_name][item.boss_name].push(item);
    }
    return byInstance;
  }, [loot, selectedPhase]);

  const wishCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const w of wishes) if (w.raid_loot_id !== null) map.set(w.raid_loot_id, (map.get(w.raid_loot_id) ?? 0) + 1);
    return map;
  }, [wishes]);

  const wishers = useMemo(() => {
    const map = new Map<number, SoftReserve[]>();
    for (const w of wishes) {
      if (w.raid_loot_id === null) continue;
      if (!map.has(w.raid_loot_id)) map.set(w.raid_loot_id, []);
      map.get(w.raid_loot_id)!.push(w);
    }
    return map;
  }, [wishes]);

  useWowheadTooltips([grouped, selectedPhase, subTab]);

  const allWishes = useMemo(() => wishes
    .filter((w) => {
      if (!canSeeOthers && w.player_name.toLowerCase() !== (profile?.username ?? '').toLowerCase()) return false;
      if (filterClass    && w.player_class    !== filterClass)    return false;
      if (filterInstance && w.instance_name   !== filterInstance) return false;
      return true;
    })
    .sort((a, b) => a.player_name.localeCompare(b.player_name)),
    [wishes, filterClass, filterInstance, canSeeOthers, profile]
  );

  const classes   = useMemo(() => Array.from(new Set(wishes.map((w) => w.player_class).filter(Boolean))).sort() as string[], [wishes]);
  const instances = useMemo(() => Array.from(new Set(wishes.map((w) => w.instance_name).filter(Boolean))).sort() as string[], [wishes]);

  const tabs = [
    { id: 'browse' as SubTab, label: 'Browse & Wish' },
    { id: 'all'    as SubTab, label: 'All Wishes', count: wishes.length },
  ];

  if (lootLoading || wishLoading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      <PageHeader
        title="Wishlist"
        subtitle={profile
          ? `Click any item to add it to your wishlist — ${myWishedIds.size} wished`
          : 'Browse item wishes across the guild'}
        actions={isLocked ? (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10 border border-[var(--color-lw-gold-500)]/30 rounded-lg px-3 py-1.5">
            🔒 Stars locked by council
          </div>
        ) : undefined}
      />

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      {/* Browse sub-tab */}
      {subTab === 'browse' && (
        <div className="space-y-5">
          {/* Phase tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {TBC_PHASES.map((phase) => {
              const count = loot.filter((i) => getPhaseForInstance(i.instance_name) === phase.id).length;
              const active = selectedPhase === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={[
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors border',
                    active
                      ? 'border-[var(--color-lw-gold-500)]/50 text-[var(--color-lw-gold-300)] bg-[var(--color-lw-gold-400)]/10'
                      : 'border-[var(--color-lw-border)] text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] hover:bg-[var(--color-lw-elevated)]',
                  ].join(' ')}
                >
                  {phase.label}
                  {count > 0 && <span className="ml-1.5 text-xs opacity-60">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Star legend */}
          {profile && (
            <div className="flex items-center gap-4 text-xs text-[var(--color-lw-text-muted)]">
              <span>Star your most wanted:</span>
              {([3, 2, 1] as const).map((tier) => (
                <span key={tier} className="flex items-center gap-1">
                  <StarBadge star={tier} />
                  <span>{tier === 3 ? 'Must have' : tier === 2 ? 'Big upgrade' : 'Nice to have'}</span>
                  {usedStarTiers.has(tier) && <span className="opacity-50">(used)</span>}
                </span>
              ))}
              {isLocked && <span className="text-[var(--color-lw-gold-300)]">🔒 locked</span>}
            </div>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12 text-[var(--color-lw-text-muted)] text-sm">No loot data for this phase.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([instance, bosses]) => (
                <div key={instance}>
                  <h3
                    className="text-xs font-bold text-[var(--color-lw-gold-300)] uppercase tracking-widest mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {instance}
                  </h3>
                  <div className="space-y-2">
                    {sortBosses(instance, Object.keys(bosses)).map((boss) => (
                      <div key={boss} className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-xl overflow-hidden">
                        <div className="px-4 py-2.5 bg-[var(--color-lw-surface)]/60 border-b border-[var(--color-lw-border-sub)]">
                          <p className="text-sm font-semibold text-[var(--color-lw-text)]">{boss}</p>
                        </div>
                        <div className="divide-y divide-[var(--color-lw-border-sub)]">
                          {bosses[boss].map((item) => {
                            const wished      = myWishedIds.has(item.id);
                            const myWish      = myWishes.get(item.id) ?? null;
                            const count       = wishCounts.get(item.id) ?? 0;
                            const itemWishers = (wishers.get(item.id) ?? []).slice().sort((a, b) => (b.star ?? 0) - (a.star ?? 0));

                            return (
                              <div
                                key={item.id}
                                onClick={() => profile && toggleWish(item, null)}
                                className={[
                                  'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group',
                                  profile ? 'cursor-pointer' : 'cursor-default',
                                  wished ? 'bg-[var(--color-lw-gold-400)]/5 hover:bg-[var(--color-lw-gold-400)]/10' : 'hover:bg-[var(--color-lw-surface)]/40',
                                ].join(' ')}
                              >
                                {/* Heart */}
                                <span className={`text-base shrink-0 transition-transform group-hover:scale-110 ${wished ? 'text-[var(--color-lw-gold-300)]' : 'text-[var(--color-lw-text-muted)]'}`}>
                                  {wished ? '♥' : '♡'}
                                </span>

                                {item.icon_url && (
                                  <img src={item.icon_url} alt="" className="w-6 h-6 rounded shrink-0 border border-[var(--color-lw-border)]" />
                                )}

                                {item.wowhead_url ? (
                                  <a
                                    href={item.wowhead_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm text-[var(--color-lw-gold-300)]/90 hover:text-[var(--color-lw-gold-300)] hover:underline"
                                  >
                                    {item.item_name}
                                  </a>
                                ) : (
                                  <span className="text-sm text-[var(--color-lw-gold-300)]/90">{item.item_name}</span>
                                )}

                                {wished && profile && myWish && !item.stars_disabled && (
                                  <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                                    {([1, 2, 3] as const).map((tier) => {
                                      const isActive        = myWish.star === tier;
                                      const isUsedElsewhere = usedStarTiers.has(tier) && !isActive;
                                      const disabled        = isLocked || isUsedElsewhere;
                                      return (
                                        <button
                                          key={tier}
                                          disabled={disabled}
                                          onClick={() => setItemStar(myWish.id, isActive ? null : tier)}
                                          title={
                                            isLocked          ? 'Stars are locked by council'         :
                                            isUsedElsewhere   ? 'Already assigned to another item'    :
                                            isActive          ? 'Remove star'                          :
                                            `Mark as ${STAR_LABELS[tier]}`
                                          }
                                          className={`text-base px-0.5 rounded transition-colors leading-none ${
                                            isActive
                                              ? tier === 3 ? 'text-[var(--color-lw-gold-400)]'
                                              : tier === 2 ? 'text-[var(--color-lw-gold-300)]'
                                              : 'text-[var(--color-lw-text)]'
                                            : disabled
                                              ? 'text-[var(--color-lw-text-muted)]/30 cursor-not-allowed'
                                              : 'text-[var(--color-lw-text-sub)]/60 hover:text-[var(--color-lw-gold-400)]'
                                          }`}
                                        >
                                          {STAR_LABELS[tier]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {count > 0 && canSeeOthers && (
                                  <span className="relative group/wishers shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-xs text-[var(--color-lw-purple-400)] bg-[var(--color-lw-purple-500)]/10 border border-[var(--color-lw-purple-500)]/20 rounded px-1.5 py-0.5 cursor-default">
                                      ♥ {count}
                                    </span>
                                    <div className="absolute right-0 bottom-full mb-1.5 z-30 hidden group-hover/wishers:block min-w-[160px]">
                                      <div className="bg-[var(--color-lw-surface)] border border-[var(--color-lw-border)] rounded-xl shadow-xl p-2 space-y-1">
                                        {itemWishers.map((w, i) => (
                                          <div key={i} className="text-xs flex items-center justify-between gap-3">
                                            <span style={{ color: getClassColor(w.player_class) }} className="font-medium">
                                              {stripRealm(w.player_name)}
                                            </span>
                                            {w.star && canSeeStars && <StarBadge star={w.star} />}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Wishes sub-tab */}
      {subTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: filterClass,    onChange: setFilterClass,    options: classes,   placeholder: 'All Classes' },
              { value: filterInstance, onChange: setFilterInstance, options: instances,  placeholder: 'All Raids' },
            ].map(({ value, onChange, options, placeholder }) => (
              <select
                key={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/50"
              >
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <span className="text-xs text-[var(--color-lw-text-muted)] self-center ml-1">{allWishes.length} wishes</span>
          </div>

          {allWishes.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-lw-text-muted)] text-sm">No wishes yet.</div>
          ) : (
            <div className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/60">
                    {['Player', 'Item', canSeeStars ? 'Priority' : null, 'Boss', 'Raid', role === 'admin' ? '' : null]
                      .filter(Boolean)
                      .map((h) => (
                        <th key={h ?? '_'} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-lw-border-sub)]">
                  {allWishes.map((w) => (
                    <tr key={w.id} className="hover:bg-[var(--color-lw-surface)]/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <span style={{ color: getClassColor(w.player_class) }} className="font-medium">{stripRealm(w.player_name)}</span>
                        {w.player_class && <span className="text-xs text-[var(--color-lw-text-muted)] ml-1.5">({w.player_class})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-lw-gold-300)]/80">{w.item_name}</td>
                      {canSeeStars && (
                        <td className="px-4 py-2.5">
                          {w.star ? <StarBadge star={w.star} /> : <span className="text-[var(--color-lw-text-muted)]">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-[var(--color-lw-text-muted)] text-xs">{w.boss_name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[var(--color-lw-text-muted)] text-xs">{w.instance_name ?? '—'}</td>
                      {role === 'admin' && (
                        <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteWish(w.id)} className="text-xs text-red-500 hover:text-red-400">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
