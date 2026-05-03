## Fix Google favicon (Lovable heart still showing)

Google and many crawlers request `/favicon.ico` by default. The project only has `public/favicon.jpeg` referenced in `index.html`, so requests for `/favicon.ico` fall through to the Lovable default.

### Steps

1. **Add a real `/favicon.ico`** in `public/` generated from the existing `public/favicon.jpeg` (multi-size 16/32/48 ICO).
2. **Update `index.html`** `<head>` icon links to be explicit:
   ```html
   <link rel="icon" href="/favicon.ico" sizes="any">
   <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
   <link rel="apple-touch-icon" href="/favicon.jpeg">
   ```
3. **Note to user**: Google re-crawls favicons on its own schedule — it can take days/weeks for search results to update. Submitting the homepage in Google Search Console can speed it up.

### Files touched
- `public/favicon.ico` (new)
- `index.html` (icon link tags)
