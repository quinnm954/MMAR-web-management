## Diagnosis

I checked the live `robots.txt` and the site headers. **Your robots.txt is not actually blocking indexing.** Here's what I found:

- `https://mikesmautorepair.com/robots.txt` returns **HTTP 200** with the correct content.
- It explicitly **allows** Googlebot, Bingbot, and `*` — only `/admin/` is disallowed (which is intentional).
- No `X-Robots-Tag` header and no `<meta name="robots" content="noindex">` anywhere on the site.

The file content is exactly what we want:
```
User-agent: Googlebot
Allow: /
...
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://mikesmautorepair.com/sitemap-index.xml
```

## Most likely cause of the warning

Google Search Console is reporting "blocked" because of a **property/host mismatch**, not the file contents:

- `https://www.mikesmautorepair.com/robots.txt` returns a **301 redirect** to the non-www version.
- If your GSC property is the **www** version (or the URL Inspection tool was run against a `www.` URL), Google flags the robots.txt as unreachable/blocked because it can't fetch a 200 directly at that hostname.
- We already normalized the entire site to the non-www canonical host last round, so the `www` property in GSC is now stale.

## Plan

Two small things to do, then a manual GSC step:

1. **Tighten `public/robots.txt`** to remove redundancy and make it 100% unambiguous for Google's parser:
   - Drop the per-bot `Allow: /` blocks (they're redundant — `User-agent: *` already allows all).
   - Keep only the wildcard rule + the sitemap entries.
   - Result:
     ```
     User-agent: *
     Allow: /
     Disallow: /admin/

     Sitemap: https://mikesmautorepair.com/sitemap-index.xml
     ```
   This eliminates any chance of a parser treating the multiple user-agent blocks oddly.

2. **Verify no stray noindex** — double-check `index.html` and the SEO hook don't emit `noindex` for any route. (Quick scan already shows none, but I'll confirm in build mode.)

3. **Manual step in Google Search Console (you):**
   - Make sure the **active GSC property is `https://mikesmautorepair.com`** (non-www), not the www version.
   - If only the www property is verified, add and verify the non-www property, then re-submit `https://mikesmautorepair.com/sitemap-index.xml` there.
   - Use **URL Inspection** on `https://mikesmautorepair.com/` (no www) to confirm it reads "Allowed" for crawling.

## Files I'll change

- `public/robots.txt` — simplified to a single wildcard block + sitemaps.

No other code changes needed. Approve and I'll apply the robots.txt simplification.