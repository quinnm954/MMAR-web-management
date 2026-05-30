/**
 * Two distinct brands inside one codebase:
 *
 * - PLATFORM_BRAND ("Garage Ace")  →  the customer + staff app / portal /
 *   native app. Everything customers and employees sign into is Garage Ace.
 *   Also sold to other shops as a stand-alone shop-management SaaS product.
 *
 * - PRODUCT_BRAND ("MMAR Care")  →  the monthly maintenance plan /
 *   membership subscription customers can buy from this specific shop
 *   (Mike's Mobile Auto Repair). It is a product offering, NOT an app or
 *   portal. Customers manage their MMAR Care plan inside the Garage Ace app.
 *
 * Rule of thumb when choosing which to use:
 *   - Anything app/portal/login related → PLATFORM_BRAND (Garage Ace)
 *   - The monthly maintenance subscription / membership → PRODUCT_BRAND (MMAR Care)
 *   - Inside the app, the user's plan reads "Your MMAR Care membership"
 *     (the plan is the product; the app is Garage Ace)
 */

export const PLATFORM_BRAND = {
  name: "Garage Ace",
  tagline: "Your car, your phone, your peace of mind",
} as const;

export const PRODUCT_BRAND = {
  name: "MMAR Care",
  tagline: "Monthly maintenance plans for your vehicle",
  shopName: "Mike's Mobile Auto Repair",
} as const;
