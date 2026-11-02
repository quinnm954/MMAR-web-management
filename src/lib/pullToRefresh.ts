/** Nested scrolling belongs to its list or conversation, never page refresh. */
export function canStartPullToRefresh(target: EventTarget | null, pageScrollY: number) {
  if (pageScrollY > 0 || !(target instanceof Element)) return false;
  if (target.closest('[data-auto-refresh-blocked="true"]')) return false;
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if (/(auto|scroll)/.test(overflow) && el.scrollHeight > el.clientHeight) return false;
  }
  return true;
}