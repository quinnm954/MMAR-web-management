import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConversion } from "@/lib/gtag";

const InlineCallStrip = ({ label = "Need help right now?" }: { label?: string }) => {
  return (
    <div className="my-8 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="font-semibold text-foreground text-base md:text-lg text-center sm:text-left">
        {label}
      </p>
      <div className="flex gap-3 w-full sm:w-auto">
        <Button variant="hero" size="lg" className="min-h-[48px] flex-1 sm:flex-none" asChild>
          <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
            <Phone className="mr-2" /> Call
          </a>
        </Button>
        <Button variant="heroOutline" size="lg" className="min-h-[48px] flex-1 sm:flex-none" asChild>
          <a href="sms:8135017572" onClick={() => trackConversion("text_click")}>
            <MessageSquare className="mr-2" /> Text
          </a>
        </Button>
      </div>
    </div>
  );
};

export default InlineCallStrip;
