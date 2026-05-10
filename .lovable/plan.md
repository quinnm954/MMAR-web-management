## Goals

1. Customer signup asks for **only name + email** — no password, no address, no vehicles.
2. After they click the email link → they land on **Set Password** → then **Onboarding** (address + vehicles + service history) → then dashboard.
3. Replace the unified `/login` page with **dedicated** login pages for customers, staff, and admins.

## Current state (already in place)

- `PortalSignup` already collects only name + email and sends a magic link with `must_set_password: true`.
- `SetPassword` page exists and clears the flag.
- `CustomerProtectedRoute` already redirects to `/set-password` if the flag is set, then to `/portal/onboarding` if profile/vehicle is incomplete.
- `AdminLogin` exists at `/admin/login`.
- The unified `/login` page (`src/pages/Login.tsx`) lets you pick "Customer / Employee / Admin" — this is what we're removing.

## Changes

### 1. Signup → first-login flow polish
- `PortalSignup`: tighten copy so it's obvious the next step is "set password, then add vehicles." No functional change to the form itself.
- `SetPassword`: after saving the password, route customers to `/portal/onboarding` (not `/portal/dashboard`) so the next step is unmistakable. Staff/admin still route to their dashboards.
- `CustomerProtectedRoute`: no change — already enforces password → onboarding → dashboard order.

### 2. New dedicated **Staff Login** page
- New file: `src/pages/staff/StaffLogin.tsx` (employees: technician, service_advisor, manager, parts).
- Same look as `AdminLogin` but validates against the staff role set; redirects to `/tech` on success.
- Add route `/staff/login` in `src/App.tsx`.

### 3. Retire the unified `/login`
- Delete `src/pages/Login.tsx` and its route.
- Update remaining references:
  - `src/components/Navigation.tsx` (desktop + mobile "Staff sign-in" link) → point to `/staff/login`. Add a small secondary link to `/admin/login` next to it on desktop ("Admin").
  - `src/pages/SetPassword.tsx` fallback navigate → `/portal/login`.
  - `src/components/admin/ProtectedRoute.tsx` → `/admin/login`.
- Customer-facing entry points (Navigation "Sign in" button, footer, hero, etc.) already use `/portal/login` — keep as is.

### 4. Cross-link the three login pages
Each login page gets a small footer with links to the other two ("Not a customer? Staff sign-in · Admin sign-in") so a user who lands on the wrong one can self-correct.

## Files touched

```text
src/pages/portal/PortalSignup.tsx        (copy tweak)
src/pages/SetPassword.tsx                (route customers to /portal/onboarding)
src/pages/staff/StaffLogin.tsx           (NEW)
src/pages/admin/AdminLogin.tsx           (add cross-links)
src/pages/portal/PortalLogin.tsx         (add cross-links)
src/components/Navigation.tsx            (point staff link to /staff/login)
src/components/admin/ProtectedRoute.tsx  (redirect → /admin/login)
src/App.tsx                              (add /staff/login route, remove /login route + Login import)
src/pages/Login.tsx                      (DELETE)
```

## Resulting flows

- **Customer signup**: `/portal/signup` (name+email) → email link → `/set-password` → `/portal/onboarding` (address + vehicles + history) → `/portal/dashboard`.
- **Customer returning**: `/portal/login` → dashboard.
- **Staff**: `/staff/login` → `/tech`.
- **Admin**: `/admin/login` → `/admin/dashboard`.

No database, RLS, or edge-function changes are required.