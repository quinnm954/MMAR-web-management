import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#services", label: "Services" },
    { href: "#plans", label: "Plans" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <img 
              src={mmarLogo} 
              alt="MMAR Logo" 
              className="h-12 md:h-14 w-auto rounded"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/garage-ace"
              className="text-accent font-semibold hover:text-accent/80 transition-colors duration-200"
            >
              Garage Ace
            </Link>
            <Button variant="hero" size="default" asChild>
              <a href="#contact">Get a Quote</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/garage-ace"
                onClick={() => setIsOpen(false)}
                className="text-accent font-semibold hover:text-accent/80 transition-colors duration-200 py-2"
              >
                Garage Ace
              </Link>
              <Button variant="hero" size="lg" asChild className="mt-2">
                <a href="#contact" onClick={() => setIsOpen(false)}>
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
