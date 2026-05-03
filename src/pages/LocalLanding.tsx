import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle2, Phone } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import InlineCallStrip from "@/components/InlineCallStrip";
import TrustBadges from "@/components/TrustBadges";
import RoadsideBanner from "@/components/RoadsideBanner";
import { getLandingPageBySlug, localLandingPages } from "@/data/localLandingPages";
import { cities, getCityBySlug } from "@/data/cities";
import { getCategoryBySlug } from "@/data/serviceCategories";
import { REVIEWS_META } from "@/data/reviewsMeta";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const SITE = "https://www.mikesmautorepair.com";

const LocalLanding = () => {
  const { landingSlug = "" } = useParams();
  const page = getLandingPageBySlug(landingSlug);
  const city = page?.citySlug ? getCityBySlug(page.citySlug) : undefined;
  const category = page ? getCategoryBySlug(page.categoryId) : undefined;

  useSeo({
    title: page?.metaTitle ?? "Page Not Found",
    description: page?.metaDescription,
    canonical: page ? (page.canonical ?? `${SITE}/${page.slug}`) : undefined,
  });

  useEffect(() => {
    if (!page) return;
    const id = "ld-local-landing";
    document.getElementById(id)?.remove();

    const areaServed = city
      ? { "@type": "City", name: `${city.name}, ${city.state}` }
      : cities.map((c) => ({ "@type": "City", name: `${c.name}, ${c.state}` }));

    const canonicalUrl = page.canonical ?? `${SITE}/${page.slug}`;

    const breadcrumbItems: Array<{ name: string; item: string }> = [
      { name: "Home", item: `${SITE}/` },
    ];
    if (category) {
      breadcrumbItems.push({
        name: category.title,
        item: `${SITE}/services/${category.id}`,
      });
    }
    if (city) {
      breadcrumbItems.push({
        name: `${city.name}, ${city.state}`,
        item: `${SITE}/areas/${city.slug}`,
      });
    }
    breadcrumbItems.push({ name: page.h1, item: canonicalUrl });

    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AutoRepair",
          "@id": `${SITE}/#business`,
          name: "Mike's Mobile Auto Repair LLC",
          url: SITE,
          telephone: "+18135017572",
          priceRange: "$$",
          image: "https://iili.io/3QividB.jpg",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Lehigh Acres",
            addressRegion: "FL",
            postalCode: "33936",
            addressCountry: "US",
          },
          areaServed: cities.map((c) => ({
            "@type": "City",
            name: `${c.name}, ${c.state}`,
          })),
          openingHoursSpecification: [
            {
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
              opens: "07:00",
              closes: "21:00",
            },
          ],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: REVIEWS_META.ratingValue,
            reviewCount: REVIEWS_META.reviewCount,
            bestRating: REVIEWS_META.bestRating,
            worstRating: REVIEWS_META.worstRating,
          },
        },
        {
          "@type": "Service",
          name: page.service,
          serviceType: page.service,
          areaServed,
          provider: { "@id": `${SITE}/#business` },
          url: canonicalUrl,
          description: page.metaDescription,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: REVIEWS_META.ratingValue,
            reviewCount: REVIEWS_META.reviewCount,
            bestRating: REVIEWS_META.bestRating,
            worstRating: REVIEWS_META.worstRating,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b.name,
            item: b.item,
          })),
        },
        {
          "@type": "FAQPage",
          mainEntity: page.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => script.remove();
  }, [page, city, category]);

  if (!page) return <NotFound />;

  const siblings = localLandingPages
    .filter((p) => p.slug !== page.slug && p.categoryId === page.categoryId)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <RoadsideBanner />
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          {city && (
            <div className="flex items-center gap-3 text-primary mb-3">
              <MapPin className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">
                {city.name}, {city.state}
              </span>
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6">
            <span className="text-sky">{page.h1.toUpperCase()}</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
            {page.intro}
          </p>

          <a
            href="tel:8135017572"
            className="inline-flex items-center gap-2 text-gold hover:text-gold/80 font-semibold mb-8"
          >
            <Phone className="w-4 h-4" /> (813) 501-7572
          </a>

          <TrustBadges />

          <div className="mb-12">
            <RequestQuoteCTA
              serviceName={`${page.service}${city ? ` — ${city.name}, ${city.state}` : ""}`}
              subheading={`Tell us about your vehicle — we'll text a fast, transparent quote.`}
            />
          </div>

          <article className="space-y-6 text-foreground/90 leading-relaxed mb-12">
            {page.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>

          <InlineCallStrip />

          <div className="glass-card rounded-xl p-6 md:p-8 border border-border/50 mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
              What's Included
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {page.included.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {city ? (
            <div className="glass-card rounded-xl p-6 md:p-8 border border-border/50 mb-12">
              <h2 className="font-display text-xl md:text-2xl text-sky mb-3">
                Neighborhoods We Serve in {city.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {city.neighborhoods.map((n) => (
                  <span key={n} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">ZIP codes: {city.zips.join(" · ")}</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 md:p-8 border border-border/50 mb-12">
              <h2 className="font-display text-xl md:text-2xl text-sky mb-3">
                Available Across Southwest Florida
              </h2>
              <p className="text-muted-foreground mb-4">
                {page.service} is available in all our service cities. Tap your city for full local details.
              </p>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/areas/${c.slug}`}
                    className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {page.faqs.map((faq) => (
                <div key={faq.q} className="glass-card rounded-xl p-5 border border-border/40">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm md:text-base">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 md:p-8 border border-border/50">
            <h2 className="font-display text-xl md:text-2xl text-sky mb-4">
              Related Services & Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {category && (
                <Link to={`/services/${category.id}`} className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors">
                  {category.title}
                </Link>
              )}
              {city && (
                <Link to={`/areas/${city.slug}`} className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors">
                  Mobile Mechanic in {city.name}
                </Link>
              )}
              {siblings.map((s) => (
                <Link key={s.slug} to={`/${s.slug}`} className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors">
                  {s.service}{s.citySlug ? ` — ${getCityBySlug(s.citySlug)?.name}` : ""}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default LocalLanding;
