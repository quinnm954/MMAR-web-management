import { Button } from "@/components/ui/button";
import { MapPin, Phone } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
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
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide mb-6 animate-slide-up">
            <span className="text-sky">MIKES MOBILE</span>
            <br />
            <span className="text-gold">AUTO REPAIR</span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            On-site, dependable, professional auto repair wherever you are.
            Serving Greenville and Spartanburg Counties with ASE-level quality.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="hero" size="xl" asChild>
              <a href="#contact">Get in Touch</a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="#services">View Services</a>
            </Button>
          </div>

          {/* Quick Info */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Greenville & Spartanburg County, SC</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-accent" />
              <a href="tel:8039536194" className="hover:text-accent transition-colors">
                (803) 953-6194
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
