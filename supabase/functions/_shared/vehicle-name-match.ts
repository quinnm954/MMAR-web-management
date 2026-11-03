export const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let corner = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, corner + (a[i - 1] === b[j - 1] ? 0 : 1));
      corner = old;
    }
  }
  return prev[b.length];
}
export function closestNames(input: string, names: string[]) {
  const key = nameKey(input);
  return [...new Set(names)].map(name => ({ name, distance: distance(key, nameKey(name)) }))
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name)).slice(0, 5);
}