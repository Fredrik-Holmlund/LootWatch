import React, { useState, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAssignmentSheet, SECTIONS, type SheetRow, type SheetCell, type SheetColumn, type CompPlayer } from '../../hooks/useAssignmentSheet';
import { getClassColor } from '../../utils/classColors';
import { canEdit } from '../../types';
import type { UserRole } from '../../types';

// ─── Raid markers ─────────────────────────────────────────────────────────────

const RAID_MARKERS = [
  { key: 'star',     label: 'Star'     },
  { key: 'circle',   label: 'Circle'   },
  { key: 'diamond',  label: 'Diamond'  },
  { key: 'triangle', label: 'Triangle' },
  { key: 'moon',     label: 'Moon'     },
  { key: 'square',   label: 'Square'   },
  { key: 'cross',    label: 'Cross'    },
  { key: 'skull',    label: 'Skull'    },
] as const;

function RaidMarkerIcon({ markerKey, size = 18 }: { markerKey: string; size?: number }) {
  const s = size;
  switch (markerKey) {
    case 'star':     return <svg width={s} height={s} viewBox="0 0 20 20"><path d="M10,0 L12.5,7.5 L20,10 L12.5,12.5 L10,20 L7.5,12.5 L0,10 L7.5,7.5 Z" fill="#FFD700" stroke="#B8960C" strokeWidth="0.5"/></svg>;
    case 'circle':   return <svg width={s} height={s} viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#FF8000" stroke="#CC5500" strokeWidth="0.5"/><circle cx="10" cy="10" r="5" fill="none" stroke="#FFB060" strokeWidth="1.5" opacity="0.5"/></svg>;
    case 'diamond':  return <svg width={s} height={s} viewBox="0 0 20 20"><polygon points="10,1 19,10 10,19 1,10" fill="#9B30FF" stroke="#6600CC" strokeWidth="0.5"/><polygon points="10,5 15,10 10,15 5,10" fill="none" stroke="#CC88FF" strokeWidth="1" opacity="0.5"/></svg>;
    case 'triangle': return <svg width={s} height={s} viewBox="0 0 20 20"><polygon points="10,18 1,3 19,3" fill="#00BB00" stroke="#007700" strokeWidth="0.5"/><polygon points="10,14 5,6 15,6" fill="none" stroke="#88FF88" strokeWidth="1" opacity="0.4"/></svg>;
    case 'moon':     return (<svg width={s} height={s} viewBox="0 0 20 20"><defs><mask id="mm"><rect width="20" height="20" fill="white"/><circle cx="13.5" cy="10" r="7" fill="black"/></mask></defs><circle cx="10" cy="10" r="9" fill="#5BB8D4" mask="url(#mm)" stroke="#2288AA" strokeWidth="0.5"/></svg>);
    case 'square':   return <svg width={s} height={s} viewBox="0 0 20 20"><rect x="1.5" y="1.5" width="17" height="17" rx="2" fill="#4169E1" stroke="#2244AA" strokeWidth="0.5"/><rect x="5" y="5" width="10" height="10" rx="1" fill="none" stroke="#88AAFF" strokeWidth="1" opacity="0.4"/></svg>;
    case 'cross':    return <svg width={s} height={s} viewBox="0 0 20 20"><line x1="3" y1="3" x2="17" y2="17" stroke="#DD2222" strokeWidth="4.5" strokeLinecap="round"/><line x1="17" y1="3" x2="3" y2="17" stroke="#DD2222" strokeWidth="4.5" strokeLinecap="round"/></svg>;
    case 'skull':    return (<svg width={s} height={s} viewBox="0 0 20 20"><ellipse cx="10" cy="8.5" rx="7.5" ry="7" fill="#E0E0E0" stroke="#999" strokeWidth="0.5"/><rect x="5.5" y="14" width="9" height="5" rx="1.5" fill="#E0E0E0" stroke="#999" strokeWidth="0.5"/><circle cx="7.5" cy="8.5" r="2" fill="#555"/><circle cx="12.5" cy="8.5" r="2" fill="#555"/><line x1="10" y1="14.5" x2="10" y2="19" stroke="#aaa" strokeWidth="1.5"/><line x1="7.5" y1="14.5" x2="7.5" y2="19" stroke="#aaa" strokeWidth="1" opacity="0.5"/><line x1="12.5" y1="14.5" x2="12.5" y2="19" stroke="#aaa" strokeWidth="1" opacity="0.5"/></svg>);
    default:         return <span className="text-xs text-gray-500">{markerKey}</span>;
  }
}

function renderMarkerText(text: string): React.ReactNode {
  const parts = text.split(/(\{[a-z]+\})/g);
  if (parts.length === 1) return text;
  return <>{parts.map((p, i) => { const m = p.match(/^\{([a-z]+)\}$/); return m ? <RaidMarkerIcon key={i} markerKey={m[1]} size={14} /> : p ? <span key={i}>{p}</span> : null; })}</>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveColor(playerClass: string | null): string {
  if (!playerClass) return '#9ca3af';
  return playerClass.startsWith('#') ? playerClass : (getClassColor(playerClass) || '#9ca3af');
}

// ─── Draggable player pill ────────────────────────────────────────────────────

function DraggablePlayerPill({ player }: { player: CompPlayer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `p:${player.name}` });
  const color = player.color || getClassColor(player.className) || '#9ca3af';
  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, backgroundColor: color + '22', color, borderColor: color + '55', zIndex: isDragging ? 50 : undefined, position: isDragging ? 'relative' : undefined }}
      {...listeners} {...attributes}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium cursor-grab select-none whitespace-nowrap ${isDragging ? 'opacity-40' : 'hover:brightness-125'}`}
    >
      <span className="opacity-50 text-[10px]">{player.specName}</span>
      {player.name}
    </div>
  );
}

// ─── Droppable role slot ──────────────────────────────────────────────────────

function DroppableSlot({ row, onClear, canWrite }: { row: SheetRow; onClear: () => void; canWrite: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `r:${row.id}`, disabled: !canWrite });
  const color = resolveColor(row.player_class);
  return (
    <div ref={setNodeRef} className={`min-h-[24px] rounded px-1.5 py-0.5 flex items-center gap-1 transition-colors ${isOver ? 'ring-1 ring-yellow-500/60 bg-yellow-500/10' : ''}`}>
      {row.player_name ? (
        <div className="flex items-center gap-1 w-full">
          <span
            style={{ backgroundColor: color + '28', borderColor: color + '55', color }}
            className="text-xs font-medium px-2 py-0.5 rounded border flex-1 truncate"
          >
            {row.player_name}
          </span>
          {canWrite && <button onClick={onClear} className="text-gray-700 hover:text-gray-400 text-[10px] flex-shrink-0">✕</button>}
        </div>
      ) : (
        <span className="text-[11px] text-gray-700 italic">{canWrite ? 'drag here' : '—'}</span>
      )}
    </div>
  );
}

// ─── Assignment cell ──────────────────────────────────────────────────────────

function AssignmentCell({ cell, rows, canWrite, onSave }: {
  cell: SheetCell | undefined;
  rows: SheetRow[];
  canWrite: boolean;
  onSave: (value: { ref_row_id?: number | null; text_value?: string | null } | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [ref, setRef] = useState<number | ''>('');

  const open = () => { if (!canWrite) return; setText(cell?.text_value ?? ''); setRef(cell?.ref_row_id ?? ''); setEditing(true); };
  const save = () => {
    const hasRef = ref !== '';
    const hasText = text.trim() !== '';
    if (!hasRef && !hasText) onSave(null);
    else onSave({ ref_row_id: hasRef ? ref as number : null, text_value: hasText ? text.trim() : null });
    setEditing(false);
  };

  const displayParts: React.ReactNode[] = [];
  if (cell?.ref_row_id) {
    const refRow = rows.find(r => r.id === cell.ref_row_id);
    if (refRow) {
      const color = resolveColor(refRow.player_class);
      displayParts.push(
        <span key="ref" style={{ backgroundColor: color + '28', borderColor: color + '55', color }} className="inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border whitespace-nowrap">
          {refRow.player_name ?? <em className="not-italic opacity-50">{refRow.label}</em>}
        </span>
      );
    }
  }
  if (cell?.text_value) {
    displayParts.push(
      <span key="text" className="text-xs text-gray-300 inline-flex items-center gap-0.5 flex-wrap">{renderMarkerText(cell.text_value)}</span>
    );
  }
  const display = displayParts.length > 0 ? <div className="flex items-center gap-1 flex-wrap">{displayParts}</div> : null;

  if (editing) {
    return (
      <div className="relative z-30">
        <div className="absolute top-0 left-0 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl p-3 min-w-[210px]">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Link to role</p>
              <select value={ref} onChange={e => setRef(e.target.value ? Number(e.target.value) : '')} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50">
                <option value="">— none —</option>
                {rows.map(r => <option key={r.id} value={r.id}>{r.label}{r.player_name ? ` · ${r.player_name}` : ''}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Custom text</p>
              <input
                autoFocus={ref === ''}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50"
                placeholder="e.g. Boss, MT healer…"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {RAID_MARKERS.map(m => (
                  <button key={m.key} type="button" title={m.label} onClick={() => { setText(t => t ? `${t} {${m.key}}` : `{${m.key}}`); setRef(''); }} className="hover:scale-125 transition-transform leading-none flex items-center justify-center">
                    <RaidMarkerIcon markerKey={m.key} size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={save} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-gray-950 rounded px-2 py-1 text-xs font-semibold">Save</button>
              <button onClick={() => { onSave(null); setEditing(false); }} className="text-xs text-gray-600 hover:text-red-400 px-2">Clear</button>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-600 hover:text-gray-300 px-2">✕</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={open} className={`min-h-[30px] w-full px-2 py-1 flex items-center justify-center ${canWrite ? 'cursor-pointer hover:bg-gray-700/30' : ''}`}>
      {display ?? (canWrite ? <span className="text-[10px] text-gray-800">+</span> : null)}
    </div>
  );
}

// ─── Boss column header (with thumbnail) ─────────────────────────────────────

function BossColumnHeader({ col, canWrite, onUpload, onRemove, onEnlarge }: {
  col: SheetColumn; canWrite: boolean;
  onUpload: (f: File) => void; onRemove: () => void; onEnlarge: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-semibold text-yellow-400 whitespace-nowrap">{col.label}</span>
      {col.image_path ? (
        <div className="relative group/th">
          <img
            src={col.image_path} alt={col.label}
            onClick={() => onEnlarge(col.image_path!)}
            className="h-10 w-full object-cover rounded border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
          />
          {canWrite && (
            <div className="absolute inset-0 hidden group-hover/th:flex items-center justify-center gap-1 bg-black/40 rounded">
              <button onClick={() => inputRef.current?.click()} className="text-[9px] bg-gray-900/90 text-gray-300 rounded px-1 py-0.5">↑</button>
              <button onClick={onRemove} className="text-[9px] bg-gray-900/90 text-red-400 rounded px-1 py-0.5">✕</button>
            </div>
          )}
        </div>
      ) : canWrite ? (
        <button onClick={() => inputRef.current?.click()} className="w-full h-8 border border-dashed border-gray-700 hover:border-gray-500 rounded text-[10px] text-gray-700 hover:text-gray-500 transition-colors">
          + image
        </button>
      ) : null}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── Sortable table row ───────────────────────────────────────────────────────

function SortableTableRow({ row, rowBg, columns, cellMap, allRows, canWrite, onClear, onDelete, onSave }: {
  row: SheetRow; rowBg: string; columns: SheetColumn[];
  cellMap: Map<string, SheetCell>; allRows: SheetRow[];
  canWrite: boolean; onClear: () => void; onDelete: () => void;
  onSave: (colId: number, val: { ref_row_id?: number | null; text_value?: string | null } | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled: !canWrite });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 };
  return (
    <tr ref={setNodeRef} style={style} className={`${rowBg} border-b border-gray-800/50 group/row`}>
      <td className={`sticky left-0 z-10 ${rowBg} px-3 py-1 text-xs text-gray-400 border-r border-gray-800 whitespace-nowrap`}>
        <div className="flex items-center gap-1.5">
          {canWrite && (
            <span {...attributes} {...listeners} className="cursor-grab text-gray-700 hover:text-gray-400 opacity-0 group-hover/row:opacity-100 transition-opacity select-none touch-none" title="Drag to reorder">⠿</span>
          )}
          <span>{row.label}</span>
          {canWrite && <button onClick={onDelete} className="opacity-0 group-hover/row:opacity-100 text-[10px] text-gray-700 hover:text-red-500 transition-opacity ml-auto" title="Delete row">✕</button>}
        </div>
      </td>
      <td className={`sticky left-[90px] z-10 ${rowBg} px-2 py-1 border-r border-gray-800`}>
        <DroppableSlot row={row} onClear={onClear} canWrite={canWrite} />
      </td>
      {columns.map((col, colIdx) => (
        <td key={col.id} className={`border-r border-gray-800/40 relative ${colIdx % 2 !== 0 ? 'bg-black/[0.12]' : ''}`}>
          <AssignmentCell cell={cellMap.get(`${row.id}-${col.id}`)} rows={allRows} canWrite={canWrite} onSave={val => onSave(col.id, val)} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props { role: UserRole | null; }

export function AssignmentSheetView({ role }: Props) {
  const { sheets, columns, rows, cells, loading, selectedSheetId, setSelectedSheetId, assignPlayer, clearPlayer, setCell, importComp, uploadImage, removeImage, addRow, deleteRow, reorderRows } = useAssignmentSheet();

  const canWrite = canEdit(role);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [compJson, setCompJson] = useState('');
  const [compPool, setCompPool] = useState<CompPlayer[]>([]);
  const [importErr, setImportErr] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [addingRowSection, setAddingRowSection] = useState<string | null>(null);
  const [newRowLabel, setNewRowLabel] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const cellMap = useMemo(() => { const m = new Map<string, SheetCell>(); for (const c of cells) m.set(`${c.row_id}-${c.column_id}`, c); return m; }, [cells]);
  const assignedNames = useMemo(() => new Set(rows.map(r => r.player_name?.toLowerCase()).filter(Boolean) as string[]), [rows]);
  const pool = useMemo(() => compPool.filter(p => !assignedNames.has(p.name.toLowerCase())), [compPool, assignedNames]);
  const groupedPool = useMemo(() => { const g = new Map<number, CompPlayer[]>(); for (const p of pool) { if (!g.has(p.groupNumber)) g.set(p.groupNumber, []); g.get(p.groupNumber)!.push(p); } return [...g.entries()].sort((a, b) => a[0] - b[0]); }, [pool]);
  const rowsBySection = useMemo(() => { const m: Record<string, SheetRow[]> = {}; for (const s of SECTIONS) m[s] = rows.filter(r => r.section === s); return m; }, [rows]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeStr = String(active.id);
    if (activeStr.startsWith('p:')) {
      const name = activeStr.replace(/^p:/, '');
      const rowId = Number(String(over.id).replace(/^r:/, ''));
      const player = compPool.find(p => p.name === name);
      if (!player || !rowId) return;
      assignPlayer(rowId, player.name, player.color || player.className);
    } else {
      const overId = Number(over.id);
      if (!overId) return;
      const activeRow = rows.find(r => r.id === Number(active.id));
      if (!activeRow) return;
      reorderRows(Number(active.id), overId, activeRow.section);
    }
  }

  function handleImport() {
    setImportErr('');
    const result = importComp(compJson, selectedSheetId!, rows);
    if (typeof result === 'string') { setImportErr(result); return; }
    setCompPool(result);
    setShowImport(false);
    setCompJson('');
  }

  async function handleAddRow() {
    if (!addingRowSection || !newRowLabel.trim()) return;
    await addRow(addingRowSection, newRowLabel.trim());
    setNewRowLabel('');
    setAddingRowSection(null);
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-600 text-sm"><span className="animate-spin mr-2">⏳</span> Loading…</div>;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">Raid Assignments</h2>
          {canWrite && (
            <button onClick={() => setShowImport(v => !v)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700">
              {showImport ? 'Hide import' : '⬆ Import comp JSON'}
            </button>
          )}
        </div>

        {/* Import panel */}
        {showImport && canWrite && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500">Paste the raid comp JSON. Existing assignments are kept if the player is still in the comp; missing players are cleared.</p>
            <textarea value={compJson} onChange={e => setCompJson(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-yellow-500/50" placeholder='{"slots":[...]}' />
            {importErr && <p className="text-xs text-red-400">{importErr}</p>}
            <button onClick={handleImport} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold text-xs px-4 py-1.5 rounded-lg">Import</button>
          </div>
        )}

        {/* Player pool */}
        {pool.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Unassigned players — drag to a role slot</p>
            <div className="space-y-1.5">
              {groupedPool.map(([group, players]) => (
                <div key={group} className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-700 w-12 flex-shrink-0">Group {group}</span>
                  {players.map(p => <DraggablePlayerPill key={p.name} player={p} />)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sheet tabs */}
        <div className="flex gap-1">
          {sheets.map(sheet => (
            <button key={sheet.id} onClick={() => setSelectedSheetId(sheet.id)} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedSheetId === sheet.id ? 'bg-yellow-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}>
              {sheet.title}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="border-collapse text-sm w-full">
            <thead>
              <tr className="bg-gray-800">
                <th className="sticky left-0 z-10 bg-gray-800 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[90px] min-w-[90px] border-b border-r border-gray-700">Role</th>
                <th className="sticky left-[90px] z-10 bg-gray-800 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px] min-w-[140px] border-b border-r border-gray-700">Player</th>
                {columns.map((col, colIdx) => (
                  <th key={col.id} className={`text-left px-2 py-2 border-b border-r border-gray-700 min-w-[80px] ${colIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}`}>
                    <BossColumnHeader
                      col={col} canWrite={canWrite}
                      onUpload={async f => { await uploadImage(col.id, f); }}
                      onRemove={() => removeImage(col.id)}
                      onEnlarge={setLightboxImage}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(() => {
                let rowIdx = 0;
                return SECTIONS.map(section => {
                  const sectionRows = rowsBySection[section] ?? [];
                  return (
                    <React.Fragment key={section}>
                      <tr className="bg-gray-800/50">
                        <td colSpan={2 + columns.length} className="sticky left-0 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
                          {section}
                        </td>
                      </tr>

                      <SortableContext items={sectionRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                        {sectionRows.map(row => {
                          const even = rowIdx++ % 2 === 0;
                          const rowBg = even ? 'bg-gray-900' : 'bg-gray-800/30';
                          return (
                            <SortableTableRow
                              key={row.id}
                              row={row}
                              rowBg={rowBg}
                              columns={columns}
                              cellMap={cellMap}
                              allRows={rows}
                              canWrite={canWrite}
                              onClear={() => clearPlayer(row.id)}
                              onDelete={() => deleteRow(row.id)}
                              onSave={(colId, val) => setCell(row.id, colId, val)}
                            />
                          );
                        })}
                      </SortableContext>

                      {canWrite && (
                        <tr key={`add-${section}`} className="border-b border-gray-800/30">
                          <td className={`sticky left-0 z-10 bg-gray-900 px-3 py-1 border-r border-gray-800`} colSpan={2}>
                            {addingRowSection === section ? (
                              <div className="flex items-center gap-1.5">
                                <input autoFocus value={newRowLabel} onChange={e => setNewRowLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') { setAddingRowSection(null); setNewRowLabel(''); } }} onBlur={() => { if (!newRowLabel.trim()) setAddingRowSection(null); }} className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50 w-32" placeholder="Role name…" />
                                <button onClick={handleAddRow} className="text-[10px] text-yellow-400 hover:text-yellow-300">Add</button>
                                <button onClick={() => { setAddingRowSection(null); setNewRowLabel(''); }} className="text-[10px] text-gray-600">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setAddingRowSection(section); setNewRowLabel(''); }} className="text-[10px] text-gray-700 hover:text-gray-400">+ Add row</button>
                            )}
                          </td>
                          {columns.map(col => <td key={col.id} className="border-r border-gray-800/30" />)}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drag overlay for row reordering */}
      <DragOverlay>
        {activeId && !String(activeId).startsWith('p:') ? (() => {
          const row = rows.find(r => r.id === Number(activeId));
          if (!row) return null;
          return (
            <div className="bg-gray-800 border border-yellow-500/50 rounded px-3 py-1.5 shadow-2xl text-xs text-gray-200 opacity-90 whitespace-nowrap">
              {row.label}{row.player_name ? ` · ${row.player_name}` : ''}
            </div>
          );
        })() : null}
      </DragOverlay>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <button onClick={() => setLightboxImage(null)} className="absolute top-2 right-2 text-white bg-black/60 hover:bg-black rounded-full w-8 h-8 flex items-center justify-center text-sm">✕</button>
          </div>
        </div>
      )}
    </DndContext>
  );
}
