import { useEffect, useRef, useState } from "react";
import { Facebook, Play, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { captionFor, tiktokVideoId, type SocialPost } from "@/data/socialPosts";

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

const SocialMediaCard = ({ post, embedOnMount = false }: Props) => {
  const [loaded, setLoaded] = useState(embedOnMount);
  const containerRef = useRef<HTMLDivElement>(null);
  const caption = captionFor(post);
  const isTikTok = post.platform === "tiktok";
  const videoId = isTikTok ? tiktokVideoId(post.url) : null;

  // Inject the TikTok embed script only after the user opts in.
  useEffect(() => {
    if (!loaded || !isTikTok || !videoId) return;
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.tiktok.com/embed.js"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.tiktok.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    } else {
      // Force re-process for dynamically added blockquotes
      // @ts-expect-error TikTok script exposes a global for re-processing
      window.tiktokEmbedLoad?.();
    }
  }, [loaded, isTikTok, videoId]);

  const fbEmbedSrc = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(post.url)}&show_text=true&width=500`;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/80 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)]">
      <div className="relative aspect-[9/16] sm:aspect-[4/5] w-full bg-gradient-to-br from-secondary/40 to-background">
        {!loaded ? (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground"
            aria-label={`Load ${isTikTok ? "TikTok video" : "Facebook post"}: ${caption}`}
          >
            {/* Decorative platform glyph */}
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
        ) : (
          <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {isTikTok && videoId ? (
              <blockquote
                className="tiktok-embed h-full w-full"
                cite={post.url}
                data-video-id={videoId}
                style={{ maxWidth: "100%", minWidth: "100%" }}
              >
                <a href={post.url} target="_blank" rel="noopener noreferrer">
                  Watch on TikTok
                </a>
              </blockquote>
            ) : isTikTok ? (
              // No /video/{id} in URL → fall back to opening on TikTok
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full w-full items-center justify-center text-primary underline"
              >
                Open on TikTok <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <iframe
                src={fbEmbedSrc}
                title={caption}
                loading="lazy"
                className="h-full w-full border-0"
                scrolling="no"
                allow="encrypted-media"
              />
            )}
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
