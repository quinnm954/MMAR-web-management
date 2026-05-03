import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import Contact from "@/components/Contact";
import { useSeo } from "@/lib/useSeo";

const ContactPage = () => {
  useSeo({
    title: "Contact Mike's Mobile Auto Repair | Call or Text (813) 501-7572",
    description:
      "Call or text Mike's Mobile Auto Repair at (813) 501-7572 for same-day mobile mechanic service across Southwest Florida.",
    canonical: "https://www.mikesmautorepair.com/contact",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <Contact />
      </div>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default ContactPage;
