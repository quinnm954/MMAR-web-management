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
    description: "Proudly serving Greenville & Spartanburg communities",
  },
  {
    icon: Award,
    title: "Years of Experience",
    description: "Trusted automotive expertise for all vehicle makes",
  },
];

const About = () => {
  return (
    <section id="about" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6">
            <span className="text-sky">ABOUT</span>{" "}
            <span className="text-gold">US</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Mike's Mobile Auto Repair LLC is committed to delivering professional,
            on-site auto repair services with excellence and convenience. What
            started as a local service in South Carolina remains proudly dedicated
            to serving Greenville and Spartanburg County communities.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mt-4">
            With years of experience, ASE-level quality, and a customer-first
            mindset, we're proud to be your trusted partner for automotive repair —
            wherever you are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card rounded-xl p-6 hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl tracking-wide text-foreground mb-2">
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
