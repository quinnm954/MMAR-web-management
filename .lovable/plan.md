## Goal
Replace the three separate login pages (`/portal/login`, `/admin/login`, `/staff/login`) and the public `/portal/signup` with a single unified `/login` page. Signup is restricted to customers only — staff accounts are created by admins/owners from the dashboard, who also assign roles.

## Changes

### 1. New unified auth page — `src/pages/Login.tsx`
- Tabs: **Sign In** / **Sign Up**
- **Sign In**: email + password. After login, route by role:
  - `owner` / `admin` / `manager` / `parts_advisor` / `service_advisor` → `/admin/dashboard`
  - `technician` → `/tech`
  - customer (no staff role) → `/portal/dashboard`
- **Sign Up**: customer-only (name, email, phone, password). Creates auth user + profile row, no role assignment. Clear copy: "Staff? Ask an admin to create your account."
- Includes "Forgot password" link → existing reset flow.
- Google sign-in button (existing customer pattern).

### 2. Routing — `src/App.tsx`
- Keep `/login` as the canonical route, point it at the new `Login` page.
- Make `/portal/login`, `/portal/signup`, `/admin/login`, `/staff/login` redirect to `/login` (preserve `?redirect=` param) so existing links/bookmarks keep working.
- Remove imports of `AdminLogin`, `StaffLogin`, `PortalLogin`, `PortalSignup` once redirects are in place. Delete the now-unused page files.

### 3. Admin: create staff accounts + assign roles
- Extend `src/components/admin/AdminEmployees.tsx` with an **"Invite / Create Account"** action that:
  - Calls a new edge function `admin-create-user` (service-role) which creates the auth user with a temporary password (or uses Supabase invite), inserts a `profiles` row, links to the `employees` row, and assigns initial role(s) in `user_roles`.
  - Sends the user a "set your password" link (reuses existing `/set-password` page).
- Edge function gates on `has_role(caller, 'admin' | 'owner')`.

### 4. Admin: per-account role management
- `src/components/admin/AdminRoles.tsx` already exists for role assignment — review and ensure:
  - Only `admin` / `owner` can view and mutate.
  - Supports add/remove of any role from `app_role` enum per user.
  - Owner role can only be granted by another owner (UI guard + RLS).
- No DB schema changes needed beyond what already exists (`user_roles`, `has_role`, `is_staff`).

### 5. Cleanup
- Delete `src/pages/admin/AdminLogin.tsx`, `src/pages/staff/StaffLogin.tsx`, `src/pages/portal/PortalLogin.tsx`, `src/pages/portal/PortalSignup.tsx`.
- Update any in-app links/buttons currently pointing at the old login routes to use `/login`.

## Technical notes
- Auth state flow: set up `onAuthStateChange` first, then `getSession()` (existing `useAuth` already does this).
- Role-based redirect happens after `useAuth` reports `userRoles`; show a brief loading state to avoid flashing the wrong destination.
- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` from env; verify caller JWT and role server-side.
- Owner-only-grants-owner enforced via an RLS policy on `user_roles` insert/delete: `role = 'owner' ⇒ has_role(auth.uid(), 'owner')`.

## Out of scope
- No changes to the customer portal pages themselves.
- No change to existing `/set-password` flow.
- No change to membership signup (`/portal/membership-signup`) which is a separate flow.