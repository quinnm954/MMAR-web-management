import { Phone } from "lucide-react";

const FloatingCallButton = () => {
  return (
    <a
      href="tel:8039536194"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3 rounded-full shadow-lg hover:bg-accent/90 active:scale-95 transition-all duration-200 md:hidden animate-fade-in"
      aria-label="Call Mike's Mobile Auto Repair"
    >
      <Phone className="w-5 h-5" />
      <span className="font-semibold text-sm">Call Now</span>
    </a>
  );
};

export default FloatingCallButton;
