import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_IDS = ["AW-17463969717", "AW-18160507059"];

/**
 * Fires a page_view to all configured Google tags on every SPA route change.
 * The base gtag.js script is loaded once in index.html (so it's present on
 * every page), but SPA navigations don't reload the page — this ensures
 * Google sees a hit for every route.
 */
export const GtagRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;
    const page_path = location.pathname + location.search;
    GA_IDS.forEach((id) => {
      w.gtag!("config", id, { page_path });
    });
  }, [location.pathname, location.search]);

  return null;
};

export default GtagRouteTracker;
