import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/useSeo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// One-off payment choices for a single financing customer; links are Stripe Checkout sessions.
const WEEKLY_URL = "https://checkout.stripe.com/g/pay/cs_live_bcsbm35ecSqgM24OzIWcMC4fCtg7mNSO7pD9tdoViTX4UFSHJ63nofJbnF#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicyc%2FNiknZHVsTmB8Jz8ndW5aaWxzYFowNFFQXGh3MFQ3U1Vdd29KfXB1VVYwMHNwSDJLNFR2cl18T2tGPDNUZGRITHJmUXZpPFZcY3V3dFw2MnNvQWJcXUZybm9WSGp8MkBUTTI2REBINEZBYUtGMzU1NkZ9Q19CZ2InKSdjd2poVmB3c2B3Jz9xd3BgKSdnZGZuYndqcGthRmppancnPycmY2NjY2NjJyknaWR8anBxUXx1YCc%2FJ2hwaXFsWmxxYGgneCUl";
const PAYOFF_URL = "https://checkout.stripe.com/g/pay/cs_live_acgoKq2rIVHqQmwU7VEr9TmWSJfkN1rE7apdr3WUJ55d28DeCJQAXp0lwN#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicyc%2FNiknZHVsTmB8Jz8ndW5aaWxzYFowNFFQXGh3MFQ3U1Vdd29KfXB1VVYwMHNwSDJLNFR2cl18T2tGPDNUZGRITHJmUXZpPFZcY3V3dFw2MnNvQWJcXUZybm9WSGp8MkBUTTI2REBINEZBYUtGMzU1NkZ9Q19CZ2InKSdjd2poVmB3c2B3Jz9xd3BgKSdnZGZuYndqcGthRmppancnPycmY2NjY2NjJyknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJ3gl";

const JosePaymentOptions = () => {
  useSeo({
    title: "Payment Options | Mike's Mobile Auto Repair",
    description: "Choose how to pay your balance.",
    canonical: "https://mikesmautorepair.com/pay/jose",
    noindex: true,
  });
  const [state, setState] = useState<"loading" | "open" | "paid">("loading");
  useEffect(() => {
    supabase.functions.invoke("jose-pay-status").then(({ data }) => setState(data?.paid ? "paid" : "open"));
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-xl">
          <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-2"><span className="text-sky">PAYMENT</span> <span className="text-gold">OPTIONS</span></h1>
          {state === "loading" && <p className="text-muted-foreground">Loading...</p>}
          {state === "paid" && <p className="text-lg">Thank you, Jose. Your payment has been received and this link is no longer active.</p>}
          {state === "open" && <>
          <p className="text-muted-foreground mb-8">Hi Jose, choose one option below. You only need to pay one.</p>
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-1">Pay off in full</h2>
              <p className="text-3xl font-bold text-gold mb-2">$400.00</p>
              <p className="text-sm text-muted-foreground mb-4">One payment today settles your balance. No more weekly payments.</p>
              <Button asChild size="lg" className="w-full"><a href={PAYOFF_URL}>Pay $400 and settle</a></Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-1">Catch up and continue weekly</h2>
              <p className="text-3xl font-bold text-sky mb-2">$184.40 today</p>
              <p className="text-sm text-muted-foreground mb-4">Covers the past-due weeks, then $63.60 every Monday starting Nov 16 through Jan 11.</p>
              <Button asChild size="lg" variant="secondary" className="w-full"><a href={WEEKLY_URL}>Pay $184.40 and resume weekly</a></Button>
            </div>
          </div>
          </>}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default JosePaymentOptions;
