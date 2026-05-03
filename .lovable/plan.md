# Live Facebook + TikTok feeds plan

## Reality check on the two APIs

**Facebook (doable, ~free):** Facebook Graph API `/{page-id}/posts` returns recent posts, photos, and attachments. You need a **long-lived Page Access Token** (60 days, then auto-refreshable to never-expire when used through a Page admin). One-time setup in Meta for Developers, no per-user OAuth, no app review for public Page posts (`pages_read_engagement` is granted on Pages you admin without review).

**TikTok (annoying):** TikTok has no public "show this user's videos" API. The official **Display API** requires per-user OAuth and only returns videos for the *logged-in* user — workable for the business account once, but requires a TikTok for Developers app with a verified domain. Approval typically takes 1–3 business days.

Because TikTok approval is slow, the plan ships in two phases so the site goes live with Facebook immediately while TikTok is pending.

## Phase 1 — ship now (Facebook live, TikTok manually curated)

### Backend
Two Lovable Cloud edge functions:

1. **`fetch-facebook-feed`** — calls `https://graph.facebook.com/v21.0/{PAGE_ID}/posts?fields=id,message,full_picture,permalink_url,created_time,attachments{media,subattachments}&limit=12` using `FACEBOOK_PAGE_ACCESS_TOKEN` from Lovable Cloud secrets. Returns a normalized JSON array. Caches the response in a `social_cache` table for 30 min to stay well under rate limits and keep the homepage fast.
2. **`fetch-tiktok-feed`** — stub that reads from a `tiktok_videos` table (admin-curated for now). Same response shape as the FB one so the frontend doesn't change in Phase 2.

### Database (one new table + a tiny curation table)
```text
social_cache(source text pk, payload jsonb, fetched_at timestamptz)
tiktok_videos(id uuid pk, video_id text, thumbnail_url text,
              caption text, posted_at timestamptz, sort_order int)
```
RLS: public `select`, admin-only `insert/update/delete` on `tiktok_videos` (reuses existing `has_role` admin policy).

### Frontend components
- `src/components/social/SocialMediaCard.tsx` — rounded dark card, lazy-loaded thumbnail (`loading="lazy"`, `decoding="async"`), play-overlay for videos, click-to-load real embed (FB iframe or TikTok blockquote+SDK injected on click only — never on initial paint), hover scale-up animation.
- `src/components/social/SocialFeedGrid.tsx` — fetches via `supabase.functions.invoke`, renders `SocialMediaCard`s in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Skeletons while loading. Generates a local-SEO caption fallback when a post has no text (rotates "Mobile mechanic repair in Lehigh Acres, FL", "Emergency roadside repair in Fort Myers", "Battery replacement completed on-site", etc., based on slug hash so it's stable per post).
- `src/components/home/LatestRepairsPreview.tsx` — homepage section showing **3 TikTok + 3 Facebook** thumbnails only (no embed iframes). Two CTA buttons: Call Now / Text for Quote. "See all real repairs →" link.

### New page `/real-repairs`
- Hero: "Real Repairs from the Truck" + intro paragraph with target keywords (mobile mechanic Lehigh Acres / Fort Myers / Cape Coral).
- Tabbed `SocialFeedGrid`: All / TikTok Reels / Facebook Posts.
- Inline `InlineCallStrip` between sections.
- Final CTA block (Call / Text / Request Service via existing `RequestQuoteCTA`).
- SEO: `useSeo` title + description, canonical, `Breadcrumb` + `ItemList` JSON-LD listing the post URLs.
- Sitemap entry at priority `0.8`.

### Routing & nav
- `App.tsx`: add `<Route path="/real-repairs" element={<RealRepairs />} />`.
- `Navigation.tsx`: add "Real Repairs" to the **Resources** dropdown.
- `Footer.tsx`: add a "Real Repairs" link in the existing resources row.

### Performance guarantees
- Homepage section sends **zero** social-platform JS until a card is clicked (only `<img>` thumbnails through the FB Graph CDN).
- Edge function caches for 30 min, so the FB API gets hit at most ~48× per day.
- `SocialFeedGrid` uses `react-query` with `staleTime: 5 * 60 * 1000`.
- Thumbnails: `width=320` query param + `loading="lazy"` + `aspect-ratio` reserved to prevent CLS.
- Click-to-load uses dynamic `import()` to keep the FB SDK out of the main bundle.

### Admin
A small panel inside the existing admin dashboard (`/admin/dashboard`) for adding/removing curated TikTok videos until Phase 2 lands.

## Phase 2 — flip TikTok to live (after API approval)

Replace the stub in `fetch-tiktok-feed` with a real TikTok Display API call using the stored long-lived refresh token, keeping the same response shape so no frontend changes are needed.

## Secrets I'll need to request via `add_secret` (Phase 1)

- `FACEBOOK_PAGE_ID` — numeric ID of the MMAR Facebook page.
- `FACEBOOK_PAGE_ACCESS_TOKEN` — long-lived Page Access Token (I'll give the user a 4-step walk-through: create FB app → use Graph API Explorer → exchange short-lived for long-lived → store).

## Files

**New:** `supabase/functions/fetch-facebook-feed/index.ts`, `supabase/functions/fetch-tiktok-feed/index.ts`, `src/components/social/SocialMediaCard.tsx`, `src/components/social/SocialFeedGrid.tsx`, `src/components/home/LatestRepairsPreview.tsx`, `src/pages/RealRepairs.tsx`, `src/components/admin/TiktokVideosTable.tsx`.

**Modified:** `src/App.tsx`, `src/pages/Index.tsx`, `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `src/pages/admin/AdminDashboard.tsx`, `public/sitemap.xml`.

**Migration:** create `social_cache` and `tiktok_videos` tables with RLS.

## Memory note

The existing core memory says *"No social media"* — that rule was about contact channels (no FB/IG as a way to reach the business). It does not block displaying social content as marketing proof. I'll add a clarifying memory: *"Social media display: OK as marketing/proof on /real-repairs and homepage. Contact is still phone/SMS only."*

## What I need from the user before starting

1. Does the MMAR Facebook page already exist and are you an admin? (Required for the access token.)
2. Is the TikTok handle confirmed and active? (Needed for the developer-app domain verification when we apply.)
3. Approve the two-phase approach (Facebook live now, TikTok curated until approved) — or do you want to wait and ship both live together once TikTok is approved?
