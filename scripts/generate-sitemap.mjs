// Auto-generates public/sitemap.xml, public/sitemap-locations.xml,
// public/sitemap-blog.xml and public/sitemap-index.xml from the route
// data files. Runs in `prebuild` so the sitemap can never drift from
// the actual routes.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE = "https://mikesmautorepair.com";
const today = new Date().toISOString().slice(0, 10);

const read = (p) => readFileSync(resolve(ROOT, p), "utf8");

const matchAll = (src, re) => [...src.matchAll(re)].map((m) => m[1]);

// --- Extract dynamic data ---
const cities = matchAll(read("src/data/cities.ts"), /^\s*slug:\s*"([^"]+)"/gm);
const categories = matchAll(
  read("src/data/serviceCategories.ts"),
  /^\s*id:\s*"([^"]+)"/gm
);

const landingSrc = read("src/data/localLandingPages.ts");
// Each entry has slug + optional canonical
const landingEntries = [];
const slugRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?(?:canonical:\s*"([^"]+)"[\s\S]*?)?(?:\n\s{2}\}|\n\s{4}\},)/g;
// Simpler: pull every slug + every canonical separately, then dedupe canonicals
const allLandingSlugs = matchAll(landingSrc, /^\s{4}slug:\s*"([^"]+)"/gm);
const allCanonicals = matchAll(landingSrc, /^\s{4}canonical:\s*"([^"]+)"/gm);
const canonicalSlugs = new Set(
  allCanonicals.map((u) => u.replace(`${SITE}/`, ""))
);
// A landing page should appear in the sitemap once, at its canonical slug
// when one is set, otherwise at its own slug. Slugs that are *only* used as
// duplicates pointing at a canonical are excluded.
const landingSlugs = new Set();
for (const slug of allLandingSlugs) landingSlugs.add(slug);
// Drop slugs that have a canonical pointing somewhere else
const landingSrcLines = landingSrc.split("\n");
for (let i = 0; i < landingSrcLines.length; i++) {
  const m = landingSrcLines[i].match(/^\s{4}slug:\s*"([^"]+)"/);
  if (!m) continue;
  // look ahead a few lines for a canonical
  for (let j = i + 1; j < Math.min(i + 25, landingSrcLines.length); j++) {
    if (/^\s{2}\},?$/.test(landingSrcLines[j])) break;
    const c = landingSrcLines[j].match(/^\s{4}canonical:\s*"([^"]+)"/);
    if (c) {
      const canonSlug = c[1].replace(`${SITE}/`, "");
      if (canonSlug !== m[1]) landingSlugs.delete(m[1]);
      break;
    }
  }
}
// Also include any canonical-only slugs (the canonical may not be a defined entry)
for (const s of canonicalSlugs) landingSlugs.add(s);

const blogSrc = read("src/data/blogPosts.ts");
const blogPosts = [];
{
  const re = /slug:\s*"([^"]+)"[\s\S]*?dateISO:\s*"([^"]+)"[\s\S]*?tags:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(blogSrc))) {
    const tags = matchAll(m[3], /"([^"]+)"/g).map((t) =>
      t.toLowerCase().replace(/\s+/g, "-")
    );
    blogPosts.push({ slug: m[1], dateISO: m[2], tags });
  }
}
const blogTags = new Set();
for (const p of blogPosts) for (const t of p.tags) blogTags.add(t);

// --- URL helpers ---
const urlEntry = ({ loc, lastmod = today, changefreq = "monthly", priority = "0.7" }) =>
  `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

const wrap = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

// --- Main pages sitemap ---
const mainEntries = [
  urlEntry({ loc: `${SITE}/`, changefreq: "weekly", priority: "1.0" }),
  urlEntry({ loc: `${SITE}/about`, priority: "0.7" }),
  urlEntry({ loc: `${SITE}/services`, priority: "0.9" }),
  urlEntry({ loc: `${SITE}/service-areas`, priority: "0.9" }),
  urlEntry({ loc: `${SITE}/reviews`, priority: "0.6" }),
  urlEntry({ loc: `${SITE}/contact`, priority: "0.7" }),
  urlEntry({ loc: `${SITE}/warranty-policy`, changefreq: "yearly", priority: "0.3" }),
  ...categories.map((id) =>
    urlEntry({ loc: `${SITE}/services/${id}`, priority: "0.8" })
  ),
];

// --- Locations / landing-page sitemap ---
const locationEntries = [
  ...cities.map((slug) =>
    urlEntry({ loc: `${SITE}/areas/${slug}`, priority: "0.9" })
  ),
  ...[...landingSlugs]
    .sort()
    .map((slug) => urlEntry({ loc: `${SITE}/${slug}`, priority: "0.95" })),
];

// --- Blog sitemap ---
const blogEntries = [
  urlEntry({ loc: `${SITE}/blog`, changefreq: "weekly", priority: "0.7" }),
  ...blogPosts.map((p) =>
    urlEntry({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.dateISO, priority: "0.6" })
  ),
  ...[...blogTags]
    .sort()
    .map((t) => urlEntry({ loc: `${SITE}/blog/tag/${t}`, priority: "0.5" })),
];

writeFileSync(resolve(ROOT, "public/sitemap.xml"), wrap(mainEntries));
writeFileSync(resolve(ROOT, "public/sitemap-locations.xml"), wrap(locationEntries));
writeFileSync(resolve(ROOT, "public/sitemap-blog.xml"), wrap(blogEntries));

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${SITE}/sitemap-locations.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${SITE}/sitemap-blog.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>
`;
writeFileSync(resolve(ROOT, "public/sitemap-index.xml"), indexXml);

console.log(
  `Sitemaps written: ${mainEntries.length} main, ${locationEntries.length} locations, ${blogEntries.length} blog.`
);
