import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const ShopFlow = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={mmarLogo} 
                alt="MMAR Logo" 
                className="h-12 md:h-14 w-auto rounded"
              />
            </Link>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Main Site
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Project Showcase</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide mb-6 animate-slide-up">
              <span className="text-sky">SHOP</span>{" "}
              <span className="text-gold">FLOW</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              A comprehensive shop management system designed to streamline 
              auto repair operations, track inventory, and manage customer relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Features Placeholder */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
              <span className="text-sky">KEY</span>{" "}
              <span className="text-gold">FEATURES</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-card rounded-2xl p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl tracking-wide text-foreground mb-3">
                Inventory Management
              </h3>
              <p className="text-muted-foreground">
                Track parts, supplies, and equipment with real-time inventory updates.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl tracking-wide text-foreground mb-3">
                Job Scheduling
              </h3>
              <p className="text-muted-foreground">
                Manage appointments, track job progress, and optimize technician schedules.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center hover-lift">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl tracking-wide text-foreground mb-3">
                Shop Operations
              </h3>
              <p className="text-muted-foreground">
                Streamline workflows, generate reports, and manage customer communications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-2xl p-12 max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground mb-4">
              FULL DEMO COMING SOON
            </h2>
            <p className="text-muted-foreground mb-8">
              This space will showcase the complete Shop Flow application with live 
              functionality and interactive demonstrations.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/#contact">Get Notified When Ready</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mike's Mobile Auto Repair LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ShopFlow;
