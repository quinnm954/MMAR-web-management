/**
 * Centralized UI strings for portal-facing components.
 *
 * Single source of truth so brand-specific terms (Garage Ace = platform shell,
 * MMAR Care = membership/service product) stay consistent across portal
 * pages, layouts, wizards, and toasts.
 *
 * Rules:
 *   - `platform.*`  → app shell strings (header, nav, sign-in, account chrome)
 *   - `product.*`   → MMAR Care service / membership product strings
 *   - `account.*`   → neutral, brand-free account language
 *
 * If a string is brand-sensitive, put it here. Don't hardcode "Garage Ace"
 * or "MMAR Care" in portal components — import from this file instead.
 */

import { PLATFORM_BRAND, PRODUCT_BRAND } from "./brand";

export const portalStrings = {
  platform: {
    name: PLATFORM_BRAND.name,
    headerTagline: `${PRODUCT_BRAND.name} customer portal`,
    logoAlt: PRODUCT_BRAND.shopName,
    signOut: "Sign Out",
  },
  product: {
    name: PRODUCT_BRAND.name,
    membershipBadge: `${PRODUCT_BRAND.name} Membership`,
    membershipAgreementTitle: `${PRODUCT_BRAND.name} Membership Agreement`,
    membershipAgreementConsent: `I have read and agree to the ${PRODUCT_BRAND.name} Membership Agreement.`,
    membershipPageSubtitle: `Your ${PRODUCT_BRAND.name} plans and billing.`,
    membershipSignupTitle: `Join ${PRODUCT_BRAND.name} Membership | ${PRODUCT_BRAND.shopName.split(" ").map((w) => w[0]).join("")}`,
    achAuthorization: `I authorize ${PRODUCT_BRAND.shopName} (MMAR), operating ${PRODUCT_BRAND.name}, to electronically debit my bank account via ACH for the recurring monthly membership fee, applicable deposits, and any service charges I authorize. This authorization remains in effect until I revoke it in writing with at least 7 business days notice.`,
  },
  account: {
    dashboardSubtitle: "Here's an overview of your account.",
    vehiclesSubtitle: "Vehicles linked to your account.",
    invoicesSubtitle: "Billing history for your account.",
    welcomeBackToast: `Welcome back to ${PLATFORM_BRAND.name}`,
    membershipActivatedToast: "Payment received — your membership is active!",
  },
} as const;

export type PortalStrings = typeof portalStrings;
