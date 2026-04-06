import type { LootEntry, WoWClass } from '../types';
import { WOW_CLASSES } from './classColors';

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeClass(cls: string): WoWClass | null {
  const lower = cls.trim().toLowerCase();
  const match = WOW_CLASSES.find((c) => c.toLowerCase() === lower);
  return match ?? null;
}

function buildTimestamp(dateStr: string, timeStr: string): string {
  if (!dateStr) return new Date().toISOString();

  // Combine date + time if time column present
  const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;

  // Try ISO-ish parsing first (handles yyyy-mm-dd and yyyy/mm/dd with optional time)
  const normalized = combined.replace(/\//g, '-');
  const attempt = Date.parse(normalized);
  if (!isNaN(attempt)) return new Date(attempt).toISOString();

  // Try d/m/y h:m:s
  const parts = combined.match(/(\d+)[\/\-](\d+)[\/\-](\d+)\s*(\d+):(\d+)/);
  if (parts) {
    const [, d, m, y, h, min] = parts;
    return new Date(
      `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00`
    ).toISOString();
  }

  return new Date().toISOString();
}

function stripItemBrackets(name: string): string {
  return name.replace(/^\[|\]$/g, '').trim();
}

export interface ParseResult {
  entries: Omit<LootEntry, 'id' | 'created_at'>[];
  errors: string[];
}

export function parseRCLootCouncilCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { entries: [], errors: ['CSV is empty or has no data rows.'] };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const col = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colDate      = col(['date']);
  const colTime      = col(['time']);
  const colPlayer    = col(['player']);
  const colResponse  = col(['response']);
  const colVotes     = col(['votes']);
  const colClass     = col(['class']);
  const colInstance  = col(['instance']);
  const colBoss      = col(['boss']);
  const colNote      = col(['note', 'notes']);
  const colItem      = col(['item', 'received']);
  const colItemID    = col(['itemid']);
  const colAwardedBy = col(['owner', 'awardedby', 'awardby']);

  const entries: Omit<LootEntry, 'id' | 'created_at'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '') : '');

    const playerRaw = get(colPlayer);
    const itemRaw   = get(colItem);

    if (!playerRaw || !itemRaw) {
      errors.push(`Row ${i + 1}: missing player or item — skipped.`);
      continue;
    }

    entries.push({
      timestamp:    buildTimestamp(get(colDate), get(colTime)),
      player_name:  playerRaw,
      player_class: normalizeClass(get(colClass)),
      item_name:    stripItemBrackets(itemRaw),
      item_id:      get(colItemID) ? parseInt(get(colItemID), 10) : null,
      boss:         get(colBoss) || 'Unknown',
      raid:         get(colInstance) || 'Unknown',
      response:     get(colResponse) || '',
      votes:        parseInt(get(colVotes), 10) || 0,
      awarded_by:   get(colAwardedBy) || '',
      notes:        get(colNote) || null,
    });
  }

  return { entries, errors };
}
