import { Link } from "react-router-dom";
import { Star, Quote, ArrowRight } from "lucide-react";

const previews = [
  {
    name: "Marcus Johnson",
    location: "Fort Myers, FL",
    text: "Mike came out to my office parking lot and fixed my brakes while I was in meetings. Incredible service!",
  },
  {
    name: "Sarah Thompson",
    location: "Lehigh Acres, FL",
    text: "Honest, reliable, professional. Broke down on a Saturday and Mike was there within an hour.",
  },
  {
    name: "David Chen",
    location: "Naples, FL",
    text: "Best mobile mechanic in Lehigh Acres and Fort Myers. Fair prices and explains everything clearly.",
  },
];

const TestimonialsPreview = () => {
  return (
    <section className="py-14 md:py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">5-STAR</span>{" "}
            <span className="text-gold">REVIEWS</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real customers across Lehigh Acres and Fort Myers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {previews.map((t) => (
            <div
              key={t.name}
              className="glass-card rounded-2xl p-6 relative border border-border/40"
            >
              <Quote className="absolute top-4 right-4 w-7 h-7 text-primary/20" />
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="border-t border-border pt-3">
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/reviews"
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            View more reviews <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsPreview;
