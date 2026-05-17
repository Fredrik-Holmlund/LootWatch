import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';

export interface AssignmentSheet { id: number; title: string; sort_order: number; }
export interface SheetColumn { id: number; sheet_id: number; label: string; sort_order: number; image_path: string | null; }
export interface SheetRow { id: number; sheet_id: number; section: string; label: string; sort_order: number; player_name: string | null; player_class: string | null; }
export interface SheetCell { id: number; row_id: number; column_id: number; ref_row_id: number | null; text_value: string | null; }
export interface CompPlayer { name: string; className: string; specName: string; groupNumber: number; slotNumber: number; color: string; }

export const SECTIONS = ['Tanks', 'Healers', 'Ranged', 'Melee'] as const;

export function useAssignmentSheet() {
  const [sheets, setSheets] = useState<AssignmentSheet[]>([]);
  const [allColumns, setAllColumns] = useState<SheetColumn[]>([]);
  const [allRows, setAllRows] = useState<SheetRow[]>([]);
  const [allCells, setAllCells] = useState<SheetCell[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: c }, { data: r }] = await Promise.all([
        supabase.from('assignment_sheets').select('*').order('sort_order'),
        supabase.from('sheet_columns').select('*').order('sort_order'),
        supabase.from('sheet_rows').select('*').order('sort_order'),
      ]);
      setSheets((s ?? []) as AssignmentSheet[]);
      setAllColumns((c ?? []) as SheetColumn[]);
      setAllRows((r ?? []) as SheetRow[]);
      if (s && s.length > 0) setSelectedSheetId(s[0].id);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedSheetId) return;
    const rowIds = allRows.filter(r => r.sheet_id === selectedSheetId).map(r => r.id);
    if (rowIds.length === 0) { setAllCells(prev => prev.filter(c => !rowIds.includes(c.row_id))); return; }
    supabase.from('sheet_cells').select('*').in('row_id', rowIds).then(({ data }) => {
      if (!data) return;
      setAllCells(prev => [...prev.filter(c => !rowIds.includes(c.row_id)), ...(data as SheetCell[])]);
    });
  }, [selectedSheetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => allColumns.filter(c => c.sheet_id === selectedSheetId), [allColumns, selectedSheetId]);
  const rows = useMemo(() => allRows.filter(r => r.sheet_id === selectedSheetId), [allRows, selectedSheetId]);
  const cells = useMemo(() => {
    const ids = new Set(rows.map(r => r.id));
    return allCells.filter(c => ids.has(c.row_id));
  }, [allCells, rows]);

  const assignPlayer = useCallback(async (rowId: number, playerName: string, playerClass: string | null) => {
    setAllRows(prev => prev.map(r => r.id === rowId ? { ...r, player_name: playerName, player_class: playerClass } : r));
    await supabase.from('sheet_rows').update({ player_name: playerName, player_class: playerClass }).eq('id', rowId);
  }, []);

  const clearPlayer = useCallback(async (rowId: number) => {
    setAllRows(prev => prev.map(r => r.id === rowId ? { ...r, player_name: null, player_class: null } : r));
    await supabase.from('sheet_rows').update({ player_name: null, player_class: null }).eq('id', rowId);
  }, []);

  const setCell = useCallback(async (
    rowId: number, columnId: number,
    value: { ref_row_id: number } | { text_value: string } | null
  ) => {
    const update = value === null
      ? { ref_row_id: null, text_value: null }
      : 'ref_row_id' in value
        ? { ref_row_id: value.ref_row_id, text_value: null }
        : { ref_row_id: null, text_value: value.text_value || null };
    setAllCells(prev => {
      const exists = prev.find(c => c.row_id === rowId && c.column_id === columnId);
      if (exists) return prev.map(c => c.row_id === rowId && c.column_id === columnId ? { ...c, ...update } : c);
      return [...prev, { id: Date.now(), row_id: rowId, column_id: columnId, ...update }];
    });
    await supabase.from('sheet_cells').upsert({ row_id: rowId, column_id: columnId, ...update }, { onConflict: 'row_id,column_id' });
  }, []);

  const importComp = useCallback((json: string, sheetId: number, currentRows: SheetRow[]): CompPlayer[] | string => {
    let parsed: any;
    try { parsed = JSON.parse(json); } catch { return 'Invalid JSON'; }
    const players: CompPlayer[] = (parsed.slots ?? []).map((s: any) => ({
      name: s.name, className: s.className, specName: s.specName,
      groupNumber: s.groupNumber, slotNumber: s.slotNumber,
      color: s.color ?? '#9ca3af',
    }));
    const compNames = new Set(players.map(p => p.name.toLowerCase()));
    const toClear = currentRows.filter(r => r.sheet_id === sheetId && r.player_name && !compNames.has(r.player_name.toLowerCase()));
    toClear.forEach(r => supabase.from('sheet_rows').update({ player_name: null, player_class: null }).eq('id', r.id));
    setAllRows(prev => prev.map(r => toClear.find(c => c.id === r.id) ? { ...r, player_name: null, player_class: null } : r));
    return players;
  }, []);

  const uploadImage = useCallback(async (columnId: number, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `boss-images/${columnId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('raid-assignments').upload(path, file, { upsert: true });
    if (error) return error.message;
    const { data: { publicUrl } } = supabase.storage.from('raid-assignments').getPublicUrl(path);
    setAllColumns(prev => prev.map(c => c.id === columnId ? { ...c, image_path: publicUrl } : c));
    await supabase.from('sheet_columns').update({ image_path: publicUrl }).eq('id', columnId);
    return null;
  }, []);

  const removeImage = useCallback(async (columnId: number) => {
    setAllColumns(prev => prev.map(c => c.id === columnId ? { ...c, image_path: null } : c));
    await supabase.from('sheet_columns').update({ image_path: null }).eq('id', columnId);
  }, []);

  const addRow = useCallback(async (section: string, label: string) => {
    if (!selectedSheetId) return;
    const sectionRows = allRows.filter(r => r.sheet_id === selectedSheetId && r.section === section);
    const maxOrder = sectionRows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { data } = await supabase.from('sheet_rows')
      .insert({ sheet_id: selectedSheetId, section, label, sort_order: maxOrder + 1 })
      .select().single();
    if (data) setAllRows(prev => [...prev, data as SheetRow]);
  }, [selectedSheetId, allRows]);

  const deleteRow = useCallback(async (rowId: number) => {
    setAllRows(prev => prev.filter(r => r.id !== rowId));
    setAllCells(prev => prev.filter(c => c.row_id !== rowId));
    await supabase.from('sheet_rows').delete().eq('id', rowId);
  }, []);

  return {
    sheets, columns, rows, cells, loading,
    selectedSheetId, setSelectedSheetId,
    assignPlayer, clearPlayer, setCell,
    importComp, uploadImage, removeImage,
    addRow, deleteRow,
  };
}
