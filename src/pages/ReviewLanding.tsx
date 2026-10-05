import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSeo } from "@/lib/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const REVIEW_URL = "https://share.google/bx2Gb42dslCITJdS8";

const ReviewLanding = () => {
  useSeo({
    title: "How Did We Do? | Mike's Mobile Auto Repair",
    description: "Tell us how your service with Mike's Mobile Auto Repair went.",
    canonical: "https://mikesmautorepair.com/review",
    noindex: true,
  });

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const pick = (n: number) => {
    setRating(n);
    if (n === 5) {
      supabase.rpc("submit_review_feedback", { _rating: 5, _comments: null, _name: null, _phone: null, _email: null }).then(() => {});
      window.open(REVIEW_URL, "_blank", "noopener,noreferrer");
    }
  };

  const submit = async () => {
    if (!comments.trim()) { toast.error("Please tell us what happened."); return; }
    setSending(true);
    const { error } = await supabase.rpc("submit_review_feedback", {
      _rating: rating, _comments: comments.slice(0, 2000), _name: name.slice(0, 100),
      _phone: phone.slice(0, 30), _email: email.slice(0, 255),
    });
    setSending(false);
    if (error) { toast.error("Couldn't send — please try again."); return; }
    setDone(true);
  };

  const shown = hover || rating;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-3">
            <span className="text-sky">HOW DID</span> <span className="text-gold">WE DO?</span>
          </h1>
          <p className="text-muted-foreground mb-6">Tap a star to rate your service.</p>

          <div className="flex gap-2 mb-8" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)} onClick={() => pick(n)}
                className="p-1 active:scale-95 transition-transform">
                <Star className={`w-11 h-11 ${n <= shown ? "text-gold fill-current" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>

          {rating === 5 && (
            <div className="rounded-xl border border-border bg-secondary/20 p-5 space-y-3">
              <p className="font-medium">Thank you! Google should have opened in a new tab — just tap <b>Post</b> to share your review.</p>
              <Button asChild className="w-full bg-gold text-background hover:bg-gold/90">
                <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer">Open Google review</a>
              </Button>
            </div>
          )}

          {rating > 0 && rating < 5 && !done && (
            <div className="rounded-xl border border-border bg-secondary/20 p-5 space-y-3">
              <p className="font-medium">We're sorry we fell short. Tell us what happened and we'll make it right.</p>
              <Textarea rows={5} maxLength={2000} placeholder="What could we have done better?" value={comments} onChange={(e) => setComments(e.target.value)} />
              <Input maxLength={100} placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input maxLength={30} type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input maxLength={255} type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={submit} disabled={sending} className="w-full">{sending ? "Sending…" : "Send feedback"}</Button>
              <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-muted-foreground underline">
                Prefer to post publicly? Leave a Google review
              </a>
            </div>
          )}

          {done && (
            <div className="rounded-xl border border-border bg-secondary/20 p-5 flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              <p>Thanks — your feedback went straight to the owner. We'll be in touch soon.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ReviewLanding;
