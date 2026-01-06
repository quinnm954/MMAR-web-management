import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marcus Johnson",
    location: "Greenville, SC",
    rating: 5,
    text: "Mike came out to my office parking lot and fixed my brakes while I was in meetings. Incredible service and saved me so much time!",
  },
  {
    name: "Sarah Thompson",
    location: "Spartanburg, SC",
    rating: 5,
    text: "Honest, reliable, and professional. My car broke down on a Saturday and Mike was there within an hour. Highly recommend!",
  },
  {
    name: "David Chen",
    location: "Greer, SC",
    rating: 5,
    text: "Best mobile mechanic in the Upstate. Fair prices and he explains everything clearly. Been using him for all my vehicles.",
  },
  {
    name: "Jennifer Williams",
    location: "Mauldin, SC",
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

        <div className="text-center mt-10 md:mt-12">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-6 py-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-foreground font-semibold">5.0</span>
            <span className="text-muted-foreground text-sm">Average Rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
