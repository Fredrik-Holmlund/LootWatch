import { useState, useMemo } from 'react';
import { useRaidLoot } from '../../hooks/useRaidLoot';
import { useWishlist } from '../../hooks/useWishlist';
import { useWowheadTooltips } from '../../hooks/useWowheadTooltips';
import { TBC_PHASES, getPhaseForInstance, sortBosses } from '../../data/tbcPhases';
import { getClassColor } from '../../utils/classColors';
import { stripRealm } from '../../utils/formatName';
import type { Profile, RaidLoot, SoftReserve, UserRole } from '../../types';

interface WishlistViewProps {
  profile: Profile | null;
  role: UserRole | null;
}

type SubTab = 'browse' | 'all';

const STAR_LABELS: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★' };

function StarBadge({ star }: { star: 1 | 2 | 3 }) {
  const colors: Record<number, string> = {
    1: 'text-gray-400',
    2: 'text-yellow-300',
    3: 'text-yellow-400',
  };
  return <span className={`text-xs font-bold ${colors[star]}`}>{STAR_LABELS[star]}</span>;
}

export function WishlistView({ profile, role }: WishlistViewProps) {
  const { loot, loading: lootLoading } = useRaidLoot();
  const { wishes, loading: wishLoading, myWishedIds, myWishes, usedStarTiers, toggleWish, setItemStar, deleteWish } = useWishlist(profile);
  const [subTab, setSubTab] = useState<SubTab>('browse');
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [filterClass, setFilterClass] = useState('');
  const [filterInstance, setFilterInstance] = useState('');

  const isLocked = profile?.stars_locked ?? false;

  const grouped = useMemo(() => {
    const phaseLoot = loot.filter((item) => getPhaseForInstance(item.instance_name) === selectedPhase && !item.hidden);
    const byInstance: Record<string, Record<string, RaidLoot[]>> = {};
    for (const item of phaseLoot) {
      if (!byInstance[item.instance_name]) byInstance[item.instance_name] = {};
      if (!byInstance[item.instance_name][item.boss_name])
        byInstance[item.instance_name][item.boss_name] = [];
      byInstance[item.instance_name][item.boss_name].push(item);
    }
    return byInstance;
  }, [loot, selectedPhase]);

  const wishCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const w of wishes) {
      if (w.raid_loot_id !== null) map.set(w.raid_loot_id, (map.get(w.raid_loot_id) ?? 0) + 1);
    }
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

  const loading = lootLoading || wishLoading;

  const allWishes = useMemo(() => {
    return wishes
      .filter((w) => {
        if (filterClass && w.player_class !== filterClass) return false;
        if (filterInstance && w.instance_name !== filterInstance) return false;
        return true;
      })
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [wishes, filterClass, filterInstance]);

  const classes = useMemo(() =>
    Array.from(new Set(wishes.map((w) => w.player_class).filter(Boolean))).sort() as string[],
    [wishes]
  );
  const instances = useMemo(() =>
    Array.from(new Set(wishes.map((w) => w.instance_name).filter(Boolean))).sort() as string[],
    [wishes]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-600 text-sm">
        <span className="animate-spin mr-2">⏳</span> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Wishlist</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile ? (
              <>Click any item to add it to your wishlist — <span className="text-yellow-400">{myWishedIds.size} wished</span></>
            ) : (
              'Browse item wishes across the guild'
            )}
          </p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-1.5">
            🔒 Your stars are locked by council
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([['browse', 'Browse & Wish'], ['all', 'All Wishes']] as [SubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === id ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
            {id === 'all' && wishes.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-600">({wishes.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Browse sub-tab */}
      {subTab === 'browse' && (
        <div className="space-y-4">
          {/* Phase tabs */}
          <div className="flex gap-1 flex-wrap">
            {TBC_PHASES.map((phase) => {
              const count = loot.filter((i) => getPhaseForInstance(i.instance_name) === phase.id).length;
              return (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedPhase === phase.id
                      ? 'bg-yellow-500 text-gray-950'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {phase.label}
                  {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Star legend */}
          {profile && (
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Star your most wanted items:</span>
              {([3, 2, 1] as const).map((tier) => (
                <span key={tier} className="flex items-center gap-1">
                  <StarBadge star={tier} />
                  <span>= {tier === 3 ? 'Must have' : tier === 2 ? 'Big upgrade' : 'Nice to have'}</span>
                  {usedStarTiers.has(tier) && <span className="text-gray-700">(used)</span>}
                </span>
              ))}
              {isLocked && <span className="text-amber-500">🔒 locked</span>}
            </div>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">No loot data for this phase.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([instance, bosses]) => (
                <div key={instance}>
                  <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3">{instance}</h3>
                  <div className="space-y-3">
                    {sortBosses(instance, Object.keys(bosses)).map((boss) => (
                      <div key={boss} className="bg-gray-900 border border-gray-800 rounded-lg">
                        <div className="px-4 py-2 bg-gray-800/60 border-b border-gray-800 rounded-t-lg">
                          <p className="text-sm font-semibold text-gray-300">{boss}</p>
                        </div>
                        <div className="divide-y divide-gray-800/60">
                          {bosses[boss].map((item) => {
                            const wished = myWishedIds.has(item.id);
                            const myWish = myWishes.get(item.id) ?? null;
                            const count = wishCounts.get(item.id) ?? 0;
                            const itemWishers = (wishers.get(item.id) ?? [])
                              .slice()
                              .sort((a, b) => (b.star ?? 0) - (a.star ?? 0));

                            return (
                              <div
                                key={item.id}
                                onClick={() => profile && toggleWish(item, null)}
                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group cursor-pointer ${
                                  wished ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-gray-800/40'
                                } ${!profile ? 'cursor-default' : ''}`}
                              >
                                {/* Heart */}
                                <span className={`text-base flex-shrink-0 transition-transform group-hover:scale-110 ${wished ? 'text-yellow-400' : 'text-gray-700'}`}>
                                  {wished ? '♥' : '♡'}
                                </span>

                                {/* Icon */}
                                {item.icon_url && (
                                  <img src={item.icon_url} alt="" className="w-6 h-6 rounded flex-shrink-0 border border-gray-700" />
                                )}

                                {/* Item name */}
                                {item.wowhead_url ? (
                                  <a
                                    href={item.wowhead_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm text-yellow-300/90 hover:text-yellow-200 hover:underline"
                                  >
                                    {item.item_name}
                                  </a>
                                ) : (
                                  <span className="text-sm text-yellow-300/90">{item.item_name}</span>
                                )}

                                {/* Star selector — only on wished items, only when stars are enabled for this item */}
                                {wished && profile && myWish && !item.stars_disabled && (
                                  <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                                    {([1, 2, 3] as const).map((tier) => {
                                      const isActive = myWish.star === tier;
                                      const isUsedElsewhere = usedStarTiers.has(tier) && !isActive;
                                      const disabled = isLocked || isUsedElsewhere;
                                      return (
                                        <button
                                          key={tier}
                                          disabled={disabled}
                                          onClick={() => setItemStar(myWish.id, isActive ? null : tier)}
                                          title={
                                            isLocked ? 'Stars are locked by council' :
                                            isUsedElsewhere ? 'Already assigned to another item' :
                                            isActive ? 'Remove star' :
                                            `Mark as ${STAR_LABELS[tier]}`
                                          }
                                          className={`text-xs px-0.5 rounded transition-colors leading-none ${
                                            isActive
                                              ? tier === 3 ? 'text-yellow-400' : tier === 2 ? 'text-yellow-300' : 'text-gray-300'
                                              : disabled
                                              ? 'text-gray-800 cursor-not-allowed'
                                              : 'text-gray-600 hover:text-yellow-500'
                                          }`}
                                        >
                                          {STAR_LABELS[tier]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Wish count + wisher tooltip */}
                                {count > 0 && (
                                  <span className="relative group/wishers flex-shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 cursor-default">
                                      ♥ {count}
                                    </span>
                                    <div className="absolute right-0 bottom-full mb-1.5 z-30 hidden group-hover/wishers:block min-w-[160px]">
                                      <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-xl p-2 space-y-1">
                                        {itemWishers.map((w, i) => (
                                          <div key={i} className="text-xs flex items-center justify-between gap-3">
                                            <span style={{ color: getClassColor(w.player_class) }} className="font-medium">
                                              {stripRealm(w.player_name)}
                                            </span>
                                            {w.star && <StarBadge star={w.star} />}
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
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterInstance}
              onChange={(e) => setFilterInstance(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">All Raids</option>
              {instances.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <span className="text-xs text-gray-600 self-center ml-1">{allWishes.length} wishes</span>
          </div>

          {allWishes.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">No wishes yet.</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Boss</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Raid</th>
                    {role === 'admin' && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {allWishes.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <span style={{ color: getClassColor(w.player_class) }} className="font-medium text-sm">
                          {stripRealm(w.player_name)}
                        </span>
                        {w.player_class && (
                          <span className="text-xs text-gray-600 ml-1.5">({w.player_class})</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-yellow-300/80 text-sm">{w.item_name}</td>
                      <td className="px-4 py-2.5">
                        {w.star ? <StarBadge star={w.star} /> : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{w.boss_name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">{w.instance_name ?? '—'}</td>
                      {role === 'admin' && (
                        <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => deleteWish(w.id)}
                            className="text-xs text-red-500 hover:text-red-400"
                            title="Remove wish"
                          >
                            ✕
                          </button>
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
