import { Link } from "react-router-dom";
import { MapPin, Phone, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import TrustBadges from "@/components/TrustBadges";
import { cities } from "@/data/cities";
import { categories } from "@/data/serviceCategories";
import { localLandingPages } from "@/data/localLandingPages";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";
const URL = `${SITE}/lee-county-fl`;

const LEE_CITIES = ["fort-myers", "cape-coral", "lehigh-acres", "bonita-springs", "estero"];

const LeeCounty = () => {
  const matrixCities = cities.filter((c) => LEE_CITIES.includes(c.slug));

  useSeo({
    title:
      "Mobile Mechanic in Lee County, FL | Auto Repair Across Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs & Estero",
    description:
      "Mike's Mobile Auto Repair serves all of Lee County, FL — Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, and Estero. Brakes, AC, batteries, engine, transmission, and diagnostics at your driveway. Call (813) 501-7572.",
    canonical: URL,
    breadcrumbs: [
      { name: "Home", url: `${SITE}/` },
      { name: "Lee County, FL", url: URL },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "AutoRepair",
        "@id": `${URL}#business`,
        name: "Mike's Mobile Auto Repair — Lee County, FL",
        image: `${SITE}/mmar-logo.jpeg`,
        url: URL,
        telephone: "+18135017572",
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressRegion: "FL",
          addressCountry: "US",
          addressLocality: "Lee County",
        },
        areaServed: matrixCities.map((c) => ({
          "@type": "City",
          name: `${c.name}, ${c.state}`,
          containedInPlace: { "@type": "AdministrativeArea", name: "Lee County, FL" },
          geo: {
            "@type": "GeoCoordinates",
            latitude: c.geo.lat,
            longitude: c.geo.lng,
          },
        })),
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            opens: "09:00",
            closes: "17:00",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Lee County, FL", item: URL },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 text-primary mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Lee County, FL</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6">
            <span className="text-sky">MOBILE MECHANIC IN LEE COUNTY, FLORIDA</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
            Mike's Mobile Auto Repair serves every major city in Lee County —
            Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, and Estero —
            with on-site mechanical diagnostics and repair. Dealer-level scan
            tools, OE-spec parts, written quotes, and a 12-month / 12,000-mile
            warranty on parts and labor.
          </p>

          <a
            href="tel:8135017572"
            className="inline-flex items-center gap-2 text-gold hover:text-gold/80 font-semibold mb-8"
          >
            <Phone className="w-4 h-4" /> (813) 501-7572
          </a>

          <TrustBadges />

          <div className="my-10">
            <RequestQuoteCTA
              serviceName="Lee County mobile mechanic service"
              subheading="Tell us about your vehicle — we'll text a fast, transparent quote."
            />
          </div>

          <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
            Cities We Serve in Lee County
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {matrixCities.map((c) => (
              <Link
                key={c.slug}
                to={`/areas/${c.slug}`}
                className="flex items-center justify-between gap-3 p-4 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 transition-all min-h-[64px] group"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.name}, {c.state}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ZIPs: {c.zips.join(" · ")}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          <h2 className="font-display text-2xl md:text-3xl text-sky mb-4">
            Mechanical Services Across Lee County
          </h2>
          <p className="text-muted-foreground mb-4">
            Every mechanical service except bodywork — brakes, AC, batteries,
            engine, transmission, suspension, tires, fuel/exhaust, cooling, and
            inspections. Tap a service to see how we deliver it across Lee County.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/services/${cat.id}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 transition-all min-h-[64px] group"
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <cat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.title}
                </span>
              </Link>
            ))}
          </div>

          <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
            Popular Service + City Pages
          </h2>
          <div className="flex flex-wrap gap-2 mb-12">
            {localLandingPages
              .filter((p) => p.citySlug && LEE_CITIES.includes(p.citySlug))
              .slice(0, 40)
              .map((p) => (
                <Link
                  key={p.slug}
                  to={`/${p.slug}`}
                  className="px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm transition-colors"
                >
                  {p.service} — {cities.find((c) => c.slug === p.citySlug)?.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default LeeCounty;
