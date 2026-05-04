import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";

import TrustBadges from "@/components/TrustBadges";
import FeaturedServices from "@/components/home/FeaturedServices";
import ServiceAreasPreview from "@/components/home/ServiceAreasPreview";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import HomeServicesOverview from "@/components/home/HomeServicesOverview";
import HomeFAQ from "@/components/home/HomeFAQ";
import LocalPhotoGallery from "@/components/home/LocalPhotoGallery";
import FinalCTA from "@/components/home/FinalCTA";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";

const Index = () => {
  useSeo({
    title: "Mobile Mechanic in Lehigh Acres & Fort Myers, FL | Mike's Mobile Auto Repair",
    description:
      "On-site auto repair, diagnostics, and mobile mechanic service in Lehigh Acres and Fort Myers, FL. Call (813) 501-7572.",
    canonical: `${SITE}/`,
  });

  useEffect(() => {
    const id = "ld-home-graph";
    document.getElementById(id)?.remove();
    // NOTE: The AutoRepair business entity (with aggregateRating, hours,
    // address, sameAs) is declared once in index.html. Do NOT redeclare it
    // here — Google merges duplicate business nodes and rejects "multiple
    // aggregate ratings". This page only contributes a BreadcrumbList.
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          ],
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
      <LocalPhotoGallery />
      <HomeFAQ />
      <FinalCTA />
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Index;
