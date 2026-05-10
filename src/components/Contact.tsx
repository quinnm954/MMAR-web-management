import { Phone, Mail, Star, MapPin, Image as ImageIcon } from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import { trackConversion } from "@/lib/gtag";

const GMB_URL = "https://share.google/bx2Gb42dslCITJdS8";

const Contact = () => {
  const handleContactClick = () => {
    trackConversion();
  };

  return (
    <section id="contact" className="py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">CONTACT</span>{" "}
            <span className="text-gold">US</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 flex items-center justify-center mb-6 md:mb-8">
            <img
              src={mmarLogo}
              alt="Mike's Mobile Auto Repair"
              className="w-full max-w-sm h-auto rounded-lg"
            />
          </div>

          <div className="space-y-3 md:space-y-4">
            <a
              href="tel:8135017572"
              onClick={handleContactClick}
              className="flex items-center gap-4 p-4 glass-card rounded-xl hover-lift group active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-foreground font-semibold text-lg">(813) 501-7572</p>
              </div>
            </a>

            <a
              href="mailto:mikesmarllc@gmail.com"
              onClick={handleContactClick}
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
          </div>

          <div className="mt-6 md:mt-8">
            <h3 className="font-display text-xl md:text-2xl tracking-wide text-center mb-4">
              <span className="text-sky">FIND US ON</span>{" "}
              <span className="text-gold">GOOGLE</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={GMB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleContactClick}
                className="flex items-center gap-3 p-4 glass-card rounded-xl hover-lift active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold">Reviews</span>
              </a>
              <a
                href={GMB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleContactClick}
                className="flex items-center gap-3 p-4 glass-card rounded-xl hover-lift active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold">Directions</span>
              </a>
              <a
                href={GMB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleContactClick}
                className="flex items-center gap-3 p-4 glass-card rounded-xl hover-lift active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold">Photos</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
