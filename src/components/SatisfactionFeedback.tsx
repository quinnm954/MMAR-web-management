import { useState } from "react";
import { CheckCircle2, ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GOOGLE_REVIEW_URL, feedbackComments } from "@/lib/satisfactionFeedback";
import { toast } from "sonner";

export default function SatisfactionFeedback({ context, customerId }: { context?: string; customerId?: string | null }) {
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (satisfied === null || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.rpc("submit_satisfaction_feedback", {
        _satisfied: satisfied, _comments: feedbackComments(comments, context),
        _name: name.trim().slice(0, 100) || null, _phone: phone.trim().slice(0, 30) || null,
        _customer_id: customerId ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch {
      toast.error("Couldn't save your feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {!done ? (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="text-lg font-semibold">Were you happy with your service?</h2>
          <p className="text-sm text-muted-foreground">Your answer is private, not a Google review.</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Service satisfaction">
            <Button type="button" variant={satisfied === true ? "default" : "outline"} aria-pressed={satisfied === true} disabled={sending} onClick={() => setSatisfied(true)}>
              <ThumbsUp className="mr-2 h-4 w-4" /> Yes
            </Button>
            <Button type="button" variant={satisfied === false ? "default" : "outline"} aria-pressed={satisfied === false} disabled={sending} onClick={() => setSatisfied(false)}>
              <ThumbsDown className="mr-2 h-4 w-4" /> No
            </Button>
          </div>
          {satisfied !== null && (
            <div className="space-y-3">
              <p className="text-sm">{satisfied ? "We're glad to hear it. Thank you!" : "We're sorry we fell short. Mike would like to hear what happened."}</p>
              <Textarea aria-label="Private comments" rows={4} maxLength={2000} placeholder="Anything you'd like Mike to know? (optional)" value={comments} onChange={(e) => setComments(e.target.value)} disabled={sending} />
              <Input aria-label="Your name" maxLength={100} placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={sending} />
              <Input aria-label="Phone number" maxLength={30} type="tel" placeholder="Phone for follow-up (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sending} />
              <Button type="submit" className="w-full" disabled={sending}>{sending ? "Saving…" : "Send private feedback"}</Button>
            </div>
          )}
        </form>
      ) : (
        <div className="flex items-start gap-3" role="status">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
          <p>Your private feedback was saved for Mike. Nothing has been posted to Google.</p>
        </div>
      )}
      <div className="border-t border-border pt-5 space-y-3">
        <h2 className="font-semibold">Share your experience on Google</h2>
        <p className="text-sm text-muted-foreground">To leave a public review, write it on Google and tap Post.</p>
        <Button asChild variant="outline" className="w-full">
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">Write a Google review <ExternalLink className="ml-2 h-4 w-4" /></a>
        </Button>
      </div>
    </div>
  );
}