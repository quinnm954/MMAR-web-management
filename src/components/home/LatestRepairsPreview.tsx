import { Link } from "react-router-dom";
import { ArrowRight, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialFeedGrid from "@/components/social/SocialFeedGrid";
import { facebookPosts, tiktokPosts } from "@/data/socialPosts";
import { trackConversion } from "@/lib/gtag";

const LatestRepairsPreview = () => {
  const preview = [...tiktokPosts.slice(0, 3), ...facebookPosts.slice(0, 3)];
  const onCta = () => trackConversion();

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
            Live from the truck
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Latest Repairs &amp; Videos
          </h2>
          <p className="text-muted-foreground">
            Real diagnostics, roadside calls, and on-site repairs across Lehigh Acres, Fort Myers,
            and Cape Coral — straight from our TikTok and Facebook.
          </p>
        </div>

        <SocialFeedGrid posts={preview} />

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="hero" size="lg" asChild>
            <Link to="/real-repairs">
              See all real repairs <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <a href="tel:8135017572" onClick={onCta}>
              <Phone className="mr-2 h-4 w-4" /> Call Now
            </a>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <a href="sms:8135017572" onClick={onCta}>
              <MessageSquare className="mr-2 h-4 w-4" /> Text for Quote
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LatestRepairsPreview;
