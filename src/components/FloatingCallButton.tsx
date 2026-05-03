import { useState } from "react";
import { Phone, MessageCircle, MapPin, Navigation } from "lucide-react";
import { trackConversion } from "@/lib/gtag";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const GMB_CID = "4273245475534037331";
const ADDRESS = "Mike's Mobile Auto Repair, Fort Myers, FL";
const ENCODED = encodeURIComponent(ADDRESS);

const NAV_APPS = [
  {
    name: "Google Maps",
    href: `https://www.google.com/maps?cid=${GMB_CID}`,
  },
  {
    name: "Apple Maps",
    href: `https://maps.apple.com/?q=${ENCODED}`,
  },
  {
    name: "Waze",
    href: `https://waze.com/ul?q=${ENCODED}&navigate=yes`,
  },
];

const FloatingCallButton = () => {
  const [navOpen, setNavOpen] = useState(false);

  const handleContactClick = () => {
    trackConversion();
  };

  return (
    <>
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
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-secondary/90 active:scale-95 transition-all duration-200"
          aria-label="Get directions to Mike's Mobile Auto Repair"
        >
          <MapPin className="w-5 h-5" />
          <span className="font-semibold text-sm">Directions</span>
        </button>
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

      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">
              <span className="text-sky">CHOOSE</span>{" "}
              <span className="text-gold">NAVIGATION</span>
            </DialogTitle>
            <DialogDescription>Open directions in your preferred app.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {NAV_APPS.map((app) => (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 transition-all active:scale-[0.98] min-h-[56px]"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">{app.name}</span>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingCallButton;
