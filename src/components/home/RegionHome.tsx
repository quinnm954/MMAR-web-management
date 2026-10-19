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
import heroShelby from "@/assets/hero-shelby.jpg";
import { HomeRegionProvider } from "@/lib/homeRegion";
import type { RegionSlug } from "@/lib/regions";

// Shared home page layout. Each region's home page renders this with its own
// SEO; sections swap only local wording based on the region.
const RegionHome = ({ region }: { region: RegionSlug }) => (
  <HomeRegionProvider value={region}>
    <div className="home-immersive relative min-h-screen bg-transparent">
      <div className="fixed inset-0 z-0 bg-background" aria-hidden="true">
        <img
          src={heroShelby}
          alt=""
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-contain object-center"
        />
        <div className="absolute inset-0 bg-background/45" />
      </div>
      <div className="relative z-10">
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
    </div>
  </HomeRegionProvider>
);

export default RegionHome;
