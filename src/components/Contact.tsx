import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Create mailto link with form data
    const subject = encodeURIComponent(`Contact from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:mikesmarllc@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      toast({
        title: "Opening email client",
        description: "Complete sending your message in your email app.",
      });
      setFormData({ name: "", email: "", message: "" });
      setIsLoading(false);
    }, 500);
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

          {/* Contact Form */}
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl tracking-wide text-foreground mb-5 md:mb-6">
              SEND US A MESSAGE
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="bg-card border-border focus:border-primary min-h-[48px] text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="bg-card border-border focus:border-primary min-h-[48px] text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={4}
                  className="bg-card border-border focus:border-primary resize-none text-base"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full min-h-[52px] text-base"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
