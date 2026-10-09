# Auth & onboarding

> **There is no server session yet.** Authentication is a **client-side flag** in
> `localStorage`, and the account a new user creates is stored in `localStorage` too.
> This gates and personalizes the UI; it does **not** enforce access. The dashboard
> route itself is not protected — anyone who navigates to `/dashboard` loads it.
> Replace the helpers in [`app/lib/profile.ts`](../app/lib/profile.ts) with real API
> calls when a backend lands.

## Flow

```
/auth?mode=signup ──submit──▶ /onboarding ──submit──▶ /dashboard
  (name, email, pwd)           (company, website)       (account created)

/auth (sign in) ──submit──▶ /dashboard
```

- **Sign up** ([`app/auth/page.tsx`](../app/auth/page.tsx)) sets the auth flag, saves a
  **signup draft** (`name`, `email`, `company`), and routes to **/onboarding**.
- **Sign in** sets the auth flag and routes straight to **/dashboard**.
- **Onboarding** ([`app/onboarding/page.tsx`](../app/onboarding/page.tsx)) prefills name
  + email from the draft, collects **company name** and **website**, then builds the
  full profile (generating an `orgId`, `plan: 'Pro'`, `role: 'admin'`), saves it, clears
  the draft, and routes to the dashboard.

The password field and the GitHub/Google buttons are **UI only** — there is no
credential verification or OAuth.

## Landing-page gating

The marketing page's **Launch scan** CTAs run through `useLaunchScan()`
([`app/page.tsx`](../app/page.tsx)): if the auth flag is set they go to `/dashboard`,
otherwise to `/auth?mode=signup`. So a signed-in visitor goes straight to the app; a new
visitor is sent to sign up first.

## The profile store

[`app/lib/profile.ts`](../app/lib/profile.ts) is the single source of truth for the
client account. Keys in `localStorage`:

| Key | Holds |
|-----|-------|
| `rs_authed` | `"1"` when signed in |
| `rs_profile` | the `Profile` JSON |
| `rs_signup_draft` | name/email/company captured at sign-up, consumed by onboarding |

### `Profile`

```ts
interface Profile {
  name: string;
  email: string;
  company: string;
  website: string;
  orgId: string;     // "org_" + 26 Crockford-base32 chars (ULID-like)
  plan: string;      // defaults to "Pro" at onboarding
  role: string;      // "admin"
  twoFactor: boolean;
  createdAt: string; // ISO
}
```

### Exposed helpers

`loadProfile` · `saveProfile` · `updateProfile(patch)` · `loadSignupDraft` ·
`saveSignupDraft` · `clearSignupDraft` · `setAuthed(bool)` · `isAuthed()` ·
`signOut()` (clears all three keys) · `generateOrgId()` · `initials(name)`.

All reads/writes are wrapped in `try/catch` so they're safe during SSR and in private
windows where `localStorage` may throw.

## Where the dashboard reads it

The dashboard loads the profile on mount to render the sidebar user card and to compute
the [schedule plan gating](dashboard.md#scheduling). Settings reads and writes it for
every field. Because the reads happen in a `useEffect` after mount (not during render),
there's no hydration mismatch.

## Turning this into real auth (future)

1. Add a backend session (e.g. cookie + server session or a provider like NextAuth).
2. Protect `/dashboard` and `/dashboard/settings` (middleware or a server check).
3. Protect the `/api/scan*` routes.
4. Swap the `profile.ts` helpers for API calls; keep the same function names so the UI
   doesn't change.
