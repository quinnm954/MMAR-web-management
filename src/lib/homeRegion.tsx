import { createContext, useContext } from "react";
import type { RegionSlug } from "./regions";

// Which regional home page is rendering. Shared home sections read this so
// /south-florida reuses the exact home layout with only local copy swapped.
const HomeRegionContext = createContext<RegionSlug>("swfl");
export const HomeRegionProvider = HomeRegionContext.Provider;
export const useHomeRegion = () => useContext(HomeRegionContext);

// Short location phrases used across the shared home sections.
export const AREA_TEXT: Record<RegionSlug, { areas: string; areasCaps: string; areaShort: string }> = {
  swfl: { areas: "Lehigh Acres and Fort Myers", areasCaps: "LEHIGH ACRES & FORT MYERS", areaShort: "Southwest Florida" },
  sfl: { areas: "Broward and Palm Beach", areasCaps: "BROWARD & PALM BEACH", areaShort: "South Florida" },
};
export const useAreaText = () => AREA_TEXT[useHomeRegion()];
