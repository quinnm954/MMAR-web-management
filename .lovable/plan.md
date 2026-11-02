# Match competitor quotes (owner decides)

## What you get
- When a customer has a quote from another shop or service (Valyou or anyone), they must send a **picture or screenshot showing the line items**. A total with no breakdown doesn't qualify.
- The receptionist (text and phone) will say: "We can review it. Text a photo or screenshot of the itemized quote to 813-501-7572." It never promises a match and never mentions price until you approve.
- When a photo arrives, AI reads the line items (part, labor, price) and attaches them to the customer's estimate as a **Competitor Quote**.
- On the estimate screen you see **their lines next to your lines** with both totals and the difference. Buttons:
  - **Match total**: adjusts your labor so the total matches theirs. Parts stay at your cost because AI can't know what you pay for parts.
  - **Ignore**: leaves your price as it is.
- Nothing goes to the customer automatically. You choose to send the updated estimate.
- Quotes with no line items, or blurry ones, get flagged "Needs itemized quote" so you can ask the customer for a better picture.

## Technical details
- New table `competitor_quotes` (estimate_id, customer_id, source name, image path, parsed line items as JSON, total, status pending/matched/ignored), admin-only RLS.
- The inbound SMS photo handler checks for quote-like images (or the customer saying "quote") and sends them to a new `parse-competitor-quote` function (Lovable AI vision), which links the result to the customer's newest open estimate.
- Admin estimate view: a side-by-side panel. "Match" only reduces labor lines, never parts, and records who matched it and when.
- Receptionist prompts get the "itemized photo required, owner reviews" rule. Tests cover: no match without line items, parts never changed, nothing auto-sent.
