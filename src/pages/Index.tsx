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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
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
