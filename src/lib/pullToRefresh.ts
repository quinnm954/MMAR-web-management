/** Refresh only at the top of every scroll container, never inside blocked details. */
export function canStartPullToRefresh(target: EventTarget | null, pageScrollY: number) {
  if (pageScrollY > 0 || !(target instanceof Element)) return false;
  if (target.closest('[data-auto-refresh-blocked="true"]')) return false;
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if (/(auto|scroll)/.test(overflow) && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return false;
  }
  return true;
}