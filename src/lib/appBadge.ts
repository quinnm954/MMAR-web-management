// PWA App Badging API helpers. No-op on unsupported browsers.
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
//
// Platform notes:
// - iOS 16.4+ requires the PWA to be installed to the Home Screen AND to have
//   Notifications permission granted before setAppBadge takes effect.
// - Desktop Chrome/Edge and Android Chrome only need the PWA installed.
// - In a regular browser tab (not installed), setAppBadge silently no-ops.

const isStandalone = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
    // iOS legacy signal
    return (window.navigator as any).standalone === true;
  } catch {
    return false;
  }
};

/** Request notification permission — required by iOS for App Badging. */
export async function ensureBadgePermission(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!isStandalone()) return; // only prompt inside the installed PWA
    const N: any = (window as any).Notification;
    if (N.permission === "default" && typeof N.requestPermission === "function") {
      await N.requestPermission();
    }
  } catch {
    // ignore
  }
}

export function setAppBadge(count: number) {
  try {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (!nav) return;
    if (count > 0 && typeof nav.setAppBadge === "function") {
      nav.setAppBadge(count).catch((err: unknown) => {
        console.debug("[appBadge] setAppBadge failed", err);
      });
    } else if (typeof nav.clearAppBadge === "function") {
      nav.clearAppBadge().catch(() => {});
    } else {
      console.debug("[appBadge] Badging API not supported on this browser");
    }
  } catch (err) {
    console.debug("[appBadge] setAppBadge threw", err);
  }
}

export function clearAppBadge() {
  try {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav && typeof nav.clearAppBadge === "function") {
      nav.clearAppBadge().catch(() => {});
    }
  } catch {
    // ignore
  }
}
