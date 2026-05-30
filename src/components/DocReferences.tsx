import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditCard, ShieldCheck, Wrench, ExternalLink } from "lucide-react";

interface Props {
  /** Optional: when set, the financing accordion shows a "Start financing" button linked with this estimate. */
  financingHref?: string;
  /** Hide the financing section entirely (e.g., for paid receipts). */
  hideFinancing?: boolean;
  /** Optional estimate id to pass through to the warranty page so it can show the linked summary. */
  estimateId?: string;
  /** Optional public approval token to pass through (used when viewer isn't authenticated). */
  estimateToken?: string;
}

const DocReferences = ({ financingHref, hideFinancing, estimateId, estimateToken }: Props) => {
  const ctxQuery = estimateToken
    ? `?token=${encodeURIComponent(estimateToken)}`
    : estimateId
    ? `?estimate=${encodeURIComponent(estimateId)}`
    : "";
  const warrantyHref = `/warranty-policy${ctxQuery}`;
  const financingFallbackHref = `/financing-contract${ctxQuery}`;
  return (
    <div className="mt-8 print:hidden">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Programs &amp; Policies</div>
      <Accordion type="multiple" className="border border-border rounded-md divide-y divide-border bg-muted/20">
        {!hideFinancing && (
          <AccordionItem value="financing" className="border-0 px-3">
            <AccordionTrigger className="hover:no-underline text-sm py-3">
              <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> In-House Financing Available</span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2 pb-3">
              <p>
                Need help spreading payments out? We offer in-house financing on qualifying repairs:
                <strong className="text-foreground"> 100% of parts plus 50% of labor down</strong>, with the remainder financed at
                <strong className="text-foreground"> 25% annual simple interest over 12 monthly payments</strong>. Governed by Florida law (Lee County venue).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {financingHref ? (
                  <Button asChild size="sm" variant="hero">
                    <Link to={financingHref}>Start financing application</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link to={financingFallbackHref}>View financing terms</Link>
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="warranty" className="border-0 px-3">
          <AccordionTrigger className="hover:no-underline text-sm py-3">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Warranty Policy</span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pb-3">
            <p>
              All repairs are backed by our written warranty policy. It complies with the Magnuson-Moss Warranty Act, includes
              standard disclaimers for implied warranties, and is governed by Florida law (Lee County venue). By approving service,
              you acknowledge the policy.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to={warrantyHref}>
                Read full warranty <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="mmar" className="border-0 px-3">
          <AccordionTrigger className="hover:no-underline text-sm py-3">
            <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-accent" /> MMAR Care Program</span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pb-3">
            <p>
              Members of <strong className="text-foreground">MMAR Care</strong> get included oil changes, labor discounts, priority
              scheduling, and exclusive perks — all on a low monthly plan. Stack savings on top of your current invoice.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/mmar-care">
                Explore MMAR Care plans <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default DocReferences;
