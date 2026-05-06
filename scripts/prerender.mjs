// Post-build static prerender + per-route JSON-LD injection.
//
// For every known route, write dist/<route>/index.html with:
//   - route-specific <title>, meta description, canonical, OG/Twitter tags
//   - per-route JSON-LD blocks (BreadcrumbList, FAQPage, Article, Service)
//
// React still hydrates client-side; this just gives crawlers full SEO signals
// without requiring JS execution.
//
// Reads route data from .prerender-data.json (produced by
// `bun scripts/dump-seo-data.ts` — runs automatically from package.json).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE = "https://mikesmautorepair.com";
const DEFAULT_OG =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4c7b5790-8e1a-49ef-a408-bcd46551c2f8";
const LOGO = `${SITE}/mmar-logo.jpeg`;
const HERO_IMG = `${SITE}/blog-hero.jpg`;

if (!existsSync(DIST)) {
  console.log("[prerender] dist/ not found — skipping.");
  process.exit(0);
}

const dataPath = resolve(ROOT, ".prerender-data.json");
if (!existsSync(dataPath)) {
  console.error(
    "[prerender] .prerender-data.json missing. Run `bun scripts/dump-seo-data.ts` first."
  );
  process.exit(1);
}
const DATA = JSON.parse(readFileSync(dataPath, "utf8"));
const baseHtml = readFileSync(resolve(DIST, "index.html"), "utf8");

const slugifyTag = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------- shared JSON-LD helpers ----------
const businessRef = { "@id": `${SITE}/#business` };
const orgPublisher = {
  "@type": "Organization",
  name: "Mike's Mobile Auto Repair",
  url: SITE,
  logo: { "@type": "ImageObject", url: LOGO, width: 600, height: 600 },
};

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((b, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: b.name,
    item: b.item,
  })),
});

const faqLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q ?? f.question,
    acceptedAnswer: { "@type": "Answer", text: f.a ?? f.answer },
  })),
});

const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ---------- build route list ----------
const routes = [];
const push = (r) => routes.push(r);

// Home
const HOME_SERVICES = [
  "Mobile Auto Repair",
  "Brake Repair",
  "Battery Replacement",
  "Alternator Repair",
  "Vehicle Diagnostics",
  "Check Engine Light Diagnostics",
  "Oil Change",
  "AC Repair",
  "Cooling System Repair",
  "Starter Replacement",
  "No-Start Diagnostics",
  "Pre-Purchase Inspection",
];
const HOME_CITIES = [
  { name: "Lehigh Acres", state: "FL", lat: 26.6121, lng: -81.6237 },
  { name: "Fort Myers", state: "FL", lat: 26.6406, lng: -81.8723 },
  { name: "Cape Coral", state: "FL", lat: 26.5629, lng: -81.9495 },
  { name: "Naples", state: "FL", lat: 26.1420, lng: -81.7948 },
  { name: "Estero", state: "FL", lat: 26.4384, lng: -81.8068 },
  { name: "Bonita Springs", state: "FL", lat: 26.3398, lng: -81.7787 },
];
push({
  path: "/",
  title:
    "Auto Repair Near Me | Mobile Auto Repair in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs FL",
  description:
    "Auto repair near me in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs, FL. Mobile mechanic comes to you — diagnostics, brakes, batteries, oil changes. Call (813) 501-7572.",
  canonical: `${SITE}/`,
  // The AutoRepair business entity (with aggregateRating, hours, address,
  // sameAs) is declared once in index.html under @id #business. Here we
  // augment that node with a GeoCircle service area, an OfferCatalog of
  // services, per-city Service nodes, and a BreadcrumbList — all referencing
  // the canonical business via @id to avoid duplicate entities.
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AutoRepair",
          "@id": `${SITE}/#business`,
          name: "Mike's Mobile Auto Repair LLC",
          telephone: "+18135017572",
          url: `${SITE}/`,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Lehigh Acres",
            addressRegion: "FL",
            postalCode: "33936",
            addressCountry: "US",
          },
          areaServed: [
            {
              "@type": "GeoCircle",
              geoMidpoint: {
                "@type": "GeoCoordinates",
                latitude: 26.6121,
                longitude: -81.6237,
              },
              geoRadius: 50000,
            },
            ...HOME_CITIES.map((c) => ({
              "@type": "City",
              name: `${c.name}, ${c.state}`,
              geo: {
                "@type": "GeoCoordinates",
                latitude: c.lat,
                longitude: c.lng,
              },
            })),
          ],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Mobile Auto Repair Services",
            itemListElement: HOME_SERVICES.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s },
            })),
          },
        },
        ...HOME_CITIES.map((c) => ({
          "@type": "Service",
          name: `Auto Repair in ${c.name}, ${c.state}`,
          serviceType: "Mobile Auto Repair",
          provider: businessRef,
          areaServed: {
            "@type": "City",
            name: `${c.name}, ${c.state}`,
            geo: {
              "@type": "GeoCoordinates",
              latitude: c.lat,
              longitude: c.lng,
            },
          },
          url: `${SITE}/`,
        })),
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          ],
        },
      ],
    },
  ],
});

// About
push({
  path: "/about",
  title: "About MMAR | Mike's Mobile Auto Repair LLC",
  description:
    "Mike's Mobile Auto Repair LLC — honest, on-site mobile mechanic serving Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/about`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "About", item: `${SITE}/about` },
    ]),
  ],
});

// Services index
push({
  path: "/services",
  title: "Mobile Mechanic Services | Mike's Mobile Auto Repair",
  description:
    "All mobile mechanic services offered across Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start.",
  canonical: `${SITE}/services`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Services", item: `${SITE}/services` },
    ]),
  ],
});

// Service category pages
for (const c of DATA.categories) {
  const url = `${SITE}/services/${c.id}`;
  push({
    path: `/services/${c.id}`,
    title: `${c.title} | Mobile Mechanic Lehigh Acres and Fort Myers | Mike's Mobile Auto Repair`,
    description: c.description,
    canonical: url,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: c.title,
        description: c.description,
        serviceType: c.title,
        url,
        provider: businessRef,
        areaServed: DATA.cities.map((ct) => ({
          "@type": "City",
          name: `${ct.name}, ${ct.state}`,
        })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: c.title,
          itemListElement: c.services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name },
          })),
        },
      },
      breadcrumb([
        { name: "Home", item: `${SITE}/` },
        { name: "Services", item: `${SITE}/services` },
        { name: c.title, item: url },
      ]),
    ],
  });
}

// Service areas index
push({
  path: "/service-areas",
  title: "Service Areas | Mike's Mobile Auto Repair",
  description:
    "Mobile mechanic service areas across Lehigh Acres and Fort Myers, FL.",
  canonical: `${SITE}/service-areas`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Service Areas", item: `${SITE}/service-areas` },
    ]),
  ],
});

// City pages
for (const city of DATA.cities) {
  const url = `${SITE}/areas/${city.slug}`;
  // NOTE: The AutoRepair business entity (with aggregateRating, hours,
  // address, sameAs) is declared once in index.html. Do NOT redeclare it
  // per city — Google merges duplicate business nodes by name/URL and
  // rejects "multiple aggregate ratings". Each city page only contributes
  // a Place + BreadcrumbList (+ optional FAQ).
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      name: `${city.name}, ${city.state}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.state,
        addressCountry: "US",
        postalCode: city.zips[0],
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.geo.lat,
        longitude: city.geo.lng,
      },
    },
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Service Areas", item: `${SITE}/service-areas` },
      { name: city.name, item: url },
    ]),
  ];
  if (city.faqs && city.faqs.length) blocks.push(faqLd(city.faqs));

  push({
    path: `/areas/${city.slug}`,
    title: `Mobile Mechanic in ${city.name}, ${city.state} | Mike's Mobile Auto Repair`,
    description: city.intro.slice(0, 158),
    canonical: url,
    jsonLd: blocks,
  });
}

// Reviews
push({
  path: "/reviews",
  title: "Customer Reviews | Mike's Mobile Auto Repair",
  description:
    "5-star customer reviews for Mike's Mobile Auto Repair across Google, Facebook, Yelp, and Nextdoor — serving Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/reviews`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Reviews", item: `${SITE}/reviews` },
    ]),
  ],
});

// Contact
push({
  path: "/contact",
  title: "Contact Mike's Mobile Auto Repair | Call or Text (813) 501-7572",
  description:
    "Call or text Mike's Mobile Auto Repair at (813) 501-7572 for same-day mobile mechanic service across Lehigh Acres and Fort Myers.",
  canonical: `${SITE}/contact`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Contact", item: `${SITE}/contact` },
    ]),
  ],
});

// Warranty
push({
  path: "/warranty-policy",
  title: "Warranty Policy | Mike's Mobile Auto Repair",
  description:
    "12-month / 12,000-mile warranty on parts and labor for mobile auto repairs across Lehigh Acres and Fort Myers, FL.",
  canonical: `${SITE}/warranty-policy`,
  jsonLd: [
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Warranty Policy", item: `${SITE}/warranty-policy` },
    ]),
  ],
});

// Blog index
const sortedPosts = [...DATA.blogPosts].sort((a, b) =>
  a.dateISO < b.dateISO ? 1 : -1
);
push({
  path: "/blog",
  title:
    "Mobile Mechanic Blog | Lehigh Acres and Fort Myers Auto Repair Tips",
  description:
    "Mobile mechanic guides for Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start fixes, and Florida-specific car care.",
  canonical: `${SITE}/blog`,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Mike's Mobile Auto Repair Blog",
      url: `${SITE}/blog`,
      publisher: orgPublisher,
      blogPost: sortedPosts.map((p) => ({
        "@type": "BlogPosting",
        headline:
          p.title.length > 110 ? p.title.slice(0, 107) + "..." : p.title,
        url: `${SITE}/blog/${p.slug}`,
        mainEntityOfPage: `${SITE}/blog/${p.slug}`,
        datePublished: p.dateISO,
        dateModified: p.dateISO,
        author: {
          "@type": "Organization",
          name: "Mike's Mobile Auto Repair",
          url: SITE,
        },
        publisher: orgPublisher,
        image: [HERO_IMG],
        description: p.excerpt,
      })),
    },
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Blog", item: `${SITE}/blog` },
    ]),
  ],
});

// Blog posts
for (const p of sortedPosts) {
  const url = `${SITE}/blog/${p.slug}`;
  const wordCount = stripHtml(p.body).split(/\s+/).filter(Boolean).length;
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title.length > 110 ? p.title.slice(0, 107) + "..." : p.title,
      description: p.excerpt,
      image: [HERO_IMG],
      datePublished: p.dateISO,
      dateModified: p.dateISO,
      author: {
        "@type": "Organization",
        name: "Mike's Mobile Auto Repair",
        url: SITE,
      },
      publisher: orgPublisher,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: p.tags.join(", "),
      articleSection: "Auto Repair",
      inLanguage: "en-US",
      url,
      wordCount,
    },
    breadcrumb([
      { name: "Home", item: `${SITE}/` },
      { name: "Blog", item: `${SITE}/blog` },
      { name: p.title, item: url },
    ]),
  ];
  if (p.faqs && p.faqs.length) blocks.push(faqLd(p.faqs));

  push({
    path: `/blog/${p.slug}`,
    title: `${p.title} | Mike's Mobile Auto Repair`,
    description: p.excerpt,
    canonical: url,
    type: "article",
    jsonLd: blocks,
  });
}

// Blog tag pages
const allTagSlugs = [
  ...new Set(DATA.blogPosts.flatMap((p) => p.tags.map(slugifyTag))),
];
for (const t of allTagSlugs) {
  const url = `${SITE}/blog/tag/${t}`;
  push({
    path: `/blog/tag/${t}`,
    title: `${t.replace(/-/g, " ")} | Mike's Mobile Auto Repair Blog`,
    description: `Mobile mechanic articles tagged "${t}" — serving Lehigh Acres and Fort Myers.`,
    canonical: url,
    jsonLd: [
      breadcrumb([
        { name: "Home", item: `${SITE}/` },
        { name: "Blog", item: `${SITE}/blog` },
        { name: t, item: url },
      ]),
    ],
  });
}

// Local landing pages (only at canonical URL)
for (const lp of DATA.landingPages) {
  const canonical = lp.canonical || `${SITE}/${lp.slug}`;
  const canonPath = canonical.replace(SITE, "") || "/";
  if (routes.some((r) => r.path === canonPath)) continue;

  const cityObj = lp.citySlug
    ? DATA.cities.find((c) => c.slug === lp.citySlug)
    : undefined;
  const categoryObj = DATA.categories.find((c) => c.id === lp.categoryId);

  const breadcrumbItems = [{ name: "Home", item: `${SITE}/` }];
  if (categoryObj)
    breadcrumbItems.push({
      name: categoryObj.title,
      item: `${SITE}/services/${categoryObj.id}`,
    });
  if (cityObj)
    breadcrumbItems.push({
      name: `${cityObj.name}, ${cityObj.state}`,
      item: `${SITE}/areas/${cityObj.slug}`,
    });
  breadcrumbItems.push({ name: lp.h1, item: canonical });

  const areaServed = cityObj
    ? {
        "@type": "City",
        name: `${cityObj.name}, ${cityObj.state}`,
        containedInPlace: { "@type": "AdministrativeArea", name: "Lee County, FL" },
        geo: {
          "@type": "GeoCoordinates",
          latitude: cityObj.geo.lat,
          longitude: cityObj.geo.lng,
        },
      }
    : DATA.cities.map((c) => ({
        "@type": "City",
        name: `${c.name}, ${c.state}`,
      }));

  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonical}#service`,
      name: lp.service,
      serviceType: lp.service,
      category: categoryObj?.title,
      description: lp.metaDescription,
      url: canonical,
      areaServed,
      provider: businessRef,
      brand: businessRef,
      audience: { "@type": "Audience", audienceType: "Vehicle owners" },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: canonical,
        servicePhone: "+1-813-501-7572",
        availableLanguage: ["English", "Spanish"],
      },
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
        ],
        opens: "09:00",
        closes: "17:00",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          description: "Quoted in writing before any work begins.",
        },
        availability: "https://schema.org/InStock",
        areaServed: cityObj
          ? `${cityObj.name}, ${cityObj.state}`
          : "Lee County, FL",
      },
    },
    breadcrumb(breadcrumbItems),
  ];
  if (lp.faqs && lp.faqs.length) blocks.push(faqLd(lp.faqs));

  push({
    path: canonPath,
    title: lp.metaTitle,
    description: lp.metaDescription,
    canonical,
    jsonLd: blocks,
  });
}

// ---------- HTML rewrite ----------
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

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${desc}">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = html.replace(
    /<meta property="og:title"[^>]*>/g,
    `<meta property="og:title" content="${title}">`
  );
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/g,
    `<meta name="twitter:title" content="${title}">`
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/g,
    `<meta property="og:description" content="${desc}">`
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/g,
    `<meta name="twitter:description" content="${desc}">`
  );
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
  if (route.type === "article") {
    html = html.replace(
      /<meta property="og:type"[^>]*>/,
      `<meta property="og:type" content="article">`
    );
  }

  // Inject per-route JSON-LD before </head>
  if (route.jsonLd && route.jsonLd.length) {
    const blocks = route.jsonLd
      .map(
        (b) =>
          `  <script type="application/ld+json" data-prerender="route">${JSON.stringify(
            b
          )}</script>`
      )
      .join("\n");
    html = html.replace("</head>", `${blocks}\n</head>`);
  }

  return html;
}

// ---------- write files ----------
let written = 0;
for (const route of routes) {
  const html = buildHtml(route);
  const outDir =
    route.path === "/" ? DIST : join(DIST, route.path.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  written++;
}

console.log(`[prerender] wrote ${written} static HTML files with JSON-LD.`);
