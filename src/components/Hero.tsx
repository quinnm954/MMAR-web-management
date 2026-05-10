import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle, Wrench, User, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import { trackConversion } from "@/lib/gtag";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-16 md:pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Mike's Mobile Auto Repair — on-site mechanic in Lehigh Acres and Fort Myers"
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
            On-site auto repair and full diagnostics across Lehigh Acres and Fort Myers — we come to you.
          </p>

          <div
            className="flex flex-col gap-2.5 sm:gap-3 max-w-3xl mx-auto mb-8 md:mb-12 px-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              <Button variant="hero" size="lg" className="w-full min-h-[52px] px-3 bg-white text-primary hover:bg-white/90 hover:text-primary border-2 border-white" asChild>
                <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                  <Phone className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate">Call Now</span>
                </a>
              </Button>
              <Button variant="hero" size="lg" className="w-full min-h-[52px] px-3" asChild>
                <Link to="/book" onClick={() => trackConversion("lead")}>
                  <CalendarCheck className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate">Book Online</span>
                </Link>
              </Button>
              <Button variant="hero" size="lg" className="w-full min-h-[52px] px-3" asChild>
                <Link to="/services">
                  <Wrench className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate">Services</span>
                </Link>
              </Button>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full min-h-[60px] text-sm sm:text-base md:text-lg font-semibold px-3 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground shadow-lg"
              asChild
            >
              <Link to="/mmar-care">
                <User className="w-5 h-5 mr-2 shrink-0" />
                <span className="truncate">Join MMAR Care — Member Plans</span>
              </Link>
            </Button>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-muted-foreground animate-fade-in px-4"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm sm:text-base">Lehigh Acres and Fort Myers</span>
            </div>
            <a href="tel:8135017572" onClick={() => trackConversion("phone_call")} className="flex items-center gap-2 hover:text-accent transition-colors active:scale-95">
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
