import { Phone, MessageCircle, MapPin } from "lucide-react";
import { trackConversion } from "@/lib/gtag";

const GMB_URL = "https://share.google/bx2Gb42dslCITJdS8";
const ADDRESS = "Mike's Mobile Auto Repair, Fort Myers, FL";
const ENCODED = encodeURIComponent(ADDRESS);

const getDirectionsUrl = () => {
  if (typeof navigator === "undefined") {
    return GMB_URL;
  }
  const ua = navigator.userAgent || "";
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform || "";

  // iOS / iPadOS / macOS → Apple Maps
  const isApple =
    /iPhone|iPad|iPod/.test(ua) ||
    /Mac/.test(platform) ||
    (/Mac/.test(ua) && "ontouchend" in document);
  if (isApple) return `https://maps.apple.com/?q=${ENCODED}`;

  // Android → native geo: handler (lets user pick Google Maps, Waze, etc.)
  if (/Android/.test(ua)) {
    return `geo:0,0?q=${ENCODED}`;
  }

  // Everything else → Google Maps
  return GMB_URL;
};

const FloatingCallButton = () => {
  const handleCall = () => trackConversion("phone_call");
  const handleText = () => trackConversion("text_click");

  const handleDirections = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(getDirectionsUrl(), "_blank", "noopener,noreferrer");
  };

  // Compact icon-only stack on phones so the FAB doesn't overlap centered hero CTAs / trust strip.
  // Labels return on small-tablets (sm+) where there's room.
  return (
    <div className="fixed right-3 sm:right-6 z-40 flex flex-col gap-2.5 sm:gap-3 md:hidden animate-fade-in"
         style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      <a
        href="sms:8135017572"
        onClick={handleText}
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 w-12 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
        aria-label="Text Mike's Mobile Auto Repair"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline font-semibold text-sm">Text Us</span>
      </a>
      <a
        href={GMB_URL}
        onClick={handleDirections}
        className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground h-12 w-12 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg hover:bg-secondary/90 active:scale-95 transition-all duration-200"
        aria-label="Get directions to Mike's Mobile Auto Repair"
      >
        <MapPin className="w-5 h-5" />
        <span className="hidden sm:inline font-semibold text-sm">Directions</span>
      </a>
      <a
        href="tel:8135017572"
        onClick={handleCall}
        className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground h-12 w-12 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg hover:bg-accent/90 active:scale-95 transition-all duration-200"
        aria-label="Call Mike's Mobile Auto Repair"
      >
        <Phone className="w-5 h-5" />
        <span className="hidden sm:inline font-semibold text-sm">Call Now</span>
      </a>
    </div>
  );
};

export default FloatingCallButton;
