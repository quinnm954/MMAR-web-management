import { useState } from "react";
import { Star, MessageSquareText, Phone, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Same Google Business share link used elsewhere in the app.
const GOOGLE_REVIEW_URL = "https://share.google/bx2Gb42dslCITJdS8";
const SHOP_PHONE = "+18135017572";

interface ReviewPromptCardProps {
  /** Optional context added to the feedback SMS body (e.g. invoice #). */
  context?: string;
}

/**
 * Rating-gated review card.
 * - 5 stars  → opens the Google review page in a new tab (auto-publish path).
 * - 1–4 stars → collects private feedback and hands off to Text / Call the shop.
 *   Nothing is posted publicly.
 */
const ReviewPromptCard = ({ context }: ReviewPromptCardProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState<"google" | "feedback" | null>(null);

  const handleRate = (n: number) => {
    setRating(n);
    if (n === 5) {
      try {
        window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
      } catch {
        // ignored
      }
      setSent("google");
    }
  };

  const feedbackBody = () => {
    const lines = [
      `Feedback for Mike's Mobile Auto Repair`,
      `Rating: ${rating} / 5`,
      context ? `Ref: ${context}` : "",
      "",
      feedback || "(no additional comments)",
    ].filter(Boolean);
    return lines.join("\n");
  };

  const smsHref = `sms:${SHOP_PHONE}?&body=${encodeURIComponent(feedbackBody())}`;
  const telHref = `tel:${SHOP_PHONE}`;

  if (sent === "google") {
    return (
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
        <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-2" />
        <div className="font-semibold">Thanks for the 5 stars!</div>
        <p className="text-sm text-muted-foreground mt-1">
          Your Google review page opened in a new tab. If it didn't, tap below.
        </p>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 mt-3 text-sm text-primary hover:underline"
        >
          Open Google review <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border-2 border-accent/40 bg-accent/5 p-5">
      <div className="text-center mb-3">
        <div className="font-display text-lg tracking-wide">How did we do?</div>
        <p className="text-xs text-muted-foreground mt-1">
          Tap a star to rate your service.
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-3" role="radiogroup" aria-label="Rate your service">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleRate(n)}
              className="p-1 rounded-md hover:bg-accent/20 active:scale-95 transition-all"
            >
              <Star
                className={`h-9 w-9 ${active ? "text-accent fill-accent" : "text-muted-foreground/40"}`}
              />
            </button>
          );
        })}
      </div>

      {rating > 0 && rating < 5 && sent !== "feedback" && (
        <div className="mt-4 space-y-3">
          <div className="text-sm">
            <div className="font-semibold flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-primary" /> We'd love to make it right
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This goes straight to Mike — not to Google. Tell us what happened and we'll follow up.
            </p>
          </div>
          <Textarea
            placeholder="What could we have done better?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="hero" className="flex-1" onClick={() => setSent("feedback")}>
              <a href={smsHref}>
                <MessageSquareText className="h-4 w-4 mr-1" /> Send as text
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={telHref}>
                <Phone className="h-4 w-4 mr-1" /> Call the shop
              </a>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Nothing is published publicly.
          </p>
        </div>
      )}

      {sent === "feedback" && (
        <div className="mt-4 text-center text-sm text-primary flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Thanks — we'll be in touch shortly.
        </div>
      )}
    </div>
  );
};

export default ReviewPromptCard;
