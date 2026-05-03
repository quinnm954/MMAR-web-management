#!/usr/bin/env node
// Fails the build if forbidden location terms reappear anywhere in the repo.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const FORBIDDEN = [/south\s*carolina/i, /greenville/i, /spartanburg/i];
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".cache",
  ".lovable", "coverage", ".vite",
]);
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".pdf", ".mp4", ".mov", ".woff", ".woff2", ".ttf", ".otf",
  ".lock", ".map",
]);
const SELF = "scripts/check-forbidden-terms.mjs";

const root = process.cwd();
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = full.slice(root.length + 1);
    if (rel === SELF) continue;
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full);
    } else {
      if (SKIP_EXT.has(extname(name).toLowerCase())) continue;
      if (st.size > 2_000_000) continue;
      let content;
      try { content = readFileSync(full, "utf8"); } catch { continue; }
      content.split(/\r?\n/).forEach((line, i) => {
        for (const re of FORBIDDEN) {
          if (re.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

walk(root);

if (hits.length) {
  console.error("\n❌ Forbidden location terms found:\n");
  for (const h of hits) console.error("  " + h);
  console.error(`\nTotal: ${hits.length} occurrence(s). Remove them before building.\n`);
  process.exit(1);
}
console.log("✅ No forbidden location terms found.");
