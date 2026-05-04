#!/usr/bin/env node
/**
 * Verify that every URL inside a route's JSON-LD points to the
 * production canonical base (https://mikesmautorepair.com) AND that
 * the route's "self" identifiers (canonical, og:url, mainEntityOfPage,
 * the trailing breadcrumb item, Article/Service `url`) match the
 * route's own canonical path.
 *
 * Exits non-zero on any mismatch — suitable for CI.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SITE = "https://mikesmautorepair.com";

if (!existsSync(DIST)) {
  console.error("[url-check] dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

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
const CANON_RE = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
const OG_URL_RE = /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i;

const ABS = /^https?:\/\//i;

// Allowlist of external domains that are legitimately referenced in JSON-LD
// (sameAs, image hosts, etc.). Mismatches against these are OK.
const EXTERNAL_OK = [
  "facebook.com",
  "tiktok.com",
  "yelp.com",
  "nextdoor.com",
  "iili.io",
  "storage.googleapis.com",
  "schema.org",
];

function isExternalOk(url) {
  try {
    const u = new URL(url);
    return EXTERNAL_OK.some((d) => u.hostname.endsWith(d));
  } catch {
    return false;
  }
}

// Recursively collect every string URL in a JSON-LD value, paired with
// the JSON path it was found at (so error messages are useful).
function collectUrls(node, path, out) {
  if (node == null) return;
  if (typeof node === "string") {
    if (ABS.test(node)) out.push({ url: node, path });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectUrls(v, `${path}[${i}]`, out));
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      collectUrls(v, path ? `${path}.${k}` : k, out);
    }
  }
}

// Pull out the "self URL" claims from TOP-LEVEL nodes only:
//   - any node's `url`
//   - mainEntityOfPage (string or { "@id": ... })
//   - the LAST BreadcrumbList item.item
// Nested entities (Blog.blogPost[*], Organization.logo, etc.) are skipped —
// they legitimately point to other URLs.
const SELF_TYPES = new Set([
  "Article",
  "NewsArticle",
  "BlogPosting",
  "Service",
  "WebPage",
  "BreadcrumbList",
]);

function collectSelfUrls(doc, out) {
  const topLevel = [];
  if (Array.isArray(doc)) topLevel.push(...doc);
  else if (doc && typeof doc === "object") {
    if (Array.isArray(doc["@graph"])) topLevel.push(...doc["@graph"]);
    else topLevel.push(doc);
  }

  for (const node of topLevel) {
    if (!node || typeof node !== "object") continue;
    const types = node["@type"]
      ? Array.isArray(node["@type"])
        ? node["@type"]
        : [node["@type"]]
      : [];
    const isSelfType = types.some((t) => SELF_TYPES.has(t));

    if (isSelfType && typeof node.url === "string" && ABS.test(node.url)) {
      out.push({ url: node.url, path: `${types[0]}.url` });
    }
    if (isSelfType && node.mainEntityOfPage) {
      const u =
        typeof node.mainEntityOfPage === "string"
          ? node.mainEntityOfPage
          : node.mainEntityOfPage["@id"];
      if (typeof u === "string" && ABS.test(u))
        out.push({ url: u, path: `${types[0]}.mainEntityOfPage` });
    }
    if (
      types.includes("BreadcrumbList") &&
      Array.isArray(node.itemListElement)
    ) {
      const last = node.itemListElement[node.itemListElement.length - 1];
      if (last) {
        const u =
          typeof last.item === "string" ? last.item : last.item?.["@id"];
        if (typeof u === "string" && ABS.test(u))
          out.push({ url: u, path: "BreadcrumbList.lastItem" });
      }
    }
  }
}

// Normalize: strip trailing slash (except root), strip query/hash for path
// comparison.
function normPath(u) {
  try {
    const x = new URL(u);
    let p = x.pathname.replace(/\/+$/, "");
    if (p === "") p = "/";
    return p;
  } catch {
    return u;
  }
}

function sameOrigin(u) {
  try {
    return new URL(u).origin === SITE;
  } catch {
    return false;
  }
}

let errors = 0;
let warnings = 0;
let routes = 0;
const failures = [];

for (const file of walk(DIST)) {
  const route =
    "/" +
    relative(DIST, file)
      .replace(/index\.html$/, "")
      .replace(/\\/g, "/")
      .replace(/\/$/, "");
  const display = route === "/" || route === "" ? "/" : route;
  routes++;

  const html = readFileSync(file, "utf8");
  const canonHref = html.match(CANON_RE)?.[1];
  const ogUrl = html.match(OG_URL_RE)?.[1];

  const expectedPath = display;

  const push = (level, msg) => {
    failures.push({ route: display, level, msg });
    if (level === "error") errors++;
    else warnings++;
  };

  // 1) <link rel=canonical> must match the route path AND be on SITE.
  if (!canonHref) {
    push("error", "missing <link rel=\"canonical\">");
  } else {
    if (!sameOrigin(canonHref))
      push("error", `canonical origin mismatch: ${canonHref}`);
    if (normPath(canonHref) !== expectedPath)
      push(
        "error",
        `canonical path mismatch: ${normPath(canonHref)} ≠ ${expectedPath}`
      );
  }

  // 2) og:url should match canonical when present.
  if (ogUrl && canonHref && ogUrl !== canonHref) {
    push("warn", `og:url ≠ canonical (${ogUrl} vs ${canonHref})`);
  }

  // 3) JSON-LD blocks
  let m;
  let blockIdx = 0;
  LD_RE.lastIndex = 0;
  while ((m = LD_RE.exec(html))) {
    blockIdx++;
    let parsed;
    try {
      parsed = JSON.parse(m[1].trim());
    } catch {
      // validate-jsonld script handles parse errors
      continue;
    }

    // 3a) every URL on our domain must use the canonical SITE origin
    // (no preview/published/dev hosts).
    const all = [];
    collectUrls(parsed, "", all);
    for (const { url, path } of all) {
      if (isExternalOk(url)) continue;
      try {
        const u = new URL(url);
        if (u.origin !== SITE)
          push(
            "error",
            `block #${blockIdx} ${path}: non-canonical origin "${u.origin}" — expected ${SITE}`
          );
      } catch {
        push("error", `block #${blockIdx} ${path}: invalid URL "${url}"`);
      }
    }

    // 3b) self URLs must point to THIS route's path.
    const selfs = [];
    collectSelfUrls(parsed, selfs);
    for (const { url, path } of selfs) {
      if (!sameOrigin(url)) continue; // already flagged above
      const got = normPath(url);
      if (got !== expectedPath) {
        push(
          "error",
          `block #${blockIdx} ${path}: ${got} ≠ route ${expectedPath}`
        );
      }
    }
  }
}

// -------- report --------
if (failures.length === 0) {
  console.log(`\n✅ JSON-LD URLs match canonical base on all ${routes} routes.`);
  process.exit(0);
}

const byRoute = new Map();
for (const f of failures) {
  if (!byRoute.has(f.route)) byRoute.set(f.route, []);
  byRoute.get(f.route).push(f);
}

for (const [route, items] of [...byRoute.entries()].sort()) {
  console.log(`\n${route}`);
  for (const it of items) {
    const tag = it.level === "error" ? "❌ ERROR" : "⚠️  WARN ";
    console.log(`  ${tag}  ${it.msg}`);
  }
}
console.log(
  `\n${routes} route(s) checked → ${errors} error(s), ${warnings} warning(s).`
);
process.exit(errors > 0 ? 1 : 0);
