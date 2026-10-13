# Bring back the old financing contract (unadvertised)

## What you'll get
- The original online financing contract page comes back exactly as it was before it was removed: the full agreement text, the customer's initials, signature pad, and signing. Signed contracts save just like before.
- It's **hidden**: no menu links, no website mentions, no offer on estimates or invoices, no FAQ or blog copy, and search engines are told not to list it. Customers only reach it if you send them the link yourself.
- In Admin → Financing, a **"Contract link"** button copies the contract link so you can send it to a customer when you need it. The old admin list of signed contracts comes back in that same tab, so you can view, countersign and print them.

## What stays removed
- Financing on the public website, in the menus, in the FAQ/blog/city pages, on the estimate approval page, and on invoices.

## Technical details
- Restore from history (commit before `dcf54db`) unchanged: `src/pages/FinancingContract.tsx`, `src/components/admin/FinancingContractsTable.tsx`, `supabase/functions/submit-financing-contract/index.ts` (then deploy).
- Re-add only the `/financing-contract` route in `App.tsx`; add `noindex` meta on that page and keep it out of sitemaps/prerender.
- Show `FinancingContractsTable` inside `AdminFinancing` with the copy-link button. Do not restore the old `PortalFinancing` page (`/portal/financing` now shows the payment schedule) or the Navigation/PortalLayout/EstimateApproval/AdminInvoices/create-payment-link financing entries.
- Update the project memory financing rule to mention the hidden contract page.
