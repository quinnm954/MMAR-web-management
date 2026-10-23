import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SatisfactionFeedback from "@/components/SatisfactionFeedback";
import { useSeo } from "@/lib/useSeo";

const ReviewLanding = () => {
  useSeo({
    title: "How Did We Do? | Mike's Mobile Auto Repair",
    description: "Tell us how your service with Mike's Mobile Auto Repair went.",
    canonical: "https://mikesmautorepair.com/review",
    noindex: true,
  });
  const candidate = new URLSearchParams(window.location.search).get("c");
  const customerId = candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate) ? candidate : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-6"><span className="text-sky">HOW DID</span> <span className="text-gold">WE DO?</span></h1>
          <SatisfactionFeedback customerId={customerId} />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ReviewLanding;