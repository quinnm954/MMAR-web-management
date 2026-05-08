import { ReactNode } from "react";
import logo from "@/assets/mmar-logo.jpeg";
import { Phone, MessageSquare, Globe } from "lucide-react";

interface Props {
  docType: "ESTIMATE" | "INVOICE" | "RECEIPT";
  docNumber?: string | null;
  rightMeta?: ReactNode;
  children: ReactNode;
}

const PHONE = "813-501-7572";
const SHOP = "Mike's Mobile Auto Repair";
const SITE = "mikesmautorepair.com";

const BrandedDocLayout = ({ docType, docNumber, rightMeta, children }: Props) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Document */}
      <div className="max-w-3xl mx-auto p-4 sm:p-6 print:p-0">
        <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm overflow-hidden print:shadow-none print:border-0">
          {/* Branded Header */}
          <header className="bg-gradient-to-br from-primary/10 via-card to-accent/5 px-6 py-5 border-b border-border">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <img src={logo} alt="MMAR Care" className="h-14 w-14 rounded-md object-cover ring-1 ring-border" />
                <div>
                  <div className="text-lg font-bold leading-tight">{SHOP}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                    <a href={`tel:${PHONE}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" /> {PHONE}
                    </a>
                    <a href={`sms:${PHONE}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <MessageSquare className="h-3 w-3" /> Text
                    </a>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {SITE}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{docType}</div>
                {docNumber && <div className="font-mono text-base font-semibold">{docNumber}</div>}
                {rightMeta && <div className="text-xs text-muted-foreground mt-1">{rightMeta}</div>}
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="px-6 py-6">{children}</div>

          {/* Branded Footer */}
          <footer className="px-6 py-4 border-t border-border bg-muted/30 text-[11px] text-muted-foreground space-y-1">
            <p>
              Powered by <span className="font-semibold text-foreground">MMAR Care</span> — the customer service platform for {SHOP}.
              Manage vehicles, service history, estimates &amp; invoices anytime at <span className="text-foreground">{SITE}/portal</span>.
            </p>
            <p>
              Questions about this document? Call or text <a className="text-primary font-medium" href={`tel:${PHONE}`}>{PHONE}</a>.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default BrandedDocLayout;
