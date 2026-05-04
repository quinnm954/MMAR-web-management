import { Link, useParams } from "react-router-dom";
import { MapPin, ArrowLeft, ChevronRight, Home } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import { getCityBySlug, cities } from "@/data/cities";
import { categories } from "@/data/serviceCategories";
import { localLandingPages } from "@/data/localLandingPages";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const SITE = "https://mikesmautorepair.com";

const CityPage = () => {
  const { city: slug = "" } = useParams();
  const city = getCityBySlug(slug);

  const url = `${SITE}/areas/${slug}`;
  const title = city
    ? `Mobile Mechanic in ${city.name}, ${city.state} | Mike's Mobile Auto Repair`
    : "City Not Found";

  const jsonLd = city
    ? [
        {
          "@context": "https://schema.org",
          "@type": "AutoRepair",
          "@id": `${url}#business`,
          name: `Mike's Mobile Auto Repair — ${city.name}`,
          image: `${SITE}/mmar-logo.jpeg`,
          url,
          telephone: "+18135017572",
          priceRange: "$$",
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
          areaServed: {
            "@type": "City",
            name: `${city.name}, ${city.state}`,
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
              opens: "08:00",
              closes: "19:00",
            },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Service Areas", item: `${SITE}/service-areas` },
            { "@type": "ListItem", position: 3, name: city.name, item: url },
          ],
        },
        ...(city.faqs && city.faqs.length
          ? [{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: city.faqs.map((q) => ({
                "@type": "Question",
                name: q.question,
                acceptedAnswer: { "@type": "Answer", text: q.answer },
              })),
            }]
          : []),
      ]
    : undefined;

  useSeo({
    title,
    description: city?.intro,
    canonical: url,
    jsonLd,
    breadcrumbs: city
      ? [
          { name: "Home", url: "https://mikesmautorepair.com/" },
          { name: "Service Areas", url: "https://mikesmautorepair.com/service-areas" },
          { name: city.name, url },
        ]
      : undefined,
  });

  if (!city) return <NotFound />;

  const nearby = cities.filter((c) => c.slug !== city.slug).slice(0, 5);
  // Centered map of the city
  const mapSrc = `https://maps.google.com/maps?q=${city.geo.lat},${city.geo.lng}&z=11&output=embed`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <li>
                <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
                  <Home className="w-3.5 h-3.5" /> Home
                </Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li>
                <Link to="/service-areas" className="hover:text-primary">Service Areas</Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground" aria-current="page">{city.name}</li>
            </ol>
          </nav>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          <div className="flex items-center gap-3 text-primary mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">
              {city.name}, {city.state}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-wide mb-6">
            <span className="text-sky">MOBILE MECHANIC</span>
            <br />
            <span className="text-gold">
              IN {city.name.toUpperCase()}, {city.state}
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
            {city.intro}
          </p>

          <div className="mb-12">
            <RequestQuoteCTA
              serviceName={`Mobile Mechanic in ${city.name}, ${city.state}`}
              subheading={`Tell us what your vehicle needs in ${city.name} — we'll text you a fast, transparent quote.`}
            />
          </div>

          <article className="space-y-6 text-foreground/90 leading-relaxed mb-12">
            {city.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>

          {/* Pricing */}
          {city.pricing && city.pricing.length > 0 && (
            <section className="mb-12" aria-labelledby="pricing">
              <h2 id="pricing" className="font-display text-2xl md:text-3xl text-gold mb-3">
                Mobile Repair Pricing in {city.name}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Typical price ranges for common mobile services in {city.name}, {city.state}. Final quotes are always given in writing before any work begins.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/30 text-foreground">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Service</th>
                      <th className="text-left font-semibold px-4 py-3">Typical price</th>
                      <th className="text-left font-semibold px-4 py-3 hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {city.pricing.map((row) => (
                      <tr key={row.service} className="border-t border-border/40">
                        <td className="px-4 py-3 text-foreground">{row.service}</td>
                        <td className="px-4 py-3 text-primary font-medium whitespace-nowrap">{row.range}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{row.note ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Neighborhoods */}
          <div className="glass-card rounded-xl p-6 border border-border/50 mb-12">
            <h2 className="font-display text-xl md:text-2xl text-sky mb-3">
              Neighborhoods We Serve in {city.name}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {city.neighborhoods.map((n) => (
                <span
                  key={n}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
            {city.neighborhoodNotes && city.neighborhoodNotes.length > 0 && (
              <ul className="space-y-3 mt-4">
                {city.neighborhoodNotes.map((n) => (
                  <li key={n.name} className="text-sm">
                    <span className="font-semibold text-foreground">{n.name}.</span>{" "}
                    <span className="text-muted-foreground">{n.note}</span>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="font-display text-lg text-gold mb-2 mt-5">ZIP Codes</h3>
            <p className="text-muted-foreground text-sm">{city.zips.join(" · ")}</p>
          </div>

          {/* Map */}
          <section className="mb-12" aria-labelledby="service-map">
            <h2 id="service-map" className="font-display text-2xl md:text-3xl text-sky mb-3">
              Our {city.name} Service Area
            </h2>
            <div className="rounded-xl overflow-hidden border border-border/50">
              <iframe
                title={`Mobile mechanic service area map for ${city.name}, ${city.state}`}
                src={mapSrc}
                width="100%"
                height="320"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </section>

          <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
            Mobile Services Available in {city.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/services/${cat.id}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 transition-all active:scale-[0.98] min-h-[64px] group"
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

          {localLandingPages.filter((p) => p.citySlug === city.slug).length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl md:text-3xl text-sky mb-4">
                Popular Mobile Services in {city.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {localLandingPages
                  .filter((p) => p.citySlug === city.slug)
                  .map((p) => (
                    <Link
                      key={p.slug}
                      to={`/${p.slug}`}
                      className="px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
                    >
                      {p.service}
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {city.faqs && city.faqs.length > 0 && (
            <section className="mt-12 border-t border-border pt-8" aria-labelledby="city-faq">
              <h2 id="city-faq" className="font-display text-2xl md:text-3xl text-gold mb-4">
                Frequently asked questions about {city.name} mobile auto repair
              </h2>
              <div className="space-y-4">
                {city.faqs.map((q) => (
                  <details key={q.question} className="rounded-lg border border-border p-4 group">
                    <summary className="cursor-pointer font-medium text-foreground group-open:text-primary">
                      {q.question}
                    </summary>
                    <p className="mt-2 text-foreground/80 leading-relaxed">{q.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Nearby cities */}
          <section className="mt-12 border-t border-border pt-8" aria-labelledby="nearby">
            <h2 id="nearby" className="font-display text-2xl md:text-3xl text-sky mb-4">
              We also service nearby cities
            </h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map((c) => (
                <Link
                  key={c.slug}
                  to={`/areas/${c.slug}`}
                  className="px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
                >
                  Mobile mechanic in {c.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default CityPage;
