#!/usr/bin/env node
/**
 * Validate JSON-LD on every prerendered route against Google's
 * Rich Results requirements.
 *
 * Strategy:
 *  - Walk dist/ for every index.html (one per prerendered route).
 *  - Extract every <script type="application/ld+json"> block.
 *  - Parse JSON (catches trailing commas / syntax errors).
 *  - Run type-specific required-field checks based on Google's
 *    rich-result docs:
 *      https://developers.google.com/search/docs/appearance/structured-data
 *
 * Exits 1 if any errors are found (suitable for CI).
 * Warnings do not fail the build.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

if (!existsSync(DIST)) {
  console.error(
    "[validate-jsonld] dist/ not found. Run `npm run build` first."
  );
  process.exit(1);
}

// -------- file walker --------
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (name === "index.html") yield p;
  }
}

// -------- JSON-LD extraction --------
const LD_RE =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function extractBlocks(html) {
  const blocks = [];
  let m;
  while ((m = LD_RE.exec(html))) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

// -------- validators --------
const ABS_URL = /^https?:\/\//i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}
function getTypes(node) {
  if (!isObj(node)) return [];
  const t = node["@type"];
  if (!t) return [];
  return Array.isArray(t) ? t : [t];
}

function validateBreadcrumb(node, ctx) {
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    ctx.error("BreadcrumbList.itemListElement must be a non-empty array");
    return;
  }
  items.forEach((it, i) => {
    if (!isObj(it) || it["@type"] !== "ListItem")
      ctx.error(`BreadcrumbList[${i}] must be a ListItem`);
    if (typeof it.position !== "number")
      ctx.error(`BreadcrumbList[${i}].position must be a number`);
    if (!it.name) ctx.error(`BreadcrumbList[${i}].name is required`);
    const item = typeof it.item === "string" ? it.item : it.item?.["@id"];
    if (!item || !ABS_URL.test(item))
      ctx.error(`BreadcrumbList[${i}].item must be an absolute URL`);
  });
}

function validateFAQ(node, ctx) {
  const ents = node.mainEntity;
  if (!Array.isArray(ents) || ents.length === 0) {
    ctx.error("FAQPage.mainEntity must be a non-empty array");
    return;
  }
  ents.forEach((q, i) => {
    if (!isObj(q) || q["@type"] !== "Question")
      ctx.error(`FAQPage.mainEntity[${i}] must be a Question`);
    if (!q.name) ctx.error(`FAQPage.mainEntity[${i}].name required`);
    const a = q.acceptedAnswer;
    if (!isObj(a) || a["@type"] !== "Answer")
      ctx.error(`FAQPage.mainEntity[${i}].acceptedAnswer must be an Answer`);
    else if (!a.text)
      ctx.error(`FAQPage.mainEntity[${i}].acceptedAnswer.text required`);
  });
}

function validateArticle(node, ctx) {
  if (!node.headline) ctx.error("Article.headline required");
  else if (typeof node.headline === "string" && node.headline.length > 110)
    ctx.warn("Article.headline should be ≤110 chars (Google guideline)");
  if (!node.image) ctx.error("Article.image required");
  if (!node.datePublished || !ISO_DATE.test(node.datePublished))
    ctx.error("Article.datePublished must be an ISO 8601 date");
  if (node.dateModified && !ISO_DATE.test(node.dateModified))
    ctx.error("Article.dateModified must be ISO 8601");
  if (!node.author) ctx.error("Article.author required");
  else {
    const authors = Array.isArray(node.author) ? node.author : [node.author];
    authors.forEach((a, i) => {
      if (!isObj(a)) ctx.error(`Article.author[${i}] must be an object`);
      else if (!a.name) ctx.error(`Article.author[${i}].name required`);
    });
  }
  if (!node.publisher) ctx.warn("Article.publisher recommended");
  else if (!isObj(node.publisher) || !node.publisher.name)
    ctx.error("Article.publisher.name required");
}

function validateLocalBusiness(node, ctx) {
  if (!node.name) ctx.error("LocalBusiness.name required");
  if (!node.address) ctx.error("LocalBusiness.address required");
  else if (!isObj(node.address) || !node.address.addressLocality)
    ctx.error("LocalBusiness.address.addressLocality required");
  if (!node.telephone) ctx.warn("LocalBusiness.telephone recommended");
  if (node.aggregateRating) validateAggregateRating(node.aggregateRating, ctx);
  if (node.openingHoursSpecification) {
    const arr = Array.isArray(node.openingHoursSpecification)
      ? node.openingHoursSpecification
      : [node.openingHoursSpecification];
    arr.forEach((s, i) => {
      if (!s.dayOfWeek)
        ctx.error(`openingHoursSpecification[${i}].dayOfWeek required`);
      if (!s.opens || !s.closes)
        ctx.error(`openingHoursSpecification[${i}] needs opens & closes`);
    });
  }
}

function validateAggregateRating(ar, ctx) {
  if (!isObj(ar)) {
    ctx.error("aggregateRating must be an object");
    return;
  }
  if (ar.ratingValue == null) ctx.error("aggregateRating.ratingValue required");
  const count = ar.reviewCount ?? ar.ratingCount;
  if (count == null)
    ctx.error("aggregateRating needs reviewCount or ratingCount");
}

function validateService(node, ctx) {
  if (!node.name) ctx.error("Service.name required");
  if (node.aggregateRating && !node.review) {
    // Google flags Service with aggregateRating but no review data.
    ctx.error(
      "Service.aggregateRating without review data is rejected by Google"
    );
  }
}

function validateBlog(node, ctx) {
  if (Array.isArray(node.blogPost)) {
    node.blogPost.forEach((p, i) => {
      const sub = {
        error: (m) => ctx.error(`blogPost[${i}]: ${m}`),
        warn: (m) => ctx.warn(`blogPost[${i}]: ${m}`),
      };
      validateArticle(p, sub);
    });
  }
}

const TYPE_VALIDATORS = {
  BreadcrumbList: validateBreadcrumb,
  FAQPage: validateFAQ,
  Article: validateArticle,
  NewsArticle: validateArticle,
  BlogPosting: validateArticle,
  LocalBusiness: validateLocalBusiness,
  AutoRepair: validateLocalBusiness,
  AutomotiveBusiness: validateLocalBusiness,
  Service: validateService,
  Blog: validateBlog,
};

function validateNode(node, ctx) {
  if (!isObj(node)) return;
  for (const t of getTypes(node)) {
    const fn = TYPE_VALIDATORS[t];
    if (fn) fn(node, ctx);
  }
}

function validateDoc(doc, ctx) {
  if (Array.isArray(doc)) {
    doc.forEach((d) => validateDoc(d, ctx));
    return;
  }
  if (!isObj(doc)) return;
  if (Array.isArray(doc["@graph"])) {
    doc["@graph"].forEach((n) => validateNode(n, ctx));
  } else {
    validateNode(doc, ctx);
  }
}

// -------- run --------
let totalErrors = 0;
let totalWarnings = 0;
let totalRoutes = 0;
let totalBlocks = 0;
const failures = [];

for (const file of walk(DIST)) {
  const route =
    "/" +
    relative(DIST, file)
      .replace(/index\.html$/, "")
      .replace(/\\/g, "/")
      .replace(/\/$/, "");
  const display = route === "/" || route === "" ? "/" : route;
  totalRoutes++;

  const html = readFileSync(file, "utf8");
  const blocks = extractBlocks(html);
  if (blocks.length === 0) {
    failures.push({ route: display, msg: "no JSON-LD found", level: "warn" });
    totalWarnings++;
    continue;
  }

  const parsedBlocks = [];
  blocks.forEach((raw, i) => {
    totalBlocks++;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      failures.push({
        route: display,
        msg: `block #${i + 1}: invalid JSON — ${e.message}`,
        level: "error",
      });
      totalErrors++;
      return;
    }
    parsedBlocks.push(parsed);
    const ctx = {
      error: (m) => {
        failures.push({
          route: display,
          msg: `block #${i + 1}: ${m}`,
          level: "error",
        });
        totalErrors++;
      },
      warn: (m) => {
        failures.push({
          route: display,
          msg: `block #${i + 1}: ${m}`,
          level: "warn",
        });
        totalWarnings++;
      },
    };
    validateDoc(parsed, ctx);
  });

  // -------- cross-block checks --------
  // Google rejects pages where the same business entity is declared more
  // than once with different aggregateRatings ("Review has multiple
  // aggregate ratings"). Collect every business-like node across all
  // blocks on this page, key by a stable identity, and fail if more than
  // one rating is attached to the same business.
  const BUSINESS_TYPES = new Set([
    "LocalBusiness",
    "AutoRepair",
    "AutomotiveBusiness",
    "Organization",
    "Store",
  ]);
  const ratingsByKey = new Map(); // key -> Set of "rating|count"
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObj(node)) return;
    if (Array.isArray(node["@graph"])) node["@graph"].forEach(visit);
    const types = getTypes(node);
    const isBiz = types.some((t) => BUSINESS_TYPES.has(t));
    if (isBiz && isObj(node.aggregateRating)) {
      const key =
        node["@id"] ||
        `${(node.name || "").toLowerCase()}|${(node.url || "").toLowerCase()}`;
      const sig = `${node.aggregateRating.ratingValue ?? ""}|${
        node.aggregateRating.reviewCount ?? node.aggregateRating.ratingCount ?? ""
      }`;
      if (!ratingsByKey.has(key)) ratingsByKey.set(key, new Set());
      ratingsByKey.get(key).add(sig);
    }
    // recurse into nested values that may carry nodes
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") visit(v);
    }
  }
  parsedBlocks.forEach(visit);
  for (const [key, sigs] of ratingsByKey) {
    if (sigs.size > 1 || ratingsByKey.get(key).size > 0) {
      // Count duplicates by occurrence, not just distinct values.
    }
  }
  // Re-walk to count occurrences per key (not just distinct values).
  const occByKey = new Map();
  function countVisit(node) {
    if (Array.isArray(node)) return node.forEach(countVisit);
    if (!isObj(node)) return;
    if (Array.isArray(node["@graph"])) node["@graph"].forEach(countVisit);
    const types = getTypes(node);
    const isBiz = types.some((t) => BUSINESS_TYPES.has(t));
    if (isBiz && isObj(node.aggregateRating)) {
      const key =
        node["@id"] ||
        `${(node.name || "").toLowerCase()}|${(node.url || "").toLowerCase()}`;
      occByKey.set(key, (occByKey.get(key) || 0) + 1);
    }
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") countVisit(v);
    }
  }
  parsedBlocks.forEach(countVisit);
  for (const [key, count] of occByKey) {
    if (count > 1) {
      failures.push({
        route: display,
        msg: `business entity "${key}" has aggregateRating declared ${count} times across JSON-LD blocks (Google: "Review has multiple aggregate ratings")`,
        level: "error",
      });
      totalErrors++;
    }
  }
}

// -------- report --------
const byRoute = new Map();
for (const f of failures) {
  if (!byRoute.has(f.route)) byRoute.set(f.route, []);
  byRoute.get(f.route).push(f);
}

if (failures.length === 0) {
  console.log(
    `\n✅ JSON-LD valid on all ${totalRoutes} routes (${totalBlocks} blocks).`
  );
} else {
  for (const [route, items] of [...byRoute.entries()].sort()) {
    console.log(`\n${route}`);
    for (const it of items) {
      const tag = it.level === "error" ? "❌ ERROR" : "⚠️  WARN ";
      console.log(`  ${tag}  ${it.msg}`);
    }
  }
  console.log(
    `\nValidated ${totalRoutes} routes / ${totalBlocks} JSON-LD blocks → ` +
      `${totalErrors} error(s), ${totalWarnings} warning(s).`
  );
}

process.exit(totalErrors > 0 ? 1 : 0);
