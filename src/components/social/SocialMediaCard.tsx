import { useEffect, useRef, useState } from "react";
import { Facebook, Play, ExternalLink, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { captionFor, tiktokVideoId, validatePost, type SocialPost } from "@/data/socialPosts";

// TikTok logo glyph (lucide doesn't ship one)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.6 6.3a4.8 4.8 0 0 1-3.4-1.4 4.8 4.8 0 0 1-1.3-2.6V2h-3.4v13.4a2.8 2.8 0 1 1-2-2.7v-3.5a6.2 6.2 0 1 0 5.4 6.2V9.7a8.2 8.2 0 0 0 4.7 1.5V7.8a4.8 4.8 0 0 1-0-1.5z" />
  </svg>
);

type Props = {
  post: SocialPost;
  /** When true, render the actual platform embed (heavier). When false, render a thumbnail card with a click-to-load CTA. */
  embedOnMount?: boolean;
};

type EmbedStatus = "idle" | "loading" | "ready" | "error";

const LOAD_TIMEOUT_MS = 8000;

const SocialMediaCard = ({ post, embedOnMount = false }: Props) => {
  const [status, setStatus] = useState<EmbedStatus>(embedOnMount ? "loading" : "idle");
  const [attempt, setAttempt] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const caption = captionFor(post);
  const isTikTok = post.platform === "tiktok";
  const validation = validatePost(post);
  const videoId = isTikTok ? tiktokVideoId(post.url) : null;

  // Load TikTok embed script + watchdog timer for failures.
  useEffect(() => {
    if (status !== "loading") return;

    let cancelled = false;
    const watchdog = window.setTimeout(() => {
      if (cancelled) return;
      // If iframe never replaced the blockquote / FB iframe never fired onload, mark error.
      const iframe = containerRef.current?.querySelector("iframe");
      if (!iframe) setStatus("error");
    }, LOAD_TIMEOUT_MS);

    if (isTikTok && videoId) {
      const SRC = "https://www.tiktok.com/embed.js";
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
      if (!existing) {
        const s = document.createElement("script");
        s.src = SRC;
        s.async = true;
        s.onload = () => !cancelled && setStatus("ready");
        s.onerror = () => !cancelled && setStatus("error");
        document.body.appendChild(s);
      } else {
        // Already present — re-process embeds and mark ready shortly after.
        // @ts-expect-error TikTok script exposes a global for re-processing
        window.tiktokEmbedLoad?.();
        window.setTimeout(() => !cancelled && setStatus("ready"), 600);
      }
    }

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
  }, [status, isTikTok, videoId, attempt]);

  const fbEmbedSrc = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(post.url)}&show_text=true&width=500`;

  const retry = () => {
    setAttempt((a) => a + 1);
    setStatus("loading");
  };

  // ----- Invalid URL: clear inline message, no broken embed -----
  if (validation.ok === false) {
    return (
      <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/80">
        <div className="relative aspect-[9/16] sm:aspect-[4/5] w-full bg-gradient-to-br from-secondary/40 to-background">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/40">
              <AlertTriangle className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isTikTok ? "TikTok video URL needed" : "Facebook post URL needed"}
            </p>
            <p className="text-xs text-muted-foreground">{validation.reason}</p>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              Visit profile <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <p className="line-clamp-2 text-sm text-muted-foreground">{caption}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/80 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)]">
      <div className="relative aspect-[9/16] sm:aspect-[4/5] w-full bg-gradient-to-br from-secondary/40 to-background">
        {status === "idle" && (
          <button
            type="button"
            onClick={() => setStatus("loading")}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground"
            aria-label={`Load ${isTikTok ? "TikTok video" : "Facebook post"}: ${caption}`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30 transition-transform group-hover:scale-110">
              {isTikTok ? (
                <TikTokIcon className="h-8 w-8 text-primary" />
              ) : (
                <Facebook className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <Play className="h-3.5 w-3.5 fill-primary" />
              {isTikTok ? "Play reel" : "Load post"}
            </div>
            <p className="px-4 text-center text-sm text-muted-foreground line-clamp-3">{caption}</p>
          </button>
        )}

        {(status === "loading" || status === "ready") && (
          <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {status === "loading" && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Loading {isTikTok ? "TikTok" : "Facebook"}…
                </p>
              </div>
            )}
            {isTikTok && videoId ? (
              <blockquote
                key={`tt-${attempt}`}
                className="tiktok-embed h-full w-full"
                cite={post.url}
                data-video-id={videoId}
                style={{ maxWidth: "100%", minWidth: "100%" }}
              >
                <a href={post.url} target="_blank" rel="noopener noreferrer">
                  Watch on TikTok
                </a>
              </blockquote>
            ) : (
              <iframe
                key={`fb-${attempt}`}
                src={fbEmbedSrc}
                title={caption}
                loading="lazy"
                className="h-full w-full border-0"
                scrolling="no"
                allow="encrypted-media"
                onLoad={() => setStatus("ready")}
                onError={() => setStatus("error")}
              />
            )}
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/40">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">Couldn't load embed</p>
            <p className="text-xs text-muted-foreground">
              The {isTikTok ? "TikTok" : "Facebook"} player didn't respond. Check your connection or open the original post.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <p className="line-clamp-2 text-sm text-foreground">{caption}</p>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
          aria-label={`Open ${isTikTok ? "TikTok" : "Facebook"} post in new tab`}
        >
          Open <ExternalLink className="ml-0.5 inline h-3 w-3" />
        </a>
      </div>
    </Card>
  );
};

export default SocialMediaCard;
