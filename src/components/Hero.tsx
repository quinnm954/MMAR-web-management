import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle, Wrench, User, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { trackConversion } from "@/lib/gtag";
import heroShelby from "@/assets/hero-shelby.jpg";

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const img = imgRef.current;
    if (!section || !img) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const MAX = 18; // px of parallax travel from pointer / orientation
    const TOUCH_MAX = 22; // px on touch drag

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      img.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
      img.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    // --- Desktop: cursor-driven parallax ---
    const handleMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // touch handled separately
      const rect = section.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = -nx * MAX * 2;
      targetY = -ny * MAX * 2;
    };
    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    // --- Touch: drag/swipe across the hero nudges the image ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchBaseX = 0;
    let touchBaseY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchBaseX = currentX;
      touchBaseY = currentY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      const rect = section.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
      targetX = touchBaseX + nx * TOUCH_MAX;
      targetY = touchBaseY + ny * TOUCH_MAX;
    };
    const handleTouchEnd = () => {
      // Ease back to center after the finger lifts
      targetX = 0;
      targetY = 0;
    };

    // --- Device orientation: passive tilt-based parallax ---
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // gamma: left/right tilt (-90..90), beta: front/back tilt (-180..180)
      const nx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ny = Math.max(-1, Math.min(1, (e.beta - 40) / 40));
      targetX = -nx * MAX;
      targetY = -ny * MAX;
    };

    section.addEventListener("pointermove", handleMove);
    section.addEventListener("pointerleave", handleLeave);
    section.addEventListener("touchstart", handleTouchStart, { passive: true });
    section.addEventListener("touchmove", handleTouchMove, { passive: true });
    section.addEventListener("touchend", handleTouchEnd, { passive: true });
    section.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    // Attach orientation listener when available. iOS 13+ requires an explicit
    // permission request from a user gesture; wire that to the first tap.
    let orientationAttached = false;
    const attachOrientation = () => {
      if (orientationAttached) return;
      window.addEventListener("deviceorientation", handleOrientation);
      orientationAttached = true;
    };
    const DOE = (window as unknown as {
      DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
    }).DeviceOrientationEvent;
    const needsPermission = typeof DOE?.requestPermission === "function";
    const requestOrientationOnce = () => {
      if (!needsPermission) return;
      DOE!.requestPermission!()
        .then((state) => {
          if (state === "granted") attachOrientation();
        })
        .catch(() => {});
    };
    if (!needsPermission) attachOrientation();
    else section.addEventListener("touchstart", requestOrientationOnce, { once: true });

    raf = requestAnimationFrame(tick);
    return () => {
      section.removeEventListener("pointermove", handleMove);
      section.removeEventListener("pointerleave", handleLeave);
      section.removeEventListener("touchstart", handleTouchStart);
      section.removeEventListener("touchmove", handleTouchMove);
      section.removeEventListener("touchend", handleTouchEnd);
      section.removeEventListener("touchcancel", handleTouchEnd);
      section.removeEventListener("touchstart", requestOrientationOnce);
      if (orientationAttached) window.removeEventListener("deviceorientation", handleOrientation);
      cancelAnimationFrame(raf);
    };
  }, []);


  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center justify-center pt-16 md:pt-20 overflow-hidden bg-background"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="w-full h-full animate-hero-rotate motion-reduce:animate-none will-change-transform"
        >
          <img
            ref={imgRef}
            src={heroShelby}
            alt="Ford Shelby GT500 with hood open showing a supercharged engine — mobile mechanic hero"
            width={1920}
            height={1088}
            fetchPriority="high"
            decoding="async"
            className="w-[115%] h-[115%] -ml-[7.5%] -mt-[7.5%] object-cover object-center will-change-transform"
            style={{
              transform: "translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)",
              transition: "transform 0.05s linear",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background" />
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
