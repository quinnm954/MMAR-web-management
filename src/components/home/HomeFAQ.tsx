import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How much does a mobile mechanic cost in Lehigh Acres and Fort Myers?",
    a: "Most repairs are billed the same as a brick-and-mortar shop — there's no separate trip fee inside our regular service area. Diagnostic appointments run $80–$150 and are credited toward any repair we perform. You always get a written quote before any work begins.",
  },
  {
    q: "How fast can you get to me?",
    a: "Same-day appointments are usually available across Lehigh Acres and Fort Myers. Most calls are reached within an hour.",
  },
  {
    q: "Are your repairs warrantied?",
    a: "Yes. Parts and labor on covered repairs are backed by our standard mobile-service warranty, documented in writing. See our warranty policy page for full details.",
  },
  {
    q: "Which areas do you serve?",
    a: "Every Lehigh Acres ZIP (33936, 33971, 33972, 33973, 33974, 33976) and every Fort Myers ZIP. Browse our service-areas page for the full map.",
  },
  {
    q: "How do payments work?",
    a: "We accept all major credit and debit cards, ACH, and offer financing on qualifying repairs. Pricing is quoted up front — no surprise add-ons.",
  },
  {
    q: "Do you bring the parts with you?",
    a: "Yes — our mobile service truck carries quality parts for the most common jobs (batteries, alternators, starters, brake pads and rotors, oil and filters, hoses, sensors). For special-order parts we'll quote and source same-day or next-day.",
  },
];

const HomeFAQ = () => {
  useEffect(() => {
    const id = "ld-home-faq";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">FREQUENTLY ASKED</span>{" "}
            <span className="text-gold">QUESTIONS</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Common questions from Lehigh Acres and Fort Myers drivers.
          </p>
        </div>

        <Accordion type="single" collapsible className="glass-card rounded-xl border border-border/40 px-4 md:px-6">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-base md:text-lg">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default HomeFAQ;
