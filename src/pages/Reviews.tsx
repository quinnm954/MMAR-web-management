import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import Testimonials from "@/components/Testimonials";
import InlineCallStrip from "@/components/InlineCallStrip";
import { useSeo } from "@/lib/useSeo";

const Reviews = () => {
  useSeo({
    title: "Customer Reviews | Mike's Mobile Auto Repair",
    description:
      "5-star customer reviews for Mike's Mobile Auto Repair across Google, Facebook, Yelp, and Nextdoor — serving Lehigh Acres and Fort Myers.",
    canonical: "https://mikesmautorepair.com/reviews",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "Reviews", url: "https://mikesmautorepair.com/reviews" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <Testimonials />
      </div>
      <div className="container mx-auto px-4 max-w-3xl pb-12">
        <InlineCallStrip label="Want to be our next 5-star review?" />
      </div>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Reviews;
