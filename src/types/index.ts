export type WoWClass =
  | 'Warrior'
  | 'Paladin'
  | 'Hunter'
  | 'Rogue'
  | 'Priest'
  | 'Shaman'
  | 'Mage'
  | 'Warlock'
  | 'Druid';

export interface LootEntry {
  id: string;
  timestamp: string;
  player_name: string;
  player_class: WoWClass | null;
  item_name: string;
  item_id: number | null;
  boss: string;
  raid: string;
  response: string;
  votes: number;
  awarded_by: string;
  notes: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  player_class: WoWClass | null;
  rank: string | null;
  notes: string | null;
  created_at: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface CouncilNote {
  id: string;
  player_name: string;
  item_name: string;
  priority: Priority;
  notes: string | null;
  created_at: string;
}

export type UserRole = 'council' | 'raider';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface RaidLoot {
  id: string;
  instance_name: string;
  boss_name: string;
  item_id: number | null;
  item_name: string;
  item_slug: string | null;
  wowhead_url: string | null;
}

export interface LootCandidate {
  id: string;
  raid_loot_id: string;
  player_name: string;
  priority: number;
  note: string | null;
  created_at: string;
}

export interface CSVRow {
  date: string;
  player: string;
  realm: string;
  response: string;
  votes: string;
  class: string;
  instance: string;
  boss: string;
  reason: string;
  note: string;
  item: string;
  itemID: string;
  [key: string]: string;
}
