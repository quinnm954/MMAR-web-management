// PWA App Badging API helpers. No-op on unsupported browsers.
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/Badging_API

export function setAppBadge(count: number) {
  try {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (!nav) return;
    if (count > 0 && typeof nav.setAppBadge === "function") {
      nav.setAppBadge(count).catch(() => {});
    } else if (typeof nav.clearAppBadge === "function") {
      nav.clearAppBadge().catch(() => {});
    }
  } catch {
    // ignore
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
