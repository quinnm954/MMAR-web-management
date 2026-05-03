import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import { trackConversion } from "@/lib/gtag";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-16 md:pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Mike's Mobile Auto Repair — on-site mechanic in Southwest Florida"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/65 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-wide mb-4 md:mb-6 animate-slide-up">
            <span className="text-sky">MOBILE MECHANIC</span>
            <br />
            <span className="text-gold">IN LEHIGH ACRES &amp; FORT MYERS, FL</span>
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-7 md:mb-9 px-2 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            On-site auto repair and full diagnostics across Southwest Florida — we come to you.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8 md:mb-12 px-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[52px]" asChild>
              <a href="tel:8135017572" onClick={trackConversion}>
                <Phone className="w-5 h-5 mr-2" /> Call Now
              </a>
            </Button>
            <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[52px]" asChild>
              <a href="sms:8135017572" onClick={trackConversion}>
                <MessageCircle className="w-5 h-5 mr-2" /> Text for Quote
              </a>
            </Button>
            <Button variant="heroOutline" size="lg" className="w-full sm:w-auto min-h-[52px]" asChild>
              <Link to="/services">
                <Wrench className="w-5 h-5 mr-2" /> View Services
              </Link>
            </Button>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-muted-foreground animate-fade-in px-4"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm sm:text-base">Southwest Florida</span>
            </div>
            <a href="tel:8135017572" onClick={trackConversion} className="flex items-center gap-2 hover:text-accent transition-colors active:scale-95">
              <Phone className="w-5 h-5 text-accent shrink-0" />
              <span className="text-sm sm:text-base font-medium">(813) 501-7572</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
