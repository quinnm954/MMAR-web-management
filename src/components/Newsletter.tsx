import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate subscription
    setTimeout(() => {
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive our weekly updates and discounts.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 md:mb-6">
            <Mail className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide text-foreground mb-3 md:mb-4">
            JOIN OUR WEEKLY NEWSLETTER
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 px-2">
            Get free weekly updates and surprise discounts on services delivered
            straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto px-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-card border-border focus:border-primary min-h-[48px] text-base"
            />
            <Button type="submit" variant="hero" className="min-h-[48px] sm:w-auto" disabled={isLoading}>
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
