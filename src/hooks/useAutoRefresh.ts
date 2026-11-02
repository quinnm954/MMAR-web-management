import { useEffect } from "react";

const INTERVAL_MS = 30_000;
const RETRY_MS = 5_000;
const SCROLL_KEY = (url: string) => `ga-scroll:${url}`;
export const AUTO_REFRESH_EVENT = "ga-auto-refresh";

/** Mark whether a phone call is active; reloads wait while it is. */
export function setCallActive(active: boolean) {
  (window as any).__gaCallActive = active;
}

function hasUnsavedText() {
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("textarea, input[type=text], input:not([type])");
  for (const f of Array.from(fields)) if (f.value !== f.defaultValue) return true;
  return false;
}

export function isSafeToReload() {
  if (document.hidden) return false;
  if (document.querySelector('[data-auto-refresh-blocked="true"]')) return false;
  if ((window as any).__gaCallActive) return false;
  const a = document.activeElement as HTMLElement | null;
  if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable)) return false;
  if (document.querySelector('[role="dialog"], [role="alertdialog"], [data-state="open"][role="menu"]')) return false;
  if (hasUnsavedText()) return false;
  return true;
}

/** Reload the whole app every 30s and right after a new notification, only when safe. */
export function useAutoRefresh() {
  useEffect(() => {
    // Restore scroll after a previous auto-reload.
    const key = SCROLL_KEY(location.pathname + location.search);
    const saved = sessionStorage.getItem(key);
    if (saved) {
      sessionStorage.removeItem(key);
      const y = Number(saved);
      setTimeout(() => window.scrollTo(0, y), 600);
    }

    let pending = false;
    let lastScrollAt = 0;
    let touching = false;
    const onScroll = () => { lastScrollAt = Date.now(); };
    const onTouchStart = () => { touching = true; onScroll(); };
    const onTouchEnd = () => { touching = false; onScroll(); };
    let retry: ReturnType<typeof setTimeout> | null = null;
    const attempt = () => {
      if (retry) { clearTimeout(retry); retry = null; }
      if (touching && Date.now() - lastScrollAt > 30_000) touching = false;
      if (!touching && Date.now() - lastScrollAt >= 15_000 && isSafeToReload()) {
        try { sessionStorage.setItem(SCROLL_KEY(location.pathname + location.search), String(window.scrollY)); } catch {}
        window.location.reload();
        return;
      }
      pending = true;
      if (!document.hidden) retry = setTimeout(attempt, RETRY_MS);
    };
    const interval = setInterval(attempt, INTERVAL_MS);
    const onNotify = () => attempt();
    const onVis = () => { if (!document.hidden && pending) attempt(); };
    const onSw = (e: MessageEvent) => {
      if (e.data?.type === "push-received" || e.data?.type === "badge-refresh") attempt();
    };
    window.addEventListener(AUTO_REFRESH_EVENT, onNotify);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('wheel', onScroll, { passive: true });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    navigator.serviceWorker?.addEventListener?.("message", onSw);
    return () => {
      clearInterval(interval);
      if (retry) clearTimeout(retry);
      window.removeEventListener(AUTO_REFRESH_EVENT, onNotify);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('wheel', onScroll);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker?.removeEventListener?.("message", onSw);
    };
  }, []);
}
