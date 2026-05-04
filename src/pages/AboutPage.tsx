import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import TrustBadges from "@/components/TrustBadges";
import { useSeo } from "@/lib/useSeo";
import About from "@/components/About";

const AboutPage = () => {
  useSeo({
    title: "About MMAR | Mike's Mobile Auto Repair LLC",
    description:
      "Mike's Mobile Auto Repair LLC — honest, on-site mobile mechanic serving Lehigh Acres and Fort Myers.",
    canonical: "https://mikesmautorepair.com/about",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "About", url: "https://mikesmautorepair.com/about" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">ABOUT</span>{" "}
            <span className="text-gold">MMAR</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Honest mobile mechanic service across Lehigh Acres and Fort Myers — built on
            transparent pricing, on-site convenience, and quality work.
          </p>
        </div>
      </section>
      <About />
      <div className="container mx-auto px-4 max-w-5xl py-8">
        <TrustBadges />
      </div>
      <div className="container mx-auto px-4 max-w-3xl pb-12">
        <InlineCallStrip label="Ready to book a mobile mechanic?" />
      </div>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default AboutPage;
