import { Star, Quote, ExternalLink, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

const reviewPlatforms = [
  {
    name: "Google",
    url: "https://share.google/bx2Gb42dslCITJdS8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path fill="currentColor" d="M21.6 12.227c0-.7-.063-1.374-.18-2.022H12v3.823h5.385a4.604 4.604 0 0 1-1.997 3.022v2.51h3.232c1.89-1.74 2.98-4.302 2.98-7.333Z"/>
        <path fill="currentColor" d="M12 22c2.7 0 4.964-.895 6.62-2.44l-3.232-2.51c-.896.6-2.04.955-3.388.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.997 9.997 0 0 0 12 22Z"/>
        <path fill="currentColor" d="M6.402 13.882A6.01 6.01 0 0 1 6.09 12c0-.654.113-1.288.312-1.882V7.528H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.064 4.472l3.338-2.59Z"/>
        <path fill="currentColor" d="M12 5.977c1.47 0 2.787.506 3.823 1.498l2.868-2.867C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.064 7.528l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977Z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/Mikesmobileautorepairllc/",
    icon: <Facebook className="w-5 h-5" />,
  },
  {
    name: "Yelp",
    url: "https://www.yelp.com/biz/mikes-mobile-auto-repair-lehigh-acres",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
        <path d="M13.5 2.1c-.4-.3-3.6.5-4.2 1.1-.2.2-.3.4-.3.7 0 .2 0 .2 1.4 2.6 2.3 4 2.4 4.1 2.7 4.2.6.2 1-.2 1.2-1.1.2-.7.3-5.7.1-6.5-.1-.5-.4-.8-.9-1Zm-7.4 4.3c-.3.1-.5.4-.6.8-.2.7-.1 4.1.1 4.6.1.4.4.7.8.7.2 0 .8-.3 3.4-1.6 1.7-.9 3.1-1.6 3.2-1.7.2-.2.3-.4.2-.7 0-.4-.2-.6-.7-1-1.6-1.4-5.6-3-6.4-2.7Zm14.2 4.4c-.3-.4-.6-.5-3.4-1-1.5-.3-2.9-.5-3-.5-.5 0-.9.4-.9.9 0 .3.1.6.9 1.6.5.7 1.1 1.4 1.4 1.7 1 1.1 1.2 1.2 1.7 1 .7-.2 2.6-2 3.1-2.9.3-.5.3-.5.2-.8Zm-9.7 1.4c-.4 0-.6.2-2.1 2-1.7 2-1.7 2-1.7 2.4 0 .4.3.7.9.9 1.2.5 4.2.9 4.7.7.4-.2.6-.5.6-1.1-.1-1-.7-4.4-.9-4.6-.2-.2-.6-.4-1-.3Zm5.3 4.1c-.4-.6-.7-.7-1.1-.5-.4.2-2.7 3-3 3.7-.2.4-.1.8.2 1.1.4.4 2.7 1.4 3.4 1.5.5 0 .8-.2 1-.6.2-.4.5-3.7.4-4.4 0-.3-.2-.5-.4-.8h-.5Z"/>
      </svg>
    ),
  },
  {
    name: "Nextdoor",
    url: "https://nextdoor.com/page/mikes-mobile-auto-repair-llc-lehigh-acres-fl",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
        <path d="M6.6 2.5c1.1 0 1.7.6 1.7 1.7v2.4c1.1-1.4 2.7-2.2 4.7-2.2 3.4 0 5.4 2.3 5.4 5.9v8c0 1.7-.5 2.7-2 3.1-1.7.5-3-.6-3-2.3v-7.6c0-1.7-.8-2.6-2.4-2.6-1.6 0-2.7 1-2.7 2.7v7.5c0 1.7-.6 2.4-2.5 2.4S3 21 3 19.3V4.2c0-1.1.6-1.7 1.7-1.7h1.9Z"/>
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Marcus Johnson",
    location: "Fort Myers, FL",
    rating: 5,
    text: "Mike came out to my office parking lot and fixed my brakes while I was in meetings. Incredible service and saved me so much time!",
  },
  {
    name: "Sarah Thompson",
    location: "Lehigh Acres, FL",
    rating: 5,
    text: "Honest, reliable, and professional. My car broke down on a Saturday and Mike was there within an hour. Highly recommend!",
  },
  {
    name: "David Chen",
    location: "Naples, FL",
    rating: 5,
    text: "Best mobile mechanic in Lehigh Acres and Fort Myers. Fair prices and he explains everything clearly. Been using him for all my vehicles.",
  },
  {
    name: "Jennifer Williams",
    location: "Cape Coral, FL",
    rating: 5,
    text: "As a single mom, having a mechanic come to my home is a lifesaver. Mike is trustworthy and does excellent work every time.",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">CUSTOMER</span>{" "}
            <span className="text-gold">REVIEWS</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            See what our satisfied customers have to say
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="glass-card rounded-2xl p-6 md:p-8 hover-lift animate-slide-up relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-accent text-accent"
                  />
                ))}
              </div>

              <p className="text-foreground/90 leading-relaxed mb-6 text-sm md:text-base">
                "{testimonial.text}"
              </p>

              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center text-center max-w-xl mx-auto mt-10 md:mt-12">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 text-accent fill-accent" />
            ))}
          </div>
          <h3 className="font-display text-xl md:text-2xl tracking-wide text-foreground mb-3">
            5-STAR RATED
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            See what our customers are saying about Mike's Mobile Auto Repair across Google, Facebook, Yelp, and Nextdoor.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {reviewPlatforms.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 text-foreground hover:text-primary transition-all active:scale-[0.98] min-h-[88px]"
              >
                <span className="text-primary">{p.icon}</span>
                <span className="text-sm font-semibold">{p.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
