// Build-time check: ensure every homepage "Popular Local Services" slug
// resolves to a real LocalLandingPage entry (no 404s).
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const homeSrc = readFileSync(
  resolve(root, "src/components/home/PopularLocalServices.tsx"),
  "utf8",
);
const dataJson = JSON.parse(
  readFileSync(resolve(root, ".prerender-data.json"), "utf8"),
);

const linkSlugs = [...homeSrc.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const knownSlugs = new Set(dataJson.landingPages.map((p) => p.slug));

const missing = linkSlugs.filter((s) => !knownSlugs.has(s));

console.log(
  `[check-home-links] ${linkSlugs.length} homepage service links found`,
);

if (missing.length) {
  console.error(
    `[check-home-links] ❌ ${missing.length} homepage link(s) resolve to nonexistent pages:`,
  );
  missing.forEach((s) => console.error(`   - /${s}`));
  process.exit(1);
}

console.log(
  `[check-home-links] ✅ all ${linkSlugs.length} homepage service links resolve`,
);
