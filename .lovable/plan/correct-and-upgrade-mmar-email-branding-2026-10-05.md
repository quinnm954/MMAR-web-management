# Correct and upgrade MMAR email branding

## What will change
- Change the visible sender on every app and account email to **MMAR**.
- Replace the oversized, mismatched email header with a compact MMAR-branded header using the correct dark, sky-blue, and gold visual system.
- Redesign the shared email layout for cleaner spacing, stronger hierarchy, polished buttons, and better mobile email-client rendering.
- Upgrade the estimate email specifically so the total, estimate details, approval action, and account access are clear without looking like stacked blocks.
- Apply the improved shared branding consistently across appointment, invoice, maintenance, review, fleet, staff, and account emails while preserving MMAR Care only where the email is specifically about that membership product.

## Technical details
- Update the shared email brand components and the estimate template rather than duplicating styles across every message.
- Update both app-email and account-email sender configuration to `MMAR`.
- Keep links clickable, the email body white for broad inbox compatibility, and use email-safe inline styles.
- Deploy every email-sending function that bundles the shared templates, then verify the deployed templates compile successfully.
