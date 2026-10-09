# Settings

Settings live at **`/dashboard/settings`**
([`app/dashboard/settings/page.tsx`](../app/dashboard/settings/page.tsx)) — a client
component with its own left nav and six sections. It reads and writes the client-side
[profile](auth-onboarding.md#the-profile-store).

| Section | Status |
|---------|--------|
| General | Functional (persists to the profile) |
| Members | Lists the owner; invite is a stub |
| Billing | Full layout; actions are stubs |
| Integrations | Full catalog; Connect is a stub |
| Audit Logs | Empty state |
| Help & Support | External links |

## General

- **Account** — avatar (initials), name, email, **Sign out** (clears the profile + auth and returns to `/`).
- **Plan** — current plan badge + **Manage billing** (switches to the Billing tab).
- **Security** — **Two-factor authentication** toggle. Persists `twoFactor` to the profile (UI only — no real TOTP enrollment).
- **Organization** — editable org **Name** (Save), read-only **Organization ID** with **Copy**, and **Your role** (`admin`).
- **Danger zone** — **Delete organization** / **Delete account**, each behind a confirm modal. Both clear the client profile + auth and return to `/` (there's no server data to delete).

## Members

A **Members** table (Member / Role / Joined) listing the current user with a "You" tag
and `admin` role, plus a **Pending invitations** table with an empty state. **Invite
member** shows a toast explaining it needs a connected email provider.

## Billing

Rendered in full, matching the intended product layout; every action is a stub that
explains what it would need:

- **Credits** — balance (0.00) + Top up, active developers (0) + breakdown.
- **Payment method** — Add card; "No card saved / Missing".
- **Auto top-up** — toggle.
- **Add a card to keep using RedSuture** — Add card.
- **Enterprise** — Talk to a human / View plans.
- **Startup program** — Apply.

## Integrations

A catalog grouped by purpose. Each row's **Connect** button shows a toast noting it
needs a connected provider. Brand marks are original simplified SVGs in
[`app/components/brands.tsx`](../app/components/brands.tsx).

| Group | Services |
|-------|----------|
| Code providers | GitHub, GitLab, Bitbucket |
| Notifications | Slack |
| Issue tracking | Jira, Linear |
| Infrastructure (over MCP) | AWS, Vercel, Supabase, Cloudflare, Google Cloud, Railway |
| Knowledge MCPs | search + "Add an MCP server" (empty state) |

## Audit Logs

An empty state ("No audit events yet") — there's no audit log backend to read from.

## Help & Support

External links: **Documentation** (the engine on GitHub) and **Contact support**
(`mailto:`).

## Layout

The settings content spans the full width of the main area (the earlier 720px cap was
removed), with a sticky left nav. It collapses to a horizontal nav and single-column
cards on narrow screens.
