import { useState } from "react";
import { ClipboardList, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuoteRequestDialog from "./QuoteRequestDialog";
import { trackConversion } from "@/lib/gtag";

interface RequestQuoteCTAProps {
  serviceName: string;
  heading?: string;
  subheading?: string;
}

const RequestQuoteCTA = ({
  serviceName,
  heading = "Request a Free Quote",
  subheading = "Tell us about your vehicle — we'll text you back fast with a transparent price.",
}: RequestQuoteCTAProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="glass-card rounded-xl p-6 md:p-8 border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 text-center">
        <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-2">
          <span className="text-sky">REQUEST</span>{" "}
          <span className="text-gold">A QUOTE</span>
        </h2>
        <p className="text-muted-foreground mb-5 max-w-xl mx-auto text-sm md:text-base">
          {subheading}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="hero"
            size="lg"
            className="min-h-[48px]"
            onClick={() => setOpen(true)}
          >
            <ClipboardList className="mr-2" /> {heading}
          </Button>
          <Button variant="heroOutline" size="lg" className="min-h-[48px]" asChild>
            <a href="tel:8135017572" onClick={() => trackConversion()}>
              <Phone className="mr-2" /> Call (813) 501-7572
            </a>
          </Button>
        </div>
      </div>

      <QuoteRequestDialog
        open={open}
        onOpenChange={setOpen}
        serviceName={serviceName}
      />
    </>
  );
};

export default RequestQuoteCTA;
