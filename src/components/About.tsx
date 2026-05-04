import { Shield, Clock, MapPin, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "ASE-Level Quality",
    description: "Professional service you can trust with every repair",
  },
  {
    icon: Clock,
    title: "On-Site Service",
    description: "We come to you - at home, work, or anywhere convenient",
  },
  {
    icon: MapPin,
    title: "Local Experts",
    description: "Proudly serving Lehigh Acres and Fort Myers",
  },
  {
    icon: Award,
    title: "Years of Experience",
    description: "Trusted automotive expertise for all vehicle makes",
  },
];

const About = () => {
  return (
    <section id="about" className="py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">ABOUT</span>{" "}
            <span className="text-gold">US</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed px-2">
            Mike's Mobile Auto Repair LLC is committed to delivering professional,
            on-site auto repair services with excellence and convenience. What
            started as a local service remains proudly dedicated
            to serving the Lehigh Acres and Fort Myers community.
          </p>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mt-4 px-2">
            With years of experience, ASE-level quality, and a customer-first
            mindset, we're proud to be your trusted partner for automotive repair —
            wherever you are.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card rounded-xl p-5 md:p-6 hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
