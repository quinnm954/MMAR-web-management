import { Link, useParams } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import { getCityBySlug } from "@/data/cities";
import { categories } from "@/data/serviceCategories";
import { localLandingPages } from "@/data/localLandingPages";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const CityPage = () => {
  const { city: slug = "" } = useParams();
  const city = getCityBySlug(slug);

  useSeo({
    title: city
      ? `Mobile Mechanic in ${city.name}, ${city.state} | Mike's Mobile Auto Repair`
      : "City Not Found",
    description: city?.intro,
    canonical: `https://www.mikesmautorepair.com/areas/${slug}`,
  });

  if (!city) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
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
            <h3 className="font-display text-lg text-gold mb-2">ZIP Codes</h3>
            <p className="text-muted-foreground text-sm">{city.zips.join(" · ")}</p>
          </div>

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
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default CityPage;
