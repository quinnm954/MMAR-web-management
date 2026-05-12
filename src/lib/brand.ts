/**
 * Two distinct brands inside one codebase:
 *
 * - PLATFORM_BRAND ("Garage Ace")  →  the app shell / SaaS surface that
 *   admins, employees, and customers sign in to. Eventually sold to other
 *   shops as a stand-alone shop-management product.
 *
 * - PRODUCT_BRAND ("MMAR Care")  →  the specific shop's customer-facing
 *   service product (mobile mechanic, subscription care plans, public
 *   marketing site). Lives at /, /memberships, /mmar-care, etc.
 *
 * Rule of thumb when choosing which to use:
 *   - Buying / learning about the service → PRODUCT_BRAND
 *   - Signed in and using the app → PLATFORM_BRAND
 *   - The user's plan referenced inside the app → still PRODUCT_BRAND
 *     (e.g. "Your MMAR Care membership")
 */

export const PLATFORM_BRAND = {
  name: "Garage Ace",
  tagline: "Shop management, simplified",
} as const;

export const PRODUCT_BRAND = {
  name: "MMAR Care",
  tagline: "Mobile mechanic care plans",
  shopName: "Mike's Mobile Auto Repair",
} as const;
