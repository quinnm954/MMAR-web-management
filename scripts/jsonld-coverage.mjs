#!/usr/bin/env node
/**
 * Route-by-route JSON-LD coverage report.
 *
 * Walks dist/**\/index.html, extracts every JSON-LD block (including @graph
 * entries), and prints a table showing which rich-result types each route
 * exposes. Also prints aggregate counts at the bottom.
 *
 * Usage:  node scripts/jsonld-coverage.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

if (!existsSync(DIST)) {
  console.error("[coverage] dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const TRACKED = [
  { key: "Breadcrumb", types: ["BreadcrumbList"] },
  { key: "FAQ", types: ["FAQPage"] },
  { key: "Article", types: ["Article", "NewsArticle", "BlogPosting"] },
  {
    key: "LocalBiz",
    types: ["LocalBusiness", "AutoRepair", "AutomotiveBusiness"],
  },
  { key: "Service", types: ["Service"] },
  { key: "Blog", types: ["Blog"] },
  { key: "Org", types: ["Organization"] },
  { key: "WebSite", types: ["WebSite"] },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (name === "index.html") yield p;
  }
}

const LD_RE =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function collectTypes(node, out) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  const t = node["@type"];
  if (t) (Array.isArray(t) ? t : [t]).forEach((x) => out.add(x));
  if (Array.isArray(node["@graph"]))
    node["@graph"].forEach((n) => collectTypes(n, out));
}

const rows = [];
const totals = Object.fromEntries(TRACKED.map((t) => [t.key, 0]));
let parseErrors = 0;

for (const file of walk(DIST)) {
  const route =
    "/" +
    relative(DIST, file)
      .replace(/index\.html$/, "")
      .replace(/\\/g, "/")
      .replace(/\/$/, "");
  const display = route === "/" || route === "" ? "/" : route;

  const html = readFileSync(file, "utf8");
  const found = new Set();
  let m;
  LD_RE.lastIndex = 0;
  while ((m = LD_RE.exec(html))) {
    try {
      collectTypes(JSON.parse(m[1].trim()), found);
    } catch {
      parseErrors++;
    }
  }

  const flags = TRACKED.map((t) => {
    const has = t.types.some((tt) => found.has(tt));
    if (has) totals[t.key]++;
    return has;
  });
  rows.push({ route: display, flags, raw: [...found].sort() });
}

rows.sort((a, b) => a.route.localeCompare(b.route));

// -------- print table --------
const ROUTE_W = Math.max(
  20,
  Math.min(60, rows.reduce((m, r) => Math.max(m, r.route.length), 0))
);
const COL_W = TRACKED.map((t) => Math.max(t.key.length, 3));

const pad = (s, w) => (s + " ".repeat(w)).slice(0, w);
const cell = (v, w) => pad(v ? "  ✓" : "  ·", w);

const header =
  pad("Route", ROUTE_W) +
  "  " +
  TRACKED.map((t, i) => pad(t.key, COL_W[i])).join("  ");
const sep = "-".repeat(header.length);

console.log("\nJSON-LD coverage by route\n");
console.log(header);
console.log(sep);
for (const r of rows) {
  console.log(
    pad(r.route, ROUTE_W) +
      "  " +
      r.flags.map((f, i) => cell(f, COL_W[i])).join("  ")
  );
}
console.log(sep);
console.log(
  pad(`TOTAL (${rows.length})`, ROUTE_W) +
    "  " +
    TRACKED.map((t, i) => pad(String(totals[t.key]), COL_W[i])).join("  ")
);

// missing-coverage flags
const missingBreadcrumb = rows.filter((r) => !r.flags[0]).map((r) => r.route);
const missingLocalBiz = rows.filter((r) => !r.flags[3]).map((r) => r.route);

if (missingBreadcrumb.length || missingLocalBiz.length) {
  console.log("\nGaps:");
  if (missingBreadcrumb.length)
    console.log(
      `  • ${missingBreadcrumb.length} route(s) missing BreadcrumbList: ${missingBreadcrumb.slice(0, 8).join(", ")}${missingBreadcrumb.length > 8 ? "…" : ""}`
    );
  if (missingLocalBiz.length)
    console.log(
      `  • ${missingLocalBiz.length} route(s) missing LocalBusiness/AutoRepair: ${missingLocalBiz.slice(0, 8).join(", ")}${missingLocalBiz.length > 8 ? "…" : ""}`
    );
}

if (parseErrors)
  console.log(
    `\n⚠️  ${parseErrors} JSON-LD block(s) failed to parse — run \`npm run validate:jsonld\` for details.`
  );

console.log();
