import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConversion } from "@/lib/gtag";

const FinalCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center glass-card rounded-2xl p-8 md:p-12 border border-primary/20">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">NEED A MOBILE</span>{" "}
            <span className="text-gold">MECHANIC TODAY?</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-7 max-w-xl mx-auto">
            Same-day mobile service across Lehigh Acres and Fort Myers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" className="min-h-[52px]" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="w-5 h-5 mr-2" /> Call (813) 501-7572
              </a>
            </Button>
            <Button variant="heroOutline" size="lg" className="min-h-[52px]" asChild>
              <a href="sms:8135017572" onClick={() => trackConversion("text_click")}>
                <MessageCircle className="w-5 h-5 mr-2" /> Text for Quote
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
