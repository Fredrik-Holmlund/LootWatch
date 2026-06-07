import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { RaidLoot } from '../../types';

const INSTANCES = [
  "Gruul's Lair", "Magtheridon's Lair",
  "Serpentshrine Cavern", "Tempest Keep",
  "Mount Hyjal", "Black Temple",
  "Sunwell Plateau",
];

const BLANK_FORM = { instance_name: '', boss_name: '', item_name: '', item_id: '', icon_name: '' };

const filterCls = 'lw-card rounded-lg px-3 py-1.5 text-sm text-[var(--color-lw-text)] placeholder-[var(--color-lw-text-muted)] focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 transition-colors';
const inputCls  = 'bg-[var(--color-lw-base)] border border-[var(--color-lw-border)] rounded px-2 py-1 text-[var(--color-lw-text)] text-xs focus:outline-none focus:border-[var(--color-lw-purple-400)]/60 w-full transition-colors';

export function RaidLootManager() {
  const [items, setItems] = useState<RaidLoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInstance, setFilterInstance] = useState('');
  const [filterBoss, setFilterBoss] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RaidLoot>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [fixingIcons, setFixingIcons] = useState(false);
  const [fixProgress, setFixProgress] = useState<{ done: number; total: number } | null>(null);

  const brokenIconCount = items.filter(i => (!i.icon_name || i.icon_name === 'inv_misc_questionmark') && i.item_id).length;

  async function fixBrokenIcons() {
    const broken = items.filter(i => (!i.icon_name || i.icon_name === 'inv_misc_questionmark') && i.item_id);
    if (!broken.length) return;
    setFixingIcons(true);
    setFixProgress({ done: 0, total: broken.length });
    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < broken.length; i++) {
      const item = broken[i];
      try {
        const res = await fetch(`https://nether.wowhead.com/tbc/tooltip/item/${item.item_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const iconName = typeof data.icon === 'string' ? data.icon.toLowerCase() : null;
        if (iconName && iconName !== 'inv_misc_questionmark') {
          const iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
          const { error: dbErr } = await supabase.from('raid_loot').update({ icon_name: iconName }).eq('id', item.id);
          if (!dbErr) {
            setItems(prev => prev.map(p => p.id === item.id ? { ...p, icon_name: iconName, icon_url: iconUrl } : p));
            fixed++;
          } else {
            console.error(`[fix-icons] DB error for item ${item.item_id}:`, dbErr);
            failed++;
          }
        } else {
          console.warn(`[fix-icons] No icon returned for item ${item.item_id}:`, data);
          failed++;
        }
      } catch (e) {
        console.error(`[fix-icons] Fetch failed for item ${item.item_id}:`, e);
        failed++;
        if (i < 3 && failed > i) {
          setError('Icon fetch failed — check browser console (F12) for the error. Likely a network or CORS issue.');
          setFixingIcons(false);
          setFixProgress(null);
          return;
        }
      }
      setFixProgress({ done: i + 1, total: broken.length });
      await new Promise(r => setTimeout(r, 80));
    }

    setFixingIcons(false);
    setFixProgress(null);
    if (fixed === 0) {
      setError(`No icons were updated (${failed} failed). Check browser console (F12) for details.`);
    } else if (failed > 0) {
      setError(`Fixed ${fixed} icons. ${failed} could not be fetched — check browser console for details.`);
    }
  }

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase.from('raid_loot').select('*').order('instance_name').order('boss_name').order('item_name');
    if (error) setError(error.message);
    else setItems(data as RaidLoot[]);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  const instances = Array.from(new Set(items.map((i) => i.instance_name))).sort();
  const bosses = Array.from(new Set(
    items.filter((i) => !filterInstance || i.instance_name === filterInstance).map((i) => i.boss_name)
  )).sort();

  const filtered = items.filter((item) => {
    if (filterInstance && item.instance_name !== filterInstance) return false;
    if (filterBoss && item.boss_name !== filterBoss) return false;
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function startEdit(item: RaidLoot) {
    setEditingId(item.id);
    setEditValues({ item_name: item.item_name, boss_name: item.boss_name, instance_name: item.instance_name, item_id: item.item_id ?? undefined, icon_name: item.icon_name ?? undefined });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    const { error } = await supabase.from('raid_loot').update({
      item_name: editValues.item_name,
      boss_name: editValues.boss_name,
      instance_name: editValues.instance_name,
      item_id: editValues.item_id ?? null,
      icon_name: editValues.icon_name ?? null,
    }).eq('id', id);
    if (error) { setError(error.message); } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...editValues } : i));
      setEditingId(null);
    }
    setSaving(false);
  }

  async function toggleStarsDisabled(item: RaidLoot) {
    const newVal = !item.stars_disabled;
    const { error } = await supabase.from('raid_loot').update({ stars_disabled: newVal }).eq('id', item.id);
    if (error) setError(error.message);
    else setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, stars_disabled: newVal } : i));
  }

  async function toggleHidden(item: RaidLoot) {
    const newVal = !item.hidden;
    const { error } = await supabase.from('raid_loot').update({ hidden: newVal }).eq('id', item.id);
    if (error) setError(error.message);
    else setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, hidden: newVal } : i));
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this item from raid loot?')) return;
    const { error } = await supabase.from('raid_loot').delete().eq('id', id);
    if (error) setError(error.message);
    else setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function addItem() {
    if (!addForm.item_name.trim() || !addForm.instance_name || !addForm.boss_name) return;
    setSaving(true);
    const { data, error } = await supabase.from('raid_loot').insert({
      item_name: addForm.item_name.trim(),
      instance_name: addForm.instance_name,
      boss_name: addForm.boss_name.trim(),
      item_id: addForm.item_id ? Number(addForm.item_id) : null,
      icon_name: addForm.icon_name.trim() || null,
    }).select().single();
    if (error) setError(error.message);
    else {
      setItems((prev) => [...prev, data as RaidLoot].sort((a, b) => a.item_name.localeCompare(b.item_name)));
      setAddForm(BLANK_FORM);
      setShowAdd(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className={`flex-1 min-w-40 ${filterCls}`}
        />
        <select
          value={filterInstance}
          onChange={(e) => { setFilterInstance(e.target.value); setFilterBoss(''); }}
          className={filterCls}
        >
          <option value="">All Raids</option>
          {instances.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select
          value={filterBoss}
          onChange={(e) => setFilterBoss(e.target.value)}
          className={filterCls}
        >
          <option value="">All Bosses</option>
          {bosses.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-[var(--color-lw-text-muted)]">{filtered.length} items</span>
        {brokenIconCount > 0 && (
          <button
            onClick={fixBrokenIcons}
            disabled={fixingIcons}
            className="text-xs px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {fixingIcons && fixProgress
              ? `Fixing icons… ${fixProgress.done}/${fixProgress.total}`
              : `Fix icons (${brokenIconCount})`}
          </button>
        )}
        <button
          onClick={() => setShowAdd((v) => !v)}
          className={`ml-auto text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showAdd
              ? 'border-[var(--color-lw-purple-500)]/50 text-[var(--color-lw-purple-400)] bg-[var(--color-lw-purple-500)]/10'
              : 'border-[var(--color-lw-border)] text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)]'
          }`}
        >
          {showAdd ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div className="bg-[var(--color-lw-elevated)] border border-[var(--color-lw-purple-500)]/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[var(--color-lw-purple-400)] uppercase tracking-wider">New Item</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--color-lw-text-muted)] mb-1 block">Raid *</label>
              <select value={addForm.instance_name} onChange={(e) => setAddForm((f) => ({ ...f, instance_name: e.target.value }))} className={inputCls}>
                <option value="">Select raid…</option>
                {INSTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-lw-text-muted)] mb-1 block">Boss *</label>
              <input value={addForm.boss_name} onChange={(e) => setAddForm((f) => ({ ...f, boss_name: e.target.value }))} placeholder="Boss name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-lw-text-muted)] mb-1 block">Item Name *</label>
              <input value={addForm.item_name} onChange={(e) => setAddForm((f) => ({ ...f, item_name: e.target.value }))} placeholder="Item name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-lw-text-muted)] mb-1 block">Wowhead Item ID</label>
              <input value={addForm.item_id} onChange={(e) => setAddForm((f) => ({ ...f, item_id: e.target.value }))} placeholder="e.g. 28615" type="number" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-lw-text-muted)] mb-1 block">Icon Name</label>
              <input value={addForm.icon_name} onChange={(e) => setAddForm((f) => ({ ...f, icon_name: e.target.value }))} placeholder="e.g. inv_sword_01" className={inputCls} />
            </div>
          </div>
          <button
            onClick={addItem}
            disabled={saving || !addForm.item_name.trim() || !addForm.instance_name || !addForm.boss_name.trim()}
            className="text-xs px-4 py-1.5 bg-[var(--color-lw-purple-500)] hover:bg-[var(--color-lw-purple-400)] text-white font-semibold rounded-lg disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-[var(--color-lw-text-muted)] text-sm">Loading…</div>
      ) : (
        <div className="lw-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider hidden sm:table-cell">Boss</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider hidden md:table-cell">Raid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider hidden lg:table-cell">Item ID</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider" title="Whether players can star this item">Stars</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-lw-text-muted)] uppercase tracking-wider" title="Hide from wishlist without deleting">Visible</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-lw-border-sub)]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-lw-text-muted)] text-sm">No items found</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="transition-colors group odd:bg-[var(--color-lw-surface)]/25 even:bg-transparent hover:bg-[var(--color-lw-surface)]/60">
                    {editingId === item.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input value={editValues.item_name ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, item_name: e.target.value }))} className={inputCls} />
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell">
                          <input value={editValues.boss_name ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, boss_name: e.target.value }))} className={inputCls} />
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <select value={editValues.instance_name ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, instance_name: e.target.value }))} className={inputCls}>
                            {INSTANCES.map((i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell">
                          <input value={String(editValues.item_id ?? '')} onChange={(e) => setEditValues((v) => ({ ...v, item_id: e.target.value ? Number(e.target.value) : undefined }))} type="number" className={inputCls} />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => toggleStarsDisabled(item)}
                            title={item.stars_disabled ? 'Stars disabled — click to enable' : 'Stars enabled — click to disable'}
                            className={`text-base transition-colors ${item.stars_disabled ? 'text-[var(--color-lw-border)] hover:text-[var(--color-lw-text-muted)]' : 'text-[var(--color-lw-gold-300)] hover:text-[var(--color-lw-gold-400)]'}`}
                          >
                            ★
                          </button>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => toggleHidden(item)}
                            title={item.hidden ? 'Hidden from wishlist — click to show' : 'Visible in wishlist — click to hide'}
                            className={`text-sm transition-colors ${item.hidden ? 'text-[var(--color-lw-border)] hover:text-[var(--color-lw-text-muted)]' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {item.hidden ? '✕' : '✓'}
                          </button>
                        </td>
                        <td className="px-4 py-2 flex gap-1">
                          <button onClick={() => saveEdit(item.id)} disabled={saving} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 border border-green-500/30 rounded disabled:opacity-40">✓ Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] px-2 py-1 border border-[var(--color-lw-border)] rounded">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-[var(--color-lw-text)] flex items-center gap-2">
                          {item.icon_url && <img src={item.icon_url} alt="" className="w-5 h-5 rounded flex-shrink-0" />}
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-lw-text-sub)] text-xs hidden sm:table-cell">{item.boss_name}</td>
                        <td className="px-4 py-2.5 text-[var(--color-lw-text-muted)] text-xs hidden md:table-cell">{item.instance_name}</td>
                        <td className="px-4 py-2.5 text-[var(--color-lw-text-muted)] text-xs hidden lg:table-cell">{item.item_id ?? '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => toggleStarsDisabled(item)}
                            title={item.stars_disabled ? 'Stars disabled — click to enable' : 'Stars enabled — click to disable'}
                            className={`text-base transition-colors ${item.stars_disabled ? 'text-[var(--color-lw-border)] hover:text-[var(--color-lw-text-muted)]' : 'text-[var(--color-lw-gold-300)] hover:text-[var(--color-lw-gold-400)]'}`}
                          >
                            ★
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => toggleHidden(item)}
                            title={item.hidden ? 'Hidden from wishlist — click to show' : 'Visible in wishlist — click to hide'}
                            className={`text-sm transition-colors ${item.hidden ? 'text-[var(--color-lw-border)] hover:text-[var(--color-lw-text-muted)]' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {item.hidden ? '✕' : '✓'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => startEdit(item)} className="text-xs text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)]">Edit</button>
                            <button onClick={() => deleteItem(item.id)} className="text-xs text-red-500 hover:text-red-400">✕</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
