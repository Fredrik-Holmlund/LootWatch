/** Strip the realm suffix (e.g. "-Spineshatter") from a character name. */
export function stripRealm(name: string): string {
  return name.replace(/-\S+$/, '').trim();
}
