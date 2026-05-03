// Curated social media URLs for the "Real Repairs" sections.
// Just paste new Facebook post URLs and TikTok video URLs here — no API setup needed.
//
// • Facebook: full post URL (e.g. https://www.facebook.com/Mikesmobileautorepairllc/posts/123...)
// • TikTok:   full video URL  (e.g. https://www.tiktok.com/@mikesmobileautorepair/video/7300000000000000000)
//
// `caption` is optional. If omitted, a rotating local-SEO caption is used.

export type SocialPost = {
  id: string;
  platform: "facebook" | "tiktok";
  url: string;
  caption?: string;
};

const FALLBACK_CAPTIONS = [
  "Mobile mechanic repair in Lehigh Acres, FL",
  "Emergency roadside repair in Fort Myers",
  "Battery replacement completed on-site",
  "On-site diagnostics in Cape Coral, FL",
  "Brake repair finished in the customer's driveway",
  "Alternator swap done same-day in SWFL",
  "Starter replacement, no tow needed",
  "No-start diagnosis solved on the spot",
];

export const FACEBOOK_PAGE_URL = "https://www.facebook.com/Mikesmobileautorepairllc/";
export const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@mikesmobileautorepair";

// 👉 Replace these placeholders with real post/video URLs whenever you publish new content.
export const tiktokPosts: SocialPost[] = [
  { id: "tt-1", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Mobile diagnostics on a no-start, Lehigh Acres FL" },
  { id: "tt-2", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Roadside brake job in Fort Myers" },
  { id: "tt-3", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Battery swap in a parking lot — Cape Coral" },
  { id: "tt-4", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Alternator replacement, customer's driveway" },
  { id: "tt-5", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Heat-soak overheating fix, SWFL summer" },
  { id: "tt-6", platform: "tiktok", url: "https://www.tiktok.com/@mikesmobileautorepair", caption: "Starter motor repair on-site" },
];

export const facebookPosts: SocialPost[] = [
  { id: "fb-1", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Real repair completed in Lehigh Acres" },
  { id: "fb-2", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Mobile diagnostics in Fort Myers" },
  { id: "fb-3", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Roadside service in Cape Coral" },
  { id: "fb-4", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Battery + alternator combo job" },
  { id: "fb-5", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Brake pads & rotors on-site" },
  { id: "fb-6", platform: "facebook", url: "https://www.facebook.com/Mikesmobileautorepairllc/", caption: "Happy customer — same-day mobile repair" },
];

export const allSocialPosts: SocialPost[] = [...tiktokPosts, ...facebookPosts];

export function captionFor(post: SocialPost): string {
  if (post.caption) return post.caption;
  // Stable fallback based on id hash so the same card always shows the same caption.
  let h = 0;
  for (let i = 0; i < post.id.length; i++) h = (h * 31 + post.id.charCodeAt(i)) | 0;
  return FALLBACK_CAPTIONS[Math.abs(h) % FALLBACK_CAPTIONS.length];
}

/** Extract a TikTok video numeric ID from a URL, if present. */
export function tiktokVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

/** Validate a Facebook post/video/reel URL is embeddable (not just a profile/page root). */
export function isEmbeddableFacebookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!/(^|\.)facebook\.com$/.test(u.hostname) && u.hostname !== "fb.watch") return false;
    if (u.hostname === "fb.watch") return u.pathname.length > 1;
    return /\/(posts|videos|reel|reels|photos|share|story\.php|permalink\.php)\b/i.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

/** Returns a validation result usable by the card UI. */
export type PostValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validatePost(post: SocialPost): PostValidation {
  if (post.platform === "tiktok") {
    return tiktokVideoId(post.url)
      ? { ok: true }
      : { ok: false, reason: "TikTok URL is missing /video/{id} — paste the full video URL." };
  }
  return isEmbeddableFacebookUrl(post.url)
    ? { ok: true }
    : { ok: false, reason: "Facebook URL must link to a specific post, video, or reel." };
}
