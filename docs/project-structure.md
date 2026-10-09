# Project structure

RedSuture uses the Next.js App Router. Everything lives under `app/`.

```
app/
├── layout.tsx                 Root layout + <head> metadata
├── globals.css                Design tokens, buttons, badges, resets
├── page.tsx                   Landing page (nav, hero, pricing, FAQ, CTAs)
├── page.module.css            Landing styles
│
├── auth/
│   ├── layout.tsx             Suspense wrapper (useSearchParams)
│   ├── page.tsx               Sign in / create account
│   └── auth.module.css
│
├── onboarding/
│   ├── page.tsx               Company + website step after sign-up
│   └── onboarding.module.css
│
├── dashboard/
│   ├── page.tsx               Overview / New scan / Findings / History + live agents
│   ├── dashboard.module.css
│   └── settings/
│       ├── page.tsx           General / Members / Billing / Integrations / Audit / Help
│       └── settings.module.css
│
├── api/
│   ├── scan/
│   │   ├── route.ts           POST (start) + GET (list) scans
│   │   ├── engine.ts          runScan(): spawn the engine, model fallback
│   │   └── [runId]/route.ts   GET status/logs/agents/steps/findings
│   └── github/pr/route.ts     POST: build a fix-PR payload (stub)
│
├── components/
│   ├── icons.tsx              Shared inline SVG icon set
│   ├── brands.tsx             Simplified brand marks for integrations
│   ├── Logo.tsx               Brand logo component
│   └── logo.module.css
│
└── lib/
    └── profile.ts             Client-side profile/auth store (localStorage)
```

## Key files at a glance

| File | Responsibility |
|------|----------------|
| [`app/page.tsx`](../app/page.tsx) | Marketing page; `PLANS`, `useLaunchScan()` gating |
| [`app/dashboard/page.tsx`](../app/dashboard/page.tsx) | The whole dashboard; scan launch, polling, agents, steps, scheduling |
| [`app/dashboard/settings/page.tsx`](../app/dashboard/settings/page.tsx) | Settings sections |
| [`app/api/scan/route.ts`](../app/api/scan/route.ts) | Start / list scans |
| [`app/api/scan/engine.ts`](../app/api/scan/engine.ts) | the engine runner + model fallback |
| [`app/api/scan/[runId]/route.ts`](../app/api/scan/[runId]/route.ts) | Live scan status + SARIF / agent / step parsing |
| [`app/lib/profile.ts`](../app/lib/profile.ts) | Account store + auth flag |
| [`app/globals.css`](../app/globals.css) | Design system |

## Conventions

- **Styling:** every page/feature has a co-located `*.module.css`; shared primitives are
  global classes + CSS variables in `globals.css`. Class names referenced from TSX must
  exist in the module — a missing one renders as the literal string `undefined` (this
  bug shipped once and was fixed in `e251173`; a quick guard is to diff `styles.X`
  references against `.X` definitions).
- **Icons:** add to `components/icons.tsx` (functional, `currentColor`) or
  `components/brands.tsx` (coloured brand marks).
- **Client vs server:** interactive pages are `'use client'`; API routes are server
  handlers that may spawn processes and read the filesystem.

## Ignored / generated paths

| Path | Note |
|------|------|
| `scan_runs/` | Scan output written by the engine (git-ignored) |
| `.env.local` | Secrets (git-ignored; only `.env.example` is committed) |
| `.next/`, `node_modules/` | Build output / deps |

## Not tracked here

The repo does **not** contain a database, auth backend, payment, or scheduler — those
are the main areas to build next. See [Auth & onboarding](auth-onboarding.md#turning-this-into-real-auth-future)
and the "boundary" notes throughout these docs.
