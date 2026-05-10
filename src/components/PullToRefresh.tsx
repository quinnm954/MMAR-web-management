import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70; // px to trigger
const MAX_PULL = 120; // px max visual stretch

/**
 * Pull-to-refresh gesture for installed PWA / native app shells.
 * Disabled in the editor iframe and regular browser tabs to avoid
 * interfering with normal scroll.
 */
const PullToRefresh = () => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  // Only enable in standalone PWA, iOS home-screen, or Capacitor native shell
  useEffect(() => {
    const inIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    if (inIframe) return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari add-to-home-screen
      (window.navigator as any).standalone === true;
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

    setEnabled(isStandalone || isNative);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Resistance curve
      const resisted = Math.min(MAX_PULL, dy * 0.5);
      setPull(resisted);
    };

    const onTouchEnd = () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // Small delay so the spinner is visible
        setTimeout(() => window.location.reload(), 250);
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, pull, refreshing]);

  if (!enabled) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const visible = pull > 4 || refreshing;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] flex justify-center"
      style={{
        transform: `translateY(${Math.max(0, pull - 40)}px)`,
        opacity: visible ? 1 : 0,
        transition: active.current ? "none" : "transform 200ms ease, opacity 200ms ease",
      }}
    >
      <div
        className="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md"
        style={{ transform: `rotate(${progress * 270}deg)` }}
      >
        <RefreshCw
          className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
