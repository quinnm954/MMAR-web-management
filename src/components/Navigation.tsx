import { useState } from "react";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, NavLink } from "react-router-dom";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SERVICES = [
  { to: "/services", label: "All Services" },
  { to: "/mobile-vehicle-diagnostics", label: "Diagnostics" },
  { to: "/mobile-brake-repair", label: "Brake Repair" },
  { to: "/mobile-battery-replacement", label: "Battery Replacement" },
  { to: "/mobile-alternator-repair", label: "Alternator Repair" },
  { to: "/mobile-starter-repair", label: "Starter Repair" },
  { to: "/mobile-no-start-diagnostics", label: "No-Start Diagnostics" },
  { to: "/emergency-roadside-mechanic", label: "Emergency Roadside Mechanic" },
];

const AREAS = [
  { to: "/service-areas", label: "All Service Areas" },
  { to: "/areas/lehigh-acres", label: "Lehigh Acres" },
  { to: "/areas/fort-myers", label: "Fort Myers" },
  { to: "/areas/cape-coral", label: "Cape Coral" },
  { to: "/areas/estero", label: "Estero" },
  { to: "/areas/bonita-springs", label: "Bonita Springs" },
  { to: "/areas/naples", label: "Naples" },
];

const RESOURCES = [
  { to: "/blog", label: "Blog" },
  { to: "/reviews", label: "Reviews" },
  { to: "/financing-contract", label: "Financing Contract" },
  { to: "/warranty-policy", label: "Warranty Policy" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-area-inset">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform" onClick={close}>
            <img src={mmarLogo} alt="MMAR Logo" className="h-10 sm:h-12 md:h-14 w-auto rounded" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            <NavLink to="/" end className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              Home
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              About
            </NavLink>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-primary font-medium">
                Services <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background z-50">
                {SERVICES.map((s, i) => (
                  <div key={s.to}>
                    {i === 1 && <DropdownMenuSeparator />}
                    <DropdownMenuItem asChild>
                      <Link to={s.to} className="cursor-pointer">{s.label}</Link>
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-primary font-medium">
                Service Areas <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-background z-50">
                {AREAS.map((a, i) => (
                  <div key={a.to}>
                    {i === 1 && <DropdownMenuSeparator />}
                    <DropdownMenuItem asChild>
                      <Link to={a.to} className="cursor-pointer">{a.label}</Link>
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-primary font-medium">
                Resources <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-background z-50">
                {RESOURCES.map((r) => (
                  <DropdownMenuItem key={r.to} asChild>
                    <Link to={r.to} className="cursor-pointer">{r.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink to="/contact" className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              Contact
            </NavLink>

            <Button variant="hero" size="default" asChild className="ml-2">
              <a href="tel:8135017572">
                <Phone className="w-4 h-4 mr-1" /> Call Now
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-3 -mr-2 text-foreground hover:text-primary transition-colors active:scale-95"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={close} className="text-foreground hover:text-primary font-medium py-3 px-2 rounded-lg">Home</Link>
              <Link to="/about" onClick={close} className="text-foreground hover:text-primary font-medium py-3 px-2 rounded-lg">About MMAR</Link>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="services" className="border-none">
                  <AccordionTrigger className="px-2 py-3 hover:no-underline font-medium text-foreground">Services</AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col">
                      {SERVICES.map((s) => (
                        <Link key={s.to} to={s.to} onClick={close} className="text-muted-foreground hover:text-primary py-2.5 px-4 rounded-lg">
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="areas" className="border-none">
                  <AccordionTrigger className="px-2 py-3 hover:no-underline font-medium text-foreground">Service Areas</AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col">
                      {AREAS.map((a) => (
                        <Link key={a.to} to={a.to} onClick={close} className="text-muted-foreground hover:text-primary py-2.5 px-4 rounded-lg">
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="resources" className="border-none">
                  <AccordionTrigger className="px-2 py-3 hover:no-underline font-medium text-foreground">Resources</AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col">
                      {RESOURCES.map((r) => (
                        <Link key={r.to} to={r.to} onClick={close} className="text-muted-foreground hover:text-primary py-2.5 px-4 rounded-lg">
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link to="/contact" onClick={close} className="text-foreground hover:text-primary font-medium py-3 px-2 rounded-lg">Contact</Link>

              <Button variant="hero" size="lg" asChild className="mt-3 min-h-[48px]">
                <a href="tel:8135017572" onClick={close}>
                  <Phone className="w-4 h-4 mr-2" /> Call (813) 501-7572
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
