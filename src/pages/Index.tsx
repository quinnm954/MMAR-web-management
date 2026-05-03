import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import SeoContent from "@/components/SeoContent";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RoadsideBanner from "@/components/RoadsideBanner";
import TrustBadges from "@/components/TrustBadges";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <RoadsideBanner />
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4">
        <TrustBadges />
      </div>
      <About />
      <Services />
      <SeoContent />
      <Testimonials />
      <Newsletter />
      <Contact />
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Index;
