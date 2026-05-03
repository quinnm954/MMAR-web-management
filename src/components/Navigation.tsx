import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#services", label: "Services" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-area-inset">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 active:scale-95 transition-transform">
            <img 
              src={mmarLogo} 
              alt="MMAR Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto rounded"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                Forms <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/financing-contract" className="cursor-pointer">
                    Financing Contract
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/warranty-policy" className="cursor-pointer">
                    Warranty Policy
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="hero" size="default" asChild>
              <a href="tel:8135017572">Get a Quote</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-3 -mr-2 text-foreground hover:text-primary transition-colors active:scale-95"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors duration-200 font-medium py-3 px-2 rounded-lg active:scale-[0.98]"
                >
                  {link.label}
                </a>
              ))}
              <div className="py-2 px-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Forms</p>
                <Link
                  to="/financing-contract"
                  onClick={() => setIsOpen(false)}
                  className="block text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors duration-200 font-medium py-2 px-2 rounded-lg active:scale-[0.98]"
                >
                  Financing Contract
                </Link>
                <Link
                  to="/warranty-policy"
                  onClick={() => setIsOpen(false)}
                  className="block text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors duration-200 font-medium py-2 px-2 rounded-lg active:scale-[0.98]"
                >
                  Warranty Policy
                </Link>
              </div>
              <a
                href="https://garage-ace.mikesmautorepair.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="text-accent font-semibold hover:text-accent/80 hover:bg-secondary/50 transition-colors duration-200 py-3 px-2 rounded-lg active:scale-[0.98]"
              >
                Garage Ace
              </a>
              <Button variant="hero" size="lg" asChild className="mt-3 min-h-[48px]">
                <a href="tel:8135017572" onClick={() => setIsOpen(false)}>
                  Get a Quote
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
