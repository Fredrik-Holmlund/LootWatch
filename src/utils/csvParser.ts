import type { LootEntry, WoWClass } from '../types';
import { WOW_CLASSES } from './classColors';

/**
 * Parses an RCLootCouncil CSV export into LootEntry objects.
 *
 * RCLootCouncil TBC export columns (may vary by version):
 *   date, player, realm, response, votes, class, instance, boss,
 *   reason, note, item, itemID
 *
 * Also handles the expanded format used by some versions:
 *   Date, Player, Realm, Received, Specialism, iLvl, Offspecc, Note,
 *   Response, Votes, Class, Instance, Boss, DifficultyID, mapID,
 *   groupSize, gear1, gear2, responseID, isAwardReason
 */

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

function normalizeTimestamp(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Try ISO first
  const iso = Date.parse(dateStr);
  if (!isNaN(iso)) return new Date(iso).toISOString();
  // Try d/m/y h:m:s
  const parts = dateStr.match(/(\d+)[\/\-](\d+)[\/\-](\d+)\s*(\d+):(\d+)/);
  if (parts) {
    const [, d, m, y, h, min] = parts;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00`).toISOString();
  }
  return new Date().toISOString();
}

export interface ParseResult {
  entries: Omit<LootEntry, 'id' | 'created_at'>[];
  errors: string[];
}

export function parseRCLootCouncilCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { entries: [], errors: ['CSV file is empty or has no data rows.'] };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  // Map normalized header names to column indices
  const col = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colDate     = col(['date']);
  const colPlayer   = col(['player']);
  const colResponse = col(['response']);
  const colVotes    = col(['votes']);
  const colClass    = col(['class']);
  const colInstance = col(['instance']);
  const colBoss     = col(['boss']);
  const colNote     = col(['note', 'notes']);
  const colItem     = col(['item', 'received']);
  const colItemID   = col(['itemid']);
  const colReason   = col(['reason', 'isawardreason']);
  const colAwardedBy = col(['awardedby', 'awardby']);

  const entries: Omit<LootEntry, 'id' | 'created_at'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '') : '');

    const playerName = get(colPlayer);
    const itemName   = get(colItem);

    if (!playerName || !itemName) {
      errors.push(`Row ${i + 1}: missing player or item name — skipped.`);
      continue;
    }

    entries.push({
      timestamp:    normalizeTimestamp(get(colDate)),
      player_name:  playerName,
      player_class: normalizeClass(get(colClass)),
      item_name:    itemName,
      item_id:      get(colItemID) ? parseInt(get(colItemID), 10) : null,
      boss:         get(colBoss) || 'Unknown',
      raid:         get(colInstance) || 'Unknown',
      response:     get(colResponse) || get(colReason) || '',
      votes:        parseInt(get(colVotes), 10) || 0,
      awarded_by:   get(colAwardedBy) || '',
      notes:        get(colNote) || null,
    });
  }

  return { entries, errors };
}
