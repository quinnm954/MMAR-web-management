import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Item = { to: string; end?: boolean };

/**
 * Lets phone users swipe left/right anywhere in the page to move between
 * primary bottom-nav tabs. Ignored on horizontally scrollable elements,
 * form fields, and short/diagonal swipes so it doesn't fight existing UI.
 *
 * Disabled on screens >= lg, matching the bottom nav itself.
 */
export function useSwipeTabNav(items: Item[]) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length < 2) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    let startX = 0;
    let startY = 0;
    let startTarget: EventTarget | null = null;
    let tracking = false;

    const isInteractive = (el: Element | null): boolean => {
      while (el) {
        const tag = el.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          tag === "BUTTON"
        )
          return true;
        if ((el as HTMLElement).isContentEditable) return true;
        // skip if inside a horizontally scrollable container
        const style = window.getComputedStyle(el);
        const ox = style.overflowX;
        if (
          (ox === "auto" || ox === "scroll") &&
          el.scrollWidth > el.clientWidth + 4
        )
          return true;
        // common Radix/shadcn primitives we shouldn't intercept
        if (el.getAttribute?.("role") === "dialog") return true;
        if (el.getAttribute?.("data-radix-scroll-area-viewport") !== null) return true;
        el = el.parentElement;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTarget = e.target;
      tracking = !isInteractive(e.target as Element);
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      // require a clearly horizontal swipe
      if (ax < 70 || ay > 50 || ax < ay * 2) return;
      // edge swipes are reserved for native back gestures on iOS
      if (startX < 24 || startX > window.innerWidth - 24) return;

      const idx = items.findIndex((i) =>
        i.end ? location.pathname === i.to : location.pathname.startsWith(i.to),
      );
      if (idx === -1) return;
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= items.length) return;
      navigate(items[nextIdx].to);
      void startTarget; // silence unused
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [items, location.pathname, navigate]);
}
