# Find missing emails for prospecting drafts

Of the 208 drafts with no email, only 29 have been searched so far. The other 179 were never looked up. Most of them (177 of 208) have a website.

## What changes
1. **Run the search on all 208.** Start with the 179 that were never searched, then retry the 29 that came up empty using the deeper search below.
2. **Search deeper for each business:**
   - Its website: the home page plus contact, about, and "get a quote" pages. Load each page fully so emails added by scripts or contact widgets are also found.
   - A web search for the business name and town, covering its Facebook page, BBB, Yelp, Chamber listings and directories.
   - Prefer emails on the business's own web address (for example info@theirsite.com). Skip government, license-board, platform and placeholder addresses, as the search already does today.
3. **Keep a note of where each email came from** (website or which directory), shown on the lead, so you can trust it before approving.
4. **Prospecting screen:** add a "Find emails" button with live progress ("Searched 40 of 208 · 18 found"). Leads with nothing found stay under "Needs email" marked "Searched, none found."
5. **Nothing sends automatically.** Found leads move to "Ready to approve." You still approve them before any email goes out.

## Cost and limits
These aren't your Lovable credits. The searching is done by Firecrawl, the web search service already connected to the app, and it has its own usage allowance. Each business takes a few searches and page loads there. To stay light, the app first reads each business's own website for free and only uses Firecrawl when nothing turns up. If your Firecrawl allowance runs out partway through, searching pauses and the leads already found are kept. Searches run in small batches so none time out. Realistically, expect emails for about 40 to 60% of these businesses. Many small trades only list a phone number.

## Technical details
- Extend `prospecting` `action=enrich`: candidate paths `/contact`, `/contact-us`, `/about`, `/about-us`, `/quote`; use Firecrawl scrape for rendered HTML when a plain fetch finds nothing; decode `mailto:` and obfuscated `[at]` forms; two Firecrawl search queries (name+city+"email", name+"facebook"); rank same-domain addresses first.
- Add a `force` option to re-search leads that were searched before but have no email; add an `email_source` text column (migration).
- The UI loops the enrich call in batches of 10 until `remaining` = 0, showing progress.
