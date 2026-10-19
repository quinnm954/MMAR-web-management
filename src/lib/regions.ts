// Website launch switch for the South Florida region (Broward & Palm Beach).
// The website is pre-rendered, so flipping this requires a publish. Garage Ace,
// the receptionist and booking use the `service_regions.active` flag instead.
export const SOUTH_FLORIDA_WEBSITE_LIVE = false;

export type RegionSlug = 'swfl' | 'sfl';
export const REGION_NAMES: Record<RegionSlug, string> = {
  swfl: 'Southwest Florida',
  sfl: 'South Florida',
};
