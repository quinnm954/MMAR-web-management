import { Link } from "react-router-dom";
import { Star, MessageSquareText, Phone, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSeo } from "@/lib/useSeo";

// Google Business Profile share link — opens the business profile where
// customers can tap "Write a review" directly.
const REVIEW_URL = "https://share.google/bx2Gb42dslCITJdS8";
const FALLBACK_URL = "https://share.google/bx2Gb42dslCITJdS8";
const PHONE = "+18135017572";
const SMS_HREF = `sms:${PHONE}?&body=${encodeURIComponent(
  "Hi Mike — I just had service done and wanted to share feedback before I leave a review."
)}`;

const ReviewLanding = () => {
  useSeo({
    title: "Leave a Review | Mike's Mobile Auto Repair",
    description:
      "Thanks for choosing Mike's Mobile Auto Repair. Share your experience on Google in 30 seconds — your review helps other Lehigh Acres and Fort Myers drivers find honest mobile service.",
    canonical: "https://mikesmautorepair.com/review",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          <div className="flex items-center gap-1 text-gold mb-4" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-7 h-7 fill-current" />
            ))}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">THANK YOU</span>{" "}
            <span className="text-gold">FOR CHOOSING US</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
            Your feedback genuinely helps a small Lehigh Acres and Fort Myers business and helps other
            drivers find honest mobile service. If we earned it, would you take 30 seconds to
            leave a Google review?
          </p>

          <div className="space-y-3 mb-8">
            <a
              href={REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-5 rounded-xl bg-gold text-background font-bold text-lg shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Star className="w-6 h-6 fill-current" />
              Leave a 5-star Google review
            </a>

            <a
              href={FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-border bg-background/40 text-foreground font-medium hover:border-primary/60 hover:text-primary transition-all"
            >
              See our Google profile
            </a>
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/20 p-5 mb-8">
            <h2 className="font-display text-xl text-sky mb-2 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5" /> Something wasn't right?
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Please tell us before you post. We'll make it right — that's how we've stayed
              in business.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={SMS_HREF}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110"
              >
                <MessageSquareText className="w-4 h-4" /> Text us
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-foreground font-medium hover:border-primary/60 hover:text-primary"
              >
                <Phone className="w-4 h-4" /> Call us
              </a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Mike's Mobile Auto Repair LLC · (813) 501-7572 · Lehigh Acres and Fort Myers
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReviewLanding;
