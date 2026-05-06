// Shared JSON-LD builder for /:landingSlug pages.
// Used by both the client (LocalLanding.tsx) and the prerender script
// (scripts/prerender.mjs via a parallel JS copy) so the runtime DOM and the
// static HTML emit identical structured data.

const SITE = "https://mikesmautorepair.com";
const BUSINESS_ID = `${SITE}/#business`;
const PHONE = "+1-813-501-7572";

export type LandingLdInput = {
  slug: string;
  service: string;
  h1: string;
  metaDescription: string;
  canonical?: string;
  faqs?: Array<{ q: string; a: string }>;
  city?: {
    slug: string;
    name: string;
    state: string;
    zips: string[];
    geo: { lat: number; lng: number };
  };
  category?: { id: string; title: string };
  allCities: Array<{ name: string; state: string }>;
};

const breadcrumb = (items: Array<{ name: string; item: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((b, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: b.name,
    item: b.item,
  })),
});

const faqLd = (faqs: Array<{ q: string; a: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export function buildLandingJsonLd(input: LandingLdInput): object[] {
  const canonical = input.canonical ?? `${SITE}/${input.slug}`;

  const areaServed = input.city
    ? {
        "@type": "City",
        name: `${input.city.name}, ${input.city.state}`,
        containedInPlace: { "@type": "AdministrativeArea", name: "Lee County, FL" },
        geo: {
          "@type": "GeoCoordinates",
          latitude: input.city.geo.lat,
          longitude: input.city.geo.lng,
        },
      }
    : input.allCities.map((c) => ({
        "@type": "City",
        name: `${c.name}, ${c.state}`,
      }));

  const breadcrumbItems: Array<{ name: string; item: string }> = [
    { name: "Home", item: `${SITE}/` },
  ];
  if (input.category) {
    breadcrumbItems.push({
      name: input.category.title,
      item: `${SITE}/services/${input.category.id}`,
    });
  }
  if (input.city) {
    breadcrumbItems.push({
      name: `${input.city.name}, ${input.city.state}`,
      item: `${SITE}/areas/${input.city.slug}`,
    });
  }
  breadcrumbItems.push({ name: input.h1, item: canonical });

  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonical}#service`,
    name: input.service,
    serviceType: input.service,
    category: input.category?.title,
    description: input.metaDescription,
    url: canonical,
    areaServed,
    provider: { "@id": BUSINESS_ID },
    brand: { "@id": BUSINESS_ID },
    audience: { "@type": "Audience", audienceType: "Vehicle owners" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: canonical,
      servicePhone: PHONE,
      availableLanguage: ["English", "Spanish"],
    },
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
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
      areaServed: input.city
        ? `${input.city.name}, ${input.city.state}`
        : "Lee County, FL",
    },
  };

  const blocks: object[] = [service, breadcrumb(breadcrumbItems)];
  if (input.faqs && input.faqs.length) blocks.push(faqLd(input.faqs));
  return blocks;
}
