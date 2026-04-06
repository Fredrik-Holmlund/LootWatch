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
    raids: ['Serpentshrine Cavern', "Tempest Keep"],
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
