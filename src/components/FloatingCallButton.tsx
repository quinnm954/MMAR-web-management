import { Phone, MessageCircle, MapPin } from "lucide-react";
import { trackConversion } from "@/lib/gtag";

const GMB_CID = "4273245475534037331";
const DIRECTIONS_URL = `https://www.google.com/maps?cid=${GMB_CID}`;

const FloatingCallButton = () => {
  const handleContactClick = () => {
    trackConversion();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:hidden animate-fade-in">
      <a
        href="sms:8135017572"
        onClick={handleContactClick}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
        aria-label="Text Mike's Mobile Auto Repair"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold text-sm">Text Us</span>
      </a>
      <a
        href={DIRECTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-secondary/90 active:scale-95 transition-all duration-200"
        aria-label="Get directions to Mike's Mobile Auto Repair"
      >
        <MapPin className="w-5 h-5" />
        <span className="font-semibold text-sm">Directions</span>
      </a>
      <a
        href="tel:8135017572"
        onClick={handleContactClick}
        className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3 rounded-full shadow-lg hover:bg-accent/90 active:scale-95 transition-all duration-200"
        aria-label="Call Mike's Mobile Auto Repair"
      >
        <Phone className="w-5 h-5" />
        <span className="font-semibold text-sm">Call Now</span>
      </a>
    </div>
  );
};

export default FloatingCallButton;
