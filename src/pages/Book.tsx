import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuoteRequestDialog from "@/components/QuoteRequestDialog";
import { Phone, ArrowRight, Wrench } from "lucide-react";
import { categories } from "@/data/serviceCategories";
import { trackConversion } from "@/lib/gtag";

const COMMON_SERVICES = [
  "Oil & Filter Change",
  "Brake Service",
  "Tire Rotation",
  "Battery Replacement",
  "Check Engine Light Diagnostics",
  "AC Service",
  "Pre-Purchase Inspection",
  "Other / Not Sure",
];

const Book = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "Book Mobile Auto Service | MMAR Care";
  }, []);

  const open = (service: string | null) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-sky">BOOK</span>{" "}
              <span className="text-gold">MOBILE SERVICE</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Pick the service you need. We'll collect your vehicle info and preferred time
              in one quick step, then text you to confirm.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href="tel:8135017572" onClick={() => trackConversion()}>
                  <Phone className="w-4 h-4 mr-2" /> Or call (813) 501-7572
                </a>
              </Button>
            </div>
          </div>

          <h2 className="font-display text-xl tracking-wide mb-3">
            <span className="text-sky">POPULAR</span>{" "}
            <span className="text-gold">SERVICES</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {COMMON_SERVICES.map((s) => (
              <Card
                key={s}
                className="cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => open(s === "Other / Not Sure" ? null : s)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{s}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="font-display text-xl tracking-wide mb-3">
            <span className="text-sky">BROWSE</span>{" "}
            <span className="text-gold">BY CATEGORY</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.id}
                  to={`/services/${c.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/60 transition-colors h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {c.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
      <FloatingCallButton />
      <QuoteRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceName={selectedService}
      />
    </div>
  );
};

export default Book;
