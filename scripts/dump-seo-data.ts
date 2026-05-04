// Dump all SEO-relevant TS data to JSON so prerender.mjs can read it
// without re-parsing TypeScript by hand. Run via `bun scripts/dump-seo-data.ts`.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cities } from "../src/data/cities";
import { categories } from "../src/data/serviceCategories";
import { localLandingPages } from "../src/data/localLandingPages";
import { blogPosts } from "../src/data/blogPosts";
import { REVIEWS_META } from "../src/data/reviewsMeta";

const out = {
  cities: cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    state: c.state,
    zips: c.zips,
    intro: c.intro,
    geo: c.geo,
    faqs: c.faqs ?? [],
  })),
  categories: categories.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    services: c.services.map((s) => ({ name: s.name })),
  })),
  landingPages: localLandingPages.map((p) => ({
    slug: p.slug,
    service: p.service,
    citySlug: p.citySlug,
    categoryId: p.categoryId,
    h1: p.h1,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    canonical: p.canonical,
    faqs: p.faqs,
  })),
  blogPosts: blogPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    dateISO: p.dateISO,
    readMinutes: p.readMinutes,
    tags: p.tags,
    body: p.body,
    faqs: p.faqs ?? [],
  })),
  reviews: REVIEWS_META,
};

const path = resolve(import.meta.dir, "..", ".prerender-data.json");
writeFileSync(path, JSON.stringify(out));
console.log(`[dump-seo-data] wrote ${path}`);
