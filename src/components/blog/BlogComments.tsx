import { useEffect, useState, FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const BlogComments = ({ postSlug }: { postSlug: string }) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_comments")
      .select("id, author_name, content, created_at")
      .eq("post_slug", postSlug)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (!error && data) setComments(data as Comment[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSlug]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const c = content.trim();
    if (n.length < 1 || n.length > 80) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!EMAIL_RE.test(em) || em.length > 200) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    if (c.length < 1 || c.length > 2000) {
      toast({ title: "Comment must be 1–2000 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_slug: postSlug,
      author_name: n,
      author_email: em,
      content: c,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not post comment", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Comment posted", description: "Thanks for joining the conversation." });
    setName("");
    setEmail("");
    setContent("");
    load();
  };

  return (
    <section className="border-t border-border pt-8 mt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="font-display text-xl md:text-2xl text-sky mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" /> Comments {comments.length > 0 && <span className="text-muted-foreground text-base">({comments.length})</span>}
      </h2>

      <form onSubmit={onSubmit} className="glass-card rounded-xl p-5 border border-border/40 space-y-3 mb-8">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
          <Input
            type="email"
            placeholder="Email (not published)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            required
          />
        </div>
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={4}
          required
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Your email won't be published or shared.
          </p>
          <Button type="submit" disabled={submitting} variant="hero">
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Posting..." : "Post comment"}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">Be the first to comment.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{c.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default BlogComments;
