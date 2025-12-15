import { Button } from "@/components/ui/button";
import { MapPin, Phone } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-16 md:pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Mike's Mobile Auto Repair - Quality Auto Repair"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wide mb-4 md:mb-6 animate-slide-up">
            <span className="text-sky">MIKES MOBILE</span>
            <br />
            <span className="text-gold">AUTO REPAIR</span>
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8 px-2 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            On-site, dependable, professional auto repair wherever you are.
            Serving Greenville and Spartanburg Counties with ASE-level quality.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 md:mb-12 px-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[48px]" asChild>
              <a href="tel:8039536194">Get a Quote</a>
            </Button>
            <Button variant="heroOutline" size="lg" className="w-full sm:w-auto min-h-[48px]" asChild>
              <a href="#services">View Services</a>
            </Button>
          </div>

          {/* Quick Info */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-muted-foreground animate-fade-in px-4"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm sm:text-base">Greenville & Spartanburg County, SC</span>
            </div>
            <a href="tel:8039536194" className="flex items-center gap-2 hover:text-accent transition-colors active:scale-95">
              <Phone className="w-5 h-5 text-accent shrink-0" />
              <span className="text-sm sm:text-base font-medium">(803) 953-6194</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
