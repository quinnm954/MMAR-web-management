import { localLandingPages } from "./localLandingPages";
import { cities } from "./cities";
import { southFloridaCities } from "./citiesSouthFlorida";
import { categories } from "./serviceCategories";
import { legacyRedirect } from "@/lib/legacyRedirects";

const LIVE = new Set<string>([
  "/",
  "/services",
  "/service-areas",
  "/mmar-care",
  ...localLandingPages.map((p) => `/${p.slug}`),
  ...cities.map((c) => `/areas/${c.slug}`),
  ...southFloridaCities.map((c) => `/areas/${c.slug}`),
  ...categories.map((c) => `/services/${c.id}`),
]);

export const isLivePath = (p: string) => LIVE.has(p);
export const redirectForOldPath = (p: string) => legacyRedirect(p, isLivePath);
