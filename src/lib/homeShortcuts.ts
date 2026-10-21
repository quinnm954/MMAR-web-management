// Orders home shortcuts by how often each page was opened; ties keep the default order.
export function orderShortcuts<T extends { value: string }>(items: T[], usage: Record<string, number>): T[] {
  return items
    .map((item, i) => ({ item, i, n: usage[item.value] || 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map(x => x.item);
}
