// Post-build static prerender.
// For every known route, write dist/<route>/index.html with route-specific
// <title>, meta description, canonical, OG tags, and JSON-LD baked in.
// React still hydrates client-side; this just gives crawlers full SEO signals
// without requiring JS execution.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE = "https://mikesmautorepair.com";
const DEFAULT_OG =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4c7b5790-8e1a-49ef-a408-bcd46551c2f8";

if (!existsSync(DIST)) {
  console.log("[prerender] dist/ not found — skipping.");
  process.exit(0);
}

const baseHtml = readFileSync(resolve(DIST, "index.html"), "utf8");

// --- Lightweight route data (mirror of TS data, kept inline to avoid TS deps) ---
const read = (p) => readFileSync(resolve(ROOT, p), "utf8");
const matchAll = (src, re) => [...src.matchAll(re)].map((m) => m.slice(1));

const cities = matchAll(
  read("src/data/cities.ts"),
  /slug:\s*"([^"]+)",[\s\S]*?name:\s*"([^"]+)",[\s\S]*?state:\s*"([^"]+)",[\s\S]*?intro:\s*\n?\s*"([^"]+)"/g
).map(([slug, name, state, intro]) => ({ slug, name, state, intro }));

const categories = matchAll(
  read("src/data/serviceCategories.ts"),
  /id:\s*"([^"]+)",[\s\S]*?title:\s*"([^"]+)",[\s\S]*?description:\s*\n?\s*"([^"]+)"/g
).map(([id, title, description]) => ({ id, title, description }));

// landing pages (slug + metaTitle + metaDescription + canonical?)
const landingSrc = read("src/data/localLandingPages.ts");
const landingPages = [];
{
  const re =
    /\{\s*slug:\s*"([^"]+)",[\s\S]*?metaTitle:\s*\n?\s*"([^"]+)",\s*metaDescription:\s*\n?\s*"([^"]+)"(?:,[\s\S]*?canonical:\s*"([^"]+)")?/g;
  let m;
  while ((m = re.exec(landingSrc))) {
    landingPages.push({
      slug: m[1],
      metaTitle: m[2],
      metaDescription: m[3],
      canonical: m[4] || `${SITE}/${m[1]}`,
    });
  }
}

const blogSrc = read("src/data/blogPosts.ts");
const blogPosts = [];
{
  const re =
    /slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*excerpt:\s*\n?\s*"([^"]+)"[\s\S]*?dateISO:\s*"([^"]+)"[\s\S]*?tags:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(blogSrc))) {
    const tags = [...m[5].matchAll(/"([^"]+)"/g)].map((t) =>
      t[1].toLowerCase().replace(/\s+/g, "-")
    );
    blogPosts.push({
      slug: m[1],
      title: m[2],
      excerpt: m[3],
      dateISO: m[4],
      tags,
    });
  }
}
const blogTags = [...new Set(blogPosts.flatMap((p) => p.tags))];

// --- Build route list ---
const routes = [];

routes.push({
  path: "/",
  title:
    "Mobile Mechanic in Lehigh Acres & Fort Myers, FL | Mike's Mobile Auto Repair",
  description:
    "On-site auto repair, diagnostics, and mobile mechanic service in Lehigh Acres and Fort Myers, FL. Call (813) 501-7572.",
  canonical: `${SITE}/`,
});

routes.push({
  path: "/about",
  title: "About MMAR | Mike's Mobile Auto Repair LLC",
  description:
    "Mike's Mobile Auto Repair LLC — honest, on-site mobile mechanic serving Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/about`,
});

routes.push({
  path: "/services",
  title: "Mobile Mechanic Services | Mike's Mobile Auto Repair",
  description:
    "All mobile mechanic services offered across Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start.",
  canonical: `${SITE}/services`,
});

for (const c of categories) {
  routes.push({
    path: `/services/${c.id}`,
    title: `${c.title} | Mobile Mechanic Lehigh Acres and Fort Myers | Mike's Mobile Auto Repair`,
    description: c.description,
    canonical: `${SITE}/services/${c.id}`,
  });
}

routes.push({
  path: "/service-areas",
  title: "Service Areas | Mike's Mobile Auto Repair",
  description: "Mobile mechanic service areas across Lehigh Acres and Fort Myers, FL.",
  canonical: `${SITE}/service-areas`,
});

for (const city of cities) {
  routes.push({
    path: `/areas/${city.slug}`,
    title: `Mobile Mechanic in ${city.name}, ${city.state} | Mike's Mobile Auto Repair`,
    description: city.intro.slice(0, 158),
    canonical: `${SITE}/areas/${city.slug}`,
  });
}

routes.push({
  path: "/reviews",
  title: "Customer Reviews | Mike's Mobile Auto Repair",
  description:
    "5-star customer reviews for Mike's Mobile Auto Repair across Google, Facebook, Yelp, and Nextdoor — serving Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/reviews`,
});

routes.push({
  path: "/contact",
  title: "Contact Mike's Mobile Auto Repair | Call or Text (813) 501-7572",
  description:
    "Call or text Mike's Mobile Auto Repair at (813) 501-7572 for same-day mobile mechanic service across Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/contact`,
});

routes.push({
  path: "/warranty-policy",
  title: "Warranty Policy | Mike's Mobile Auto Repair",
  description:
    "12-month / 12,000-mile warranty on parts and labor for mobile auto repairs across Lehigh Acres and Fort Myers, FL.",
  canonical: `${SITE}/warranty-policy`,
});

routes.push({
  path: "/blog",
  title:
    "Mobile Mechanic Blog | Lehigh Acres and Fort Myers Auto Repair Tips",
  description:
    "Mobile mechanic guides for Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start fixes, and Florida-specific car care.",
  canonical: `${SITE}/blog`,
});

for (const p of blogPosts) {
  routes.push({
    path: `/blog/${p.slug}`,
    title: `${p.title} | Mike's Mobile Auto Repair`,
    description: p.excerpt,
    canonical: `${SITE}/blog/${p.slug}`,
    type: "article",
  });
}

for (const t of blogTags) {
  routes.push({
    path: `/blog/tag/${t}`,
    title: `${t.replace(/-/g, " ")} | Mike's Mobile Auto Repair Blog`,
    description: `Mobile mechanic articles tagged "${t}" — serving Lehigh Acres and Fort Myers.`,
    canonical: `${SITE}/blog/tag/${t}`,
  });
}

for (const lp of landingPages) {
  // Only emit at the canonical URL to avoid duplicate-content prerendered HTML.
  const canonPath = lp.canonical.replace(SITE, "") || "/";
  if (routes.some((r) => r.path === canonPath)) continue;
  routes.push({
    path: canonPath,
    title: lp.metaTitle,
    description: lp.metaDescription,
    canonical: lp.canonical,
  });
}

// --- HTML rewrite helpers ---
const escapeHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHtml(route) {
  let html = baseHtml;
  const title = escapeHtml(route.title);
  const desc = escapeHtml(route.description);
  const canonical = escapeHtml(route.canonical);
  const og = escapeHtml(DEFAULT_OG);

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

  // description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${desc}">`
  );

  // canonical
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // og:title / twitter:title
  html = html.replace(
    /<meta property="og:title"[^>]*>/g,
    `<meta property="og:title" content="${title}">`
  );
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/g,
    `<meta name="twitter:title" content="${title}">`
  );

  // og:description / twitter:description
  html = html.replace(
    /<meta property="og:description"[^>]*>/g,
    `<meta property="og:description" content="${desc}">`
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/g,
    `<meta name="twitter:description" content="${desc}">`
  );

  // og:url
  if (/<meta property="og:url"[^>]*>/.test(html)) {
    html = html.replace(
      /<meta property="og:url"[^>]*>/,
      `<meta property="og:url" content="${canonical}">`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta property="og:url" content="${canonical}">\n</head>`
    );
  }

  // og:image / twitter:image — set defaults if missing
  if (!/<meta property="og:image"[^>]*>/.test(html)) {
    html = html.replace(
      "</head>",
      `  <meta property="og:image" content="${og}">\n</head>`
    );
  }
  if (!/<meta name="twitter:image"[^>]*>/.test(html)) {
    html = html.replace(
      "</head>",
      `  <meta name="twitter:image" content="${og}">\n</head>`
    );
  }

  // og:type override for blog posts
  if (route.type === "article") {
    html = html.replace(
      /<meta property="og:type"[^>]*>/,
      `<meta property="og:type" content="article">`
    );
  }

  return html;
}

// --- Write files ---
let written = 0;
for (const route of routes) {
  const html = buildHtml(route);
  const outDir =
    route.path === "/" ? DIST : join(DIST, route.path.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  written++;
}

console.log(`[prerender] wrote ${written} static HTML files.`);
