import { Button } from "@/components/ui/button";
import { Phone, Mail, Facebook, Star, ExternalLink } from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const Contact = () => {
  return (
    <section id="contact" className="py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">CONTACT</span>{" "}
            <span className="text-gold">US</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6 md:space-y-8">
            <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 flex items-center justify-center">
              <img
                src={mmarLogo}
                alt="Mike's Mobile Auto Repair"
                className="w-full max-w-sm h-auto rounded-lg"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <a
                href="tel:8039536194"
                className="flex items-center gap-4 p-4 glass-card rounded-xl hover-lift group active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-foreground font-semibold text-lg">(803) 953-6194</p>
                </div>
              </a>

              <a
                href="mailto:mikesmarllc@gmail.com"
                className="flex items-center gap-4 p-4 glass-card rounded-xl hover-lift group active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-semibold truncate">
                    mikesmarllc@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://www.facebook.com/mikesmobileautorepairllc/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 glass-card rounded-xl hover-lift group active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                  <Facebook className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facebook</p>
                  <p className="text-foreground font-semibold">Visit our Page</p>
                </div>
              </a>
            </div>
          </div>

          {/* Google Reviews */}
          <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-gold fill-gold" />
              ))}
            </div>
            <h3 className="font-display text-xl md:text-2xl tracking-wide text-foreground mb-3">
              5-STAR RATED
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              See what our customers are saying about Mike's Mobile Auto Repair. We're proud to maintain a 5-star rating on Google!
            </p>
            <Button variant="hero" size="lg" className="min-h-[52px]" asChild>
              <a
                href="https://share.google/81sCiU8gosp3ZhCJD"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>View Our Reviews</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
