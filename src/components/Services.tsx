import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuoteRequestDialog from "./QuoteRequestDialog";
import { categories } from "@/data/serviceCategories";

const Services = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleServiceClick = (serviceName: string) => {
    setSelectedService(serviceName);
    setDialogOpen(true);
  };

  return (
    <section id="services" className="py-16 md:py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">COMPLETE AUTOMOTIVE</span>{" "}
            <span className="text-gold">SERVICES</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Browse by category and tap any service to request a quote instantly via text
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="space-y-3">
            {categories.map((category) => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="glass-card rounded-xl border border-border/50 overflow-hidden"
              >
                <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline group">
                  <div className="flex items-center gap-3 md:gap-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground group-hover:text-primary transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground font-normal">
                        {category.services.length} services
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 md:px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.services.map((service) => (
                      <button
                        key={service.name}
                        onClick={() => handleServiceClick(service.name)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 text-left transition-all active:scale-[0.98] min-h-[56px] group"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <service.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                          {service.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 px-1">
                    <Link
                      to={`/services/${category.id}`}
                      className="text-sm text-primary hover:underline underline-offset-4"
                    >
                      View {category.title} details →
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <QuoteRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceName={selectedService}
      />
    </section>
  );
};

export default Services;
