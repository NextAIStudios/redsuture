# Pricing

The marketing page's pricing section is a five-tier ladder defined in the `PLANS` array
in [`app/page.tsx`](../app/page.tsx). It starts at an entry tier and ramps up to and
past the Team package.

| Tier | Price | Scans / month | For |
|------|-------|---------------|-----|
| **Starter** | $29/mo | 5 | Solo developers and side projects |
| **Launch** | $79/mo | 12 | Small teams shipping regularly |
| **Team** ⭐ | $199/mo | 25 | Engineering teams (marked **Most popular**) |
| **Scale** | $599/mo | 100 | Orgs with complex architectures & compliance |
| **Enterprise** | Custom | Unlimited | Private deployment, custom models, SSO |

Each tier is additive ("Everything in *previous*, plus …"), so the feature set grows
with the price. Every CTA links to `/auth?mode=signup` (Enterprise says "Contact sales").

## Layout

The pricing grid ([`app/page.module.css`](../app/page.module.css)) is responsive for
five cards:

| Viewport | Columns |
|----------|---------|
| default (desktop) | 5 |
| ≤ 1240px | 3 |
| ≤ 860px | 2 |
| ≤ 560px | 1 (centered) |

## How plans relate to the app

A plan name also drives **scan-schedule gating** in the dashboard. `planTier()`
([`app/dashboard/page.tsx`](../app/dashboard/page.tsx)) maps a plan string to a tier:

- `enterprise` → 3
- `pro` / `scale` / `business` → 2
- `team` / `starter` → 1
- unknown → 2

Higher tiers unlock more frequent automated scans (daily, on-every-PR). See
[Dashboard → Scheduling](dashboard.md#scheduling).

> **Known gap:** onboarding currently sets a new account's `plan` to `"Pro"`, which
> isn't one of the ladder's tier names (`Starter`/`Launch`/`Team`/`Scale`/`Enterprise`).
> `planTier()` still resolves `"Pro"` sensibly (tier 2), but aligning the onboarding
> default to a real tier name is a small, worthwhile follow-up.
