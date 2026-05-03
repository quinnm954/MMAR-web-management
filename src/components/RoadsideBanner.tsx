import { useState } from "react";
import { AlertTriangle, Phone, X } from "lucide-react";
import { trackConversion } from "@/lib/gtag";

const RoadsideBanner = () => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold truncate">
            Stranded? Roadside help available now —{" "}
          </span>
          <a
            href="tel:8135017572"
            onClick={() => trackConversion()}
            className="underline font-bold inline-flex items-center gap-1 whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" /> (813) 501-7572
          </a>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Dismiss roadside banner"
          className="shrink-0 hover:opacity-80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RoadsideBanner;
