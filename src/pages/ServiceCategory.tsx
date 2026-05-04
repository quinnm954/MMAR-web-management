import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import QuoteRequestDialog from "@/components/QuoteRequestDialog";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import { getCategoryBySlug } from "@/data/serviceCategories";
import { cities, getCityBySlug } from "@/data/cities";
import { localLandingPages } from "@/data/localLandingPages";
import { useSeo } from "@/lib/useSeo";
import NotFound from "./NotFound";

const ServiceCategory = () => {
  const { slug = "" } = useParams();
  const category = getCategoryBySlug(slug);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const SITE = "https://mikesmautorepair.com";
  const url = `${SITE}/services/${slug}`;
  const jsonLd = category
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          name: category.title,
          description: category.description,
          serviceType: category.title,
          url,
          provider: {
            "@type": "AutoRepair",
            "@id": `${SITE}#business`,
            name: "Mike's Mobile Auto Repair",
            telephone: "+18135017572",
            url: SITE,
          },
          areaServed: cities.map((c) => ({ "@type": "City", name: `${c.name}, ${c.state}` })),
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: category.title,
            itemListElement: category.services.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s.name },
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` },
            { "@type": "ListItem", position: 3, name: category.title, item: url },
          ],
        },
      ]
    : undefined;

  useSeo({
    title: category
      ? `${category.title} | Mobile Mechanic Lehigh Acres and Fort Myers | Mike's Mobile Auto Repair`
      : "Service Not Found",
    description: category?.description,
    canonical: url,
    jsonLd,
    breadcrumbs: category
      ? [
          { name: "Home", url: "https://mikesmautorepair.com/" },
          { name: "Services", url: "https://mikesmautorepair.com/services" },
          { name: category.title, url },
        ]
      : undefined,
  });

  if (!category) return <NotFound />;

  const handleClick = (name: string) => {
    setSelectedService(name);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/#services"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> All Services
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <category.icon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide">
              <span className="text-sky">{category.title.toUpperCase()}</span>
            </h1>
          </div>

          <p className="text-base md:text-lg text-muted-foreground mb-8">
            {category.description}
          </p>

          <div className="mb-12">
            <RequestQuoteCTA
              serviceName={category.title}
              subheading={`Get a fast, transparent quote for ${category.title.toLowerCase()} — sent right to your phone.`}
            />
          </div>

          <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
            Services We Offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {category.services.map((service) => (
              <button
                key={service.name}
                onClick={() => handleClick(service.name)}
                className="flex items-center gap-3 p-4 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 text-left transition-all active:scale-[0.98] min-h-[64px] group"
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors">
                  {service.name}
                </span>
              </button>
            ))}
          </div>

          <div className="glass-card rounded-xl p-6 md:p-8 border border-border/50">
            <h2 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Available Across Lehigh Acres and Fort Myers
            </h2>
            <p className="text-muted-foreground mb-4">
              Mike's Mobile Auto Repair brings {category.title.toLowerCase()}{" "}
              services to your driveway or workplace. We cover
              all of Lee County and surrounding areas.
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

          {localLandingPages.filter((p) => p.categoryId === category.id).length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl md:text-3xl text-gold mb-4">
                Get This Service in Your City
              </h2>
              <div className="flex flex-wrap gap-2">
                {localLandingPages
                  .filter((p) => p.categoryId === category.id)
                  .map((p) => (
                    <Link
                      key={p.slug}
                      to={`/${p.slug}`}
                      className="px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
                    >
                      {p.service} — {getCityBySlug(p.citySlug)?.name}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
      <QuoteRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceName={selectedService}
      />
    </div>
  );
};

export default ServiceCategory;
