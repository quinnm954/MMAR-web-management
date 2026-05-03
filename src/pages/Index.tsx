import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RoadsideBanner from "@/components/RoadsideBanner";
import TrustBadges from "@/components/TrustBadges";
import FeaturedServices from "@/components/home/FeaturedServices";
import ServiceAreasPreview from "@/components/home/ServiceAreasPreview";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import HomeServicesOverview from "@/components/home/HomeServicesOverview";
import HomeFAQ from "@/components/home/HomeFAQ";
import FinalCTA from "@/components/home/FinalCTA";
import { useSeo } from "@/lib/useSeo";
import { REVIEWS_META } from "@/data/reviewsMeta";

const SITE = "https://www.mikesmautorepair.com";

const Index = () => {
  useSeo({
    title: "Mobile Mechanic in Lehigh Acres & Fort Myers, FL | Mike's Mobile Auto Repair",
    description:
      "On-site auto repair, diagnostics, and emergency roadside mechanic in Lehigh Acres, Fort Myers, Cape Coral & all of Southwest Florida. Call (813) 501-7572.",
    canonical: `${SITE}/`,
  });

  useEffect(() => {
    const id = "ld-home-graph";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          ],
        },
        {
          "@type": "AutoRepair",
          "@id": `${SITE}/#business`,
          name: "Mike's Mobile Auto Repair LLC",
          url: SITE,
          telephone: "+18135017572",
          priceRange: "$$",
          image: "https://iili.io/3QividB.jpg",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: REVIEWS_META.ratingValue,
            reviewCount: REVIEWS_META.reviewCount,
            bestRating: REVIEWS_META.bestRating,
            worstRating: REVIEWS_META.worstRating,
          },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Mobile Auto Repair Services",
            itemListElement: [
              "Mobile Brake Repair",
              "Mobile Alternator Repair",
              "Car Battery Replacement",
              "Vehicle Diagnostics",
              "No-Start Diagnostics",
              "Emergency Roadside Mechanic",
              "Mobile Oil Change",
            ].map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s },
            })),
          },
        },
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoadsideBanner />
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <TrustBadges />
      </div>
      <FeaturedServices />
      <ServiceAreasPreview />
      <TestimonialsPreview />
      <WhyChooseUs />
      <HomeServicesOverview />
      <HomeFAQ />
      <FinalCTA />
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Index;
