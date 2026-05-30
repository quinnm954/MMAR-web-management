## Problem

When a user clicks the password-reset link in their email, Supabase signs them in with a recovery session and then our existing `Login` and protected-route redirects send them straight to their dashboard. They never see the "set new password" screen.

## Fix

Detect the Supabase `PASSWORD_RECOVERY` auth event and pin the user on `/set-password` until they actually save a new password.

### 1. `src/hooks/useAuth.tsx`

- Add `isPasswordRecovery: boolean` to the context.
- In `onAuthStateChange`, when `event === "PASSWORD_RECOVERY"`, set `isPasswordRecovery = true` and persist a marker in `sessionStorage` (so a hard refresh on `/set-password` keeps the state).
- Expose a `clearPasswordRecovery()` helper that flips the flag off and removes the sessionStorage marker.
- On initial mount, hydrate `isPasswordRecovery` from sessionStorage.
- In `signOut`, clear the flag.

### 2. `src/pages/SetPassword.tsx`

- After `supabase.auth.updateUser({ password })` succeeds, call `clearPasswordRecovery()` before navigating to the role-based destination.

### 3. Redirect guards — short-circuit to `/set-password` while recovering

In each of these, if `isPasswordRecovery` is true and the current path isn't `/set-password`, redirect to `/set-password`:

- `src/pages/Login.tsx` — at the top of the post-auth `useEffect`, before the role-based routing.
- `src/components/portal/CustomerProtectedRoute.tsx`
- `src/components/tech/TechProtectedRoute.tsx`
- `src/components/admin/ProtectedRoute.tsx`

These already check `must_set_password`; we add the recovery check next to it.

### 4. `src/pages/Login.tsx` — reset-password CTA copy

The existing "Forgot?" handler already uses `redirectTo: origin + "/set-password"`, which stays correct. No change needed there.

## Out of scope

- The auth-email-hook recovery template (no custom templates are scaffolded in this project — Supabase's default recovery email already lands on the `redirectTo` URL we set).
- First-time `must_set_password` flow — unchanged and still works alongside this.
