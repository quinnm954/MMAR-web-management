import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RoadsideBanner from "@/components/RoadsideBanner";
import InlineCallStrip from "@/components/InlineCallStrip";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import SocialFeedGrid from "@/components/social/SocialFeedGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  allSocialPosts,
  facebookPosts,
  tiktokPosts,
  FACEBOOK_PAGE_URL,
  TIKTOK_PROFILE_URL,
} from "@/data/socialPosts";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://www.mikesmautorepair.com";

const RealRepairs = () => {
  useSeo({
    title: "Real Repairs from the Truck | Mike's Mobile Auto Repair (SWFL)",
    description:
      "Real mobile mechanic jobs in Lehigh Acres, Fort Myers & Cape Coral — diagnostics, roadside calls, brake jobs, batteries & alternators, straight from MMAR's TikTok and Facebook.",
    canonical: `${SITE}/real-repairs`,
  });

  // Inject BreadcrumbList + ItemList JSON-LD for the listed posts
  useEffect(() => {
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
            { "@type": "ListItem", position: 2, name: "Real Repairs", item: SITE + "/real-repairs" },
          ],
        },
        {
          "@type": "ItemList",
          name: "Real Repairs from MMAR",
          itemListElement: allSocialPosts.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: p.url,
            name: p.caption ?? "Mobile mechanic repair in Southwest Florida",
          })),
        },
      ],
    };
    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.text = JSON.stringify(ld);
    tag.dataset.realRepairsLd = "1";
    document.head.appendChild(tag);
    return () => {
      document.head
        .querySelectorAll('script[data-real-repairs-ld="1"]')
        .forEach((n) => n.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoadsideBanner />
      <Navigation />

      <header className="pt-24 md:pt-28 pb-10 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Real Repairs · Southwest Florida
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Real Repairs from the Truck
          </h1>
          <p className="text-lg text-muted-foreground">
            Watch actual mobile mechanic jobs from <strong>Mike's Mobile Auto Repair</strong> —
            diagnostics, roadside calls, brake jobs, batteries, and alternator swaps across
            Lehigh Acres, Fort Myers, and Cape Coral, FL.
          </p>
        </div>
      </header>

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tiktok">TikTok Reels</TabsTrigger>
                <TabsTrigger value="facebook">Facebook Posts</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all">
              <SocialFeedGrid posts={allSocialPosts} />
            </TabsContent>
            <TabsContent value="tiktok">
              <SocialFeedGrid posts={tiktokPosts} />
            </TabsContent>
            <TabsContent value="facebook">
              <SocialFeedGrid posts={facebookPosts} />
            </TabsContent>
          </Tabs>

          <div className="max-w-3xl mx-auto">
            <InlineCallStrip label="See something like your problem? Get help today." />
          </div>

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Follow us:{" "}
            <a href={TIKTOK_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok</a>
            {" · "}
            <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook</a>
          </div>
        </div>
      </section>

      <RequestQuoteCTA />
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default RealRepairs;
