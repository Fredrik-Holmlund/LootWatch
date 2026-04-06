import type { WoWClass } from '../types';
import classData from '../data/classes.json';

export const CLASS_COLORS: Record<WoWClass, string> = classData.colors as Record<WoWClass, string>;

export function getClassColor(playerClass: WoWClass | string | null): string {
  if (!playerClass) return '#9ca3af';
  return CLASS_COLORS[playerClass as WoWClass] ?? '#9ca3af';
}

export function getClassTextStyle(playerClass: WoWClass | string | null): React.CSSProperties {
  return { color: getClassColor(playerClass) };
}

export const WOW_CLASSES: WoWClass[] = classData.classes as WoWClass[];
