import { useState, useMemo, useRef } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useAssignmentSheet, SECTIONS, type SheetRow, type SheetCell, type SheetColumn, type CompPlayer } from '../../hooks/useAssignmentSheet';
import { getClassColor } from '../../utils/classColors';
import { canEdit } from '../../types';
import type { UserRole } from '../../types';

// ─── Draggable player pill ────────────────────────────────────────────────────

function DraggablePlayerPill({ player }: { player: CompPlayer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `p:${player.name}` });
  const color = getClassColor(player.className);
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        backgroundColor: color + '22', color, borderColor: color + '55',
        zIndex: isDragging ? 50 : undefined, position: isDragging ? 'relative' : undefined,
      }}
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
  const color = row.player_class ? getClassColor(row.player_class) : null;
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[130px] min-h-[26px] rounded px-2 py-0.5 flex items-center gap-1 transition-colors ${isOver ? 'bg-yellow-500/20 ring-1 ring-yellow-500/60' : 'bg-gray-800/60'}`}
    >
      {row.player_name ? (
        <>
          <span style={{ color: color ?? '#9ca3af' }} className="text-xs font-medium flex-1 truncate">{row.player_name}</span>
          {canWrite && <button onClick={onClear} className="text-gray-700 hover:text-gray-400 text-[10px] flex-shrink-0 leading-none">✕</button>}
        </>
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
  onSave: (value: { ref_row_id: number } | { text_value: string } | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [ref, setRef] = useState<number | ''>('');

  const open = () => {
    if (!canWrite) return;
    setText(cell?.text_value ?? '');
    setRef(cell?.ref_row_id ?? '');
    setEditing(true);
  };

  const save = () => {
    if (ref !== '') onSave({ ref_row_id: ref as number });
    else if (text.trim()) onSave({ text_value: text.trim() });
    else onSave(null);
    setEditing(false);
  };

  let display: React.ReactNode = null;
  if (cell?.ref_row_id) {
    const refRow = rows.find(r => r.id === cell.ref_row_id);
    if (refRow) {
      const color = refRow.player_class ? getClassColor(refRow.player_class) : '#6b7280';
      display = <span style={{ color }} className="text-xs font-medium">{refRow.player_name ?? <span className="italic opacity-50">{refRow.label}</span>}</span>;
    }
  } else if (cell?.text_value) {
    display = <span className="text-xs text-gray-300">{cell.text_value}</span>;
  }

  if (editing) {
    return (
      <div className="relative z-30">
        <div className="absolute top-0 left-0 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl p-3 min-w-[210px]">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Link to role</p>
              <select
                value={ref}
                onChange={e => { setRef(e.target.value ? Number(e.target.value) : ''); if (e.target.value) setText(''); }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50"
              >
                <option value="">— none —</option>
                {rows.map(r => <option key={r.id} value={r.id}>{r.label}{r.player_name ? ` · ${r.player_name}` : ''}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Custom text</p>
              <input
                autoFocus={ref === ''}
                value={text}
                onChange={e => { setText(e.target.value); if (e.target.value) setRef(''); }}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50"
                placeholder="e.g. Boss, MT healer…"
              />
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
    <div
      onClick={open}
      className={`min-h-[32px] w-full px-2 py-1 flex items-center ${canWrite ? 'cursor-pointer hover:bg-gray-700/40' : ''}`}
    >
      {display ?? (canWrite ? <span className="text-[10px] text-gray-800">+</span> : null)}
    </div>
  );
}

// ─── Image cell ───────────────────────────────────────────────────────────────

function BossImageCell({ col, canWrite, onUpload, onRemove }: {
  col: SheetColumn;
  canWrite: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    await onUpload(file);
    setUploading(false);
  };

  return (
    <div className="min-w-[200px] max-w-[200px] p-2 border-t border-gray-800 space-y-1.5">
      {col.image_path ? (
        <div className="relative group/img">
          <img src={col.image_path} alt={col.label} className="w-full rounded border border-gray-700 object-contain max-h-48" />
          {canWrite && (
            <div className="absolute top-1 right-1 hidden group-hover/img:flex gap-1">
              <button onClick={() => inputRef.current?.click()} className="text-[10px] bg-gray-900/80 text-gray-300 hover:text-white rounded px-1.5 py-0.5">Replace</button>
              <button onClick={onRemove} className="text-[10px] bg-gray-900/80 text-red-400 hover:text-red-300 rounded px-1.5 py-0.5">Remove</button>
            </div>
          )}
        </div>
      ) : canWrite ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-gray-700 hover:border-gray-500 rounded p-3 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          {uploading ? 'Uploading…' : '+ Add image'}
        </button>
      ) : null}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props { role: UserRole | null; }

export function AssignmentSheetView({ role }: Props) {
  const {
    sheets, columns, rows, cells, loading,
    selectedSheetId, setSelectedSheetId,
    assignPlayer, clearPlayer, setCell,
    importComp, uploadImage, removeImage,
    addRow, deleteRow,
  } = useAssignmentSheet();

  const canWrite = canEdit(role);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [compJson, setCompJson] = useState('');
  const [compPool, setCompPool] = useState<CompPlayer[]>([]);
  const [importErr, setImportErr] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [addingRowSection, setAddingRowSection] = useState<string | null>(null);
  const [newRowLabel, setNewRowLabel] = useState('');

  const cellMap = useMemo(() => {
    const m = new Map<string, SheetCell>();
    for (const c of cells) m.set(`${c.row_id}-${c.column_id}`, c);
    return m;
  }, [cells]);

  const assignedNames = useMemo(() => new Set(rows.map(r => r.player_name?.toLowerCase()).filter(Boolean) as string[]), [rows]);
  const pool = useMemo(() => compPool.filter(p => !assignedNames.has(p.name.toLowerCase())), [compPool, assignedNames]);

  const groupedPool = useMemo(() => {
    const g = new Map<number, CompPlayer[]>();
    for (const p of pool) {
      if (!g.has(p.groupNumber)) g.set(p.groupNumber, []);
      g.get(p.groupNumber)!.push(p);
    }
    return [...g.entries()].sort((a, b) => a[0] - b[0]);
  }, [pool]);

  const rowsBySection = useMemo(() => {
    const m: Record<string, SheetRow[]> = {};
    for (const s of SECTIONS) m[s] = rows.filter(r => r.section === s);
    return m;
  }, [rows]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const name = String(active.id).replace(/^p:/, '');
    const rowId = Number(String(over.id).replace(/^r:/, ''));
    const player = compPool.find(p => p.name === name);
    if (!player || !rowId) return;
    assignPlayer(rowId, player.name, player.className);
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

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-600 text-sm">
      <span className="animate-spin mr-2">⏳</span> Loading…
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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

        {/* Comp import panel */}
        {showImport && canWrite && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500">Paste the raid comp JSON. Existing assignments are kept if the player is still in the comp; missing players are cleared.</p>
            <textarea
              value={compJson}
              onChange={e => setCompJson(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-yellow-500/50"
              placeholder='{"slots":[...]}'
            />
            {importErr && <p className="text-xs text-red-400">{importErr}</p>}
            <button onClick={handleImport} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold text-xs px-4 py-1.5 rounded-lg">
              Import
            </button>
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
            <button
              key={sheet.id}
              onClick={() => setSelectedSheetId(sheet.id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedSheetId === sheet.id ? 'bg-yellow-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
            >
              {sheet.title}
            </button>
          ))}
        </div>

        {/* Assignment grid */}
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="border-collapse text-sm" style={{ minWidth: `${180 + columns.length * 200}px` }}>
            <thead>
              <tr className="bg-gray-800/80">
                <th className="sticky left-0 z-10 bg-gray-800 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px] border-b border-r border-gray-700">Role</th>
                <th className="sticky left-[100px] z-10 bg-gray-800 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px] border-b border-r border-gray-700">Player</th>
                {columns.map(col => (
                  <th key={col.id} className="text-left px-3 py-2 text-xs font-semibold text-yellow-400 border-b border-r border-gray-700 min-w-[200px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SECTIONS.map(section => {
                const sectionRows = rowsBySection[section] ?? [];
                return (
                  <>
                    {/* Section header */}
                    <tr key={`sec-${section}`} className="bg-gray-800/40">
                      <td
                        colSpan={2 + columns.length}
                        className="sticky left-0 px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800"
                      >
                        {section}
                      </td>
                    </tr>

                    {/* Role rows */}
                    {sectionRows.map(row => (
                      <tr key={row.id} className="border-b border-gray-800/60 hover:bg-gray-800/20 group/row">
                        <td className="sticky left-0 z-10 bg-gray-900 group-hover/row:bg-gray-800/20 px-3 py-1.5 text-xs text-gray-400 border-r border-gray-800 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{row.label}</span>
                            {canWrite && (
                              <button
                                onClick={() => deleteRow(row.id)}
                                className="opacity-0 group-hover/row:opacity-100 text-[10px] text-gray-700 hover:text-red-500 transition-opacity"
                                title="Delete row"
                              >✕</button>
                            )}
                          </div>
                        </td>
                        <td className="sticky left-[100px] z-10 bg-gray-900 group-hover/row:bg-gray-800/20 px-2 py-1 border-r border-gray-800">
                          <DroppableSlot row={row} onClear={() => clearPlayer(row.id)} canWrite={canWrite} />
                        </td>
                        {columns.map(col => {
                          const cell = cellMap.get(`${row.id}-${col.id}`);
                          return (
                            <td key={col.id} className="border-r border-gray-800/60 relative">
                              <AssignmentCell
                                cell={cell}
                                rows={rows}
                                canWrite={canWrite}
                                onSave={val => setCell(row.id, col.id, val)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Add row button */}
                    {canWrite && (
                      <tr key={`add-${section}`} className="border-b border-gray-800/40">
                        <td className="sticky left-0 z-10 bg-gray-900 px-3 py-1 border-r border-gray-800" colSpan={2}>
                          {addingRowSection === section ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                value={newRowLabel}
                                onChange={e => setNewRowLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') { setAddingRowSection(null); setNewRowLabel(''); } }}
                                onBlur={() => { if (!newRowLabel.trim()) { setAddingRowSection(null); } }}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-yellow-500/50 w-32"
                                placeholder="Role name…"
                              />
                              <button onClick={handleAddRow} className="text-[10px] text-yellow-400 hover:text-yellow-300">Add</button>
                              <button onClick={() => { setAddingRowSection(null); setNewRowLabel(''); }} className="text-[10px] text-gray-600 hover:text-gray-300">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setAddingRowSection(section); setNewRowLabel(''); }} className="text-[10px] text-gray-700 hover:text-gray-400">+ Add row</button>
                          )}
                        </td>
                        {columns.map(col => <td key={col.id} className="border-r border-gray-800/40" />)}
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>

            {/* Boss images row */}
            <tfoot>
              <tr className="bg-gray-900/50">
                <td className="sticky left-0 z-10 bg-gray-900 px-3 py-2 text-[10px] text-gray-700 uppercase tracking-wider border-t border-r border-gray-800 align-top">Images</td>
                <td className="sticky left-[100px] z-10 bg-gray-900 border-t border-r border-gray-800" />
                {columns.map(col => (
                  <td key={col.id} className="border-t border-r border-gray-800 align-top p-0">
                    <BossImageCell
                      col={col}
                      canWrite={canWrite}
                      onUpload={async (file) => { await uploadImage(col.id, file); }}
                      onRemove={() => removeImage(col.id)}
                    />
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </DndContext>
  );
}
