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
import PopularLocalServices from "@/components/home/PopularLocalServices";
import HomeFAQ from "@/components/home/HomeFAQ";
import LocalPhotoGallery from "@/components/home/LocalPhotoGallery";
import VoiceSearchAnswers from "@/components/home/VoiceSearchAnswers";
import FinalCTA from "@/components/home/FinalCTA";

import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";

const Index = () => {
  useSeo({
    title: "Auto Repair Near Me | Mobile Auto Repair in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs FL",
    description:
      "Auto repair near me in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs, FL. Mobile mechanic comes to you — diagnostics, brakes, batteries, oil changes. Call (813) 501-7572.",
    canonical: `${SITE}/`,
  });

  useEffect(() => {
    const id = "ld-home-graph";
    document.getElementById(id)?.remove();
    // NOTE: The AutoRepair business entity (with aggregateRating, hours,
    // address, sameAs) is declared once in index.html under @id #business.
    // Here we add: (1) a GeoCircle service area, (2) an OfferCatalog of
    // services, (3) per-city Service nodes, and (4) a BreadcrumbList — all
    // referencing the canonical business via @id to avoid duplicate entities.
    const SERVICES = [
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
    const CITIES = [
      { name: "Lehigh Acres", state: "FL", lat: 26.6121, lng: -81.6237 },
      { name: "Fort Myers", state: "FL", lat: 26.6406, lng: -81.8723 },
      { name: "Cape Coral", state: "FL", lat: 26.5629, lng: -81.9495 },
      { name: "Naples", state: "FL", lat: 26.1420, lng: -81.7948 },
      { name: "Estero", state: "FL", lat: 26.4384, lng: -81.8068 },
      { name: "Bonita Springs", state: "FL", lat: 26.3398, lng: -81.7787 },
    ];
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AutoRepair",
          "@id": `${SITE}/#business`,
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
            ...CITIES.map((c) => ({
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
            itemListElement: SERVICES.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s },
            })),
          },
        },
        ...CITIES.map((c) => ({
          "@type": "Service",
          name: `Auto Repair in ${c.name}, ${c.state}`,
          serviceType: "Mobile Auto Repair",
          provider: { "@id": `${SITE}/#business` },
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
          "@type": "WebPage",
          "@id": `${SITE}/#webpage`,
          url: `${SITE}/`,
          name: "Mobile Auto Repair Near Me — Lehigh Acres & Fort Myers, FL",
          isPartOf: { "@id": `${SITE}/#business` },
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["#speakable-summary", ".speakable-answer"],
            xpath: ["/html/head/title", "//*[@id='speakable-summary']"],
          },
        },
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
      <PopularLocalServices />
      <LocalPhotoGallery />
      <HomeFAQ />
      <VoiceSearchAnswers />
      <FinalCTA />

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Index;
