export interface TBCPhase {
  id: number;
  label: string;
  raids: string[];
}

export const TBC_PHASES: TBCPhase[] = [
  {
    id: 1,
    label: 'Phase 1',
    raids: ["Karazhan", "Gruul's Lair", "Magtheridon's Lair"],
  },
  {
    id: 2,
    label: 'Phase 2',
    raids: ['Serpentshrine Cavern', 'Tempest Keep'],
  },
  {
    id: 3,
    label: 'Phase 3',
    raids: ['Mount Hyjal', 'Black Temple'],
  },
  {
    id: 4,
    label: 'Phase 4',
    raids: ["Zul'Aman"],
  },
  {
    id: 5,
    label: 'Phase 5',
    raids: ['Sunwell Plateau'],
  },
];

// Explicit boss order per instance. Bosses not listed fall to the end alphabetically.
const BOSS_ORDER: Record<string, string[]> = {
  "Karazhan": [
    'Attumen the Huntsman',
    'Moroes',
    'Maiden of Virtue',
    'Opera Event',
    'The Curator',
    'Terestian Illhoof',
    'Shade of Aran',
    'Netherspite',
    'Chess Event',
    'Prince Malchezaar',
    'Nightbane',
    'Recipes',
    'Trash',
  ],
  "Gruul's Lair": [
    'High King Maulgar',
    'Gruul the Dragonkiller',
    'Recipes',
    'Trash',
  ],
  "Magtheridon's Lair": [
    'Magtheridon',
    'Recipes',
    'Trash',
  ],
  "Serpentshrine Cavern": [
    'Hydross the Unstable',
    'The Lurker Below',
    'Leotheras the Blind',
    'Fathom-Lord Karathress',
    'Morogrim Tidewalker',
    'Lady Vashj',
    'Recipes',
    'Trash',
  ],
  "Tempest Keep": [
    "Al'ar",
    'Void Reaver',
    'High Astromancer Solarian',
    "Kael'thas Sunstrider",
    'Trash',
    'Recipes',
  ],
  "Mount Hyjal": [
    'Rage Winterchill',
    'Anetheron',
    "Kaz'rogal",
    'Azgalor',
    'Archimonde',
    'Recipes',
    'Trash',
  ],
  "Black Temple": [
    'High Warlord Naj\'entus',
    'Supremus',
    'Shade of Akama',
    'Teron Gorefiend',
    'Gurtogg Bloodboil',
    'Reliquary of Souls',
    'Mother Shahraz',
    'The Illidari Council',
    "Illidan Stormrage",
    'Recipes',
    'Trash',
  ],
  "Zul'Aman": [
    'Nalorakk',
    'Akil\'zon',
    'Jan\'alai',
    'Halazzi',
    'Hex Lord Malacrass',
    'Zul\'jin',
    'Recipes',
    'Trash',
  ],
  "Sunwell Plateau": [
    'Kalecgos',
    'Brutallus',
    'Felmyst',
    "Eredar Twins",
    "M'uru",
    "Kil'jaeden",
    'Recipes',
    'Trash',
  ],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[''`´]/g, "'");
}

export function sortBosses(instanceName: string, bosses: string[]): string[] {
  const order = BOSS_ORDER[instanceName];
  if (!order) return [...bosses].sort();

  return [...bosses].sort((a, b) => {
    const ai = order.findIndex((o) => normalize(o) === normalize(a));
    const bi = order.findIndex((o) => normalize(o) === normalize(b));
    const aIdx = ai === -1 ? 9999 : ai;
    const bIdx = bi === -1 ? 9999 : bi;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.localeCompare(b);
  });
}

export function getPhaseForInstance(instanceName: string): number {
  for (const phase of TBC_PHASES) {
    for (const raid of phase.raids) {
      if (instanceName.toLowerCase().includes(raid.toLowerCase()) ||
          raid.toLowerCase().includes(instanceName.toLowerCase())) {
        return phase.id;
      }
    }
  }
  return 0;
}
