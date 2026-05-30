import { useState } from "react";
import { Menu, X, ChevronDown, Phone, User, LogOut, LayoutDashboard, CalendarCheck, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  { to: "/brake-repair", label: "Brake Repair" },
  { to: "/oil-change", label: "Oil Change" },
  { to: "/diagnostics", label: "Diagnostics" },
  { to: "/battery-alternator-starter", label: "Battery / Alternator / Starter" },
  { to: "/no-start-diagnostics", label: "No-Start Diagnostics" },
];

const AREAS = [
  { to: "/service-areas", label: "All Service Areas" },
  { to: "/mobile-mechanic-lehigh-acres", label: "Lehigh Acres" },
  { to: "/mobile-mechanic-fort-myers", label: "Fort Myers" },
];

const RESOURCES = [
  { to: "/blog", label: "Blog" },
  { to: "/reviews", label: "Reviews" },
  { to: "/financing-contract", label: "Financing Contract" },
  { to: "/warranty-policy", label: "Warranty Policy" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const close = () => setIsOpen(false);

  const isAdminLike = roles.includes("admin") || roles.includes("owner");

  const portalHome = isAdminLike
    ? "/admin/dashboard"
    : roles.some((r) => ["technician", "service_advisor", "manager", "parts"].includes(r))
      ? "/tech"
      : "/portal/dashboard";
  const portalLabel = isAdminLike
    ? "Admin"
    : roles.some((r) => ["technician", "service_advisor", "manager", "parts"].includes(r))
      ? "Staff Portal"
      : "Garage Ace";

  const handleSignOut = async () => {
    close();
    await signOut();
    navigate("/", { replace: true });
  };

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

            <NavLink to="/mmar-care" className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              MMAR Care Plans
            </NavLink>


            <NavLink to="/book" className={({ isActive }) => `px-3 py-2 font-semibold transition-colors ${isActive ? "text-accent" : "text-accent/90 hover:text-accent"}`}>
              Book
            </NavLink>

            <NavLink to="/garage-ace" className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              Garage Ace
            </NavLink>

            <NavLink to="/contact" className={({ isActive }) => `px-3 py-2 font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              Contact
            </NavLink>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-1" /> Account <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={portalHome} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> {portalLabel}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button variant="hero" size="default" asChild>
              <Link to="/book">
                <CalendarCheck className="w-4 h-4 mr-1" /> Book
              </Link>
            </Button>
            <Button variant="heroOutline" size="default" asChild>
              <a href="tel:8135017572">
                <Phone className="w-4 h-4 mr-1" /> Call
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
          <div className="lg:hidden py-2 border-t border-border animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-0.5 pb-[env(safe-area-inset-bottom)]">
              <Link to="/" onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg">Home</Link>
              <Link to="/about" onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg">About MMAR</Link>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="services" className="border-none">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline font-medium text-foreground">Services</AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="flex flex-col">
                      {SERVICES.map((s) => (
                        <Link key={s.to} to={s.to} onClick={close} className="text-muted-foreground hover:text-primary py-1.5 px-4 rounded-lg text-sm">
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="areas" className="border-none">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline font-medium text-foreground">Service Areas</AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="flex flex-col">
                      {AREAS.map((a) => (
                        <Link key={a.to} to={a.to} onClick={close} className="text-muted-foreground hover:text-primary py-1.5 px-4 rounded-lg text-sm">
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="resources" className="border-none">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline font-medium text-foreground">Resources</AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="flex flex-col">
                      {RESOURCES.map((r) => (
                        <Link key={r.to} to={r.to} onClick={close} className="text-muted-foreground hover:text-primary py-1.5 px-4 rounded-lg text-sm">
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link to="/mmar-care" onClick={close} className="text-foreground hover:text-primary font-semibold py-2 px-2 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> MMAR Care Plans
              </Link>
              <Link to="/why-garage-ace" onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg flex items-center gap-2">
                <User className="w-4 h-4" /> Why the App?
              </Link>
              
              <Link to="/garage-ace" onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Garage Ace
              </Link>
              <Link to="/contact" onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg">Contact</Link>
              {user ? (
                <>
                  <Link to={portalHome} onClick={close} className="text-foreground hover:text-primary font-medium py-2 px-2 rounded-lg flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> {portalLabel}
                  </Link>
                  <div className="px-2 text-xs text-muted-foreground truncate">Signed in as {user.email}</div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-destructive hover:text-destructive/80 font-medium py-2 px-2 rounded-lg flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : null}

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="hero" size="default" asChild className="min-h-[44px]">
                  <Link to="/book" onClick={close}>
                    <CalendarCheck className="w-4 h-4 mr-1" /> Book
                  </Link>
                </Button>
                <Button variant="heroOutline" size="default" asChild className="min-h-[44px]">
                  <a href="tel:8135017572" onClick={close}>
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
