import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RoadsideBanner from "@/components/RoadsideBanner";
import TrustBadges from "@/components/TrustBadges";
import FeaturedServices from "@/components/home/FeaturedServices";
import ServiceAreasPreview from "@/components/home/ServiceAreasPreview";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import FinalCTA from "@/components/home/FinalCTA";
import { useSeo } from "@/lib/useSeo";

const Index = () => {
  useSeo({
    title: "Mobile Mechanic in Lehigh Acres & Fort Myers, FL | Mike's Mobile Auto Repair",
    description:
      "On-site auto repair, diagnostics, and emergency roadside mechanic in Lehigh Acres, Fort Myers, Cape Coral & all of Southwest Florida. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/",
  });

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
      <FinalCTA />
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Index;
